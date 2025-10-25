import { ConfigPlugin, withEntitlementsPlist, withInfoPlist, withDangerousMod } from "@expo/config-plugins"
import { ExpoConfig } from "@expo/config-types"
import { withWidgetIos } from "./ios/withWidgetIos"

export interface WithWidgetProps {
  devTeamId: string
  appGroupId?: string
}

// Lockerer Typ für iOS-Objekt (erweiterbar)
interface IOSConfigMutable {
  teamId?: string
  entitlements?: Record<string, any>
  [key: string]: any
}

/**
 * Expo Config Plugin zum Einrichten eines Widget Targets mit App Group Support.
 */
const withWidget: ConfigPlugin<WithWidgetProps> = (config, options) => {
  const bundleId = config.ios?.bundleIdentifier || "com.example.app"

  // App Group ID generieren, falls keine angegeben ist
  const appGroupId =
    options.appGroupId || `group.${bundleId.replace(/[^a-zA-Z0-9.]/g, "")}`

  // iOS sicherstellen + Mutability erzwingen
  if (!config.ios) (config as ExpoConfig & { ios: IOSConfigMutable }).ios = {}
  const iosConfig = config.ios as IOSConfigMutable

  // ✅ Dev Team ID setzen
  iosConfig.teamId = options.devTeamId

  // ✅ App Group Entitlement für Haupt-App hinzufügen
  config = withEntitlementsPlist(config, (config) => {
    const rawGroups = config.modResults["com.apple.security.application-groups"]

    // Typischerweise string[] oder undefined, wir casten defensiv
    const groups: string[] = Array.isArray(rawGroups)
      ? (rawGroups as string[])
      : typeof rawGroups === "string"
      ? [rawGroups]
      : []

    if (!groups.includes(appGroupId)) {
      config.modResults["com.apple.security.application-groups"] = [
        ...groups,
        appGroupId,
      ]
    }
    return config
  })

  // ✅ Widget Target simulieren (für interne Konsistenz bei EAS)
  iosConfig["widgetTarget"] = {
    bundleIdentifier: `${bundleId}.widget`,
    entitlements: {
      "com.apple.security.application-groups": [appGroupId],
    },
  }


  // ✅ Configure OneSignal to use our existing app group
  config = withInfoPlist(config, config => {
    config.modResults.NSSupportsLiveActivities = true;
    config.modResults.OneSignal_app_groups_key = appGroupId;
    return config;
  });

  // ✅ Übergib Parameter an dein iOS Widget Setup
  config = withWidgetIos(config, { ...options, appGroupId })

  // ✅ Configure OneSignal Podfile targets
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const fs = require('fs-extra');
      const path = require('path');
      
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Add OneSignal targets if not already present
        const oneSignalTargets = `
target 'widget' do
  use_frameworks! :linkage => :static
  pod 'OneSignalXCFramework', '>= 5.0.0', '< 6.0'
end

target 'PomodoroLiveActivity' do
  use_frameworks! :linkage => :static
  pod 'OneSignalXCFramework', '>= 5.0.0', '< 6.0'
end

target 'OneSignalNotificationServiceExtension' do
  use_frameworks! :linkage => :static
  pod 'OneSignalXCFramework', '>= 5.0.0', '< 6.0'
end`;
        
        if (!podfileContent.includes("target 'widget'")) {
          podfileContent += oneSignalTargets;
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('Added OneSignal extension targets to Podfile');
        }
      }
      
      // Update OneSignalNotificationServiceExtension Info.plist
      const plist = require('@expo/plist');
      const nseInfoPlistPath = path.join(
        config.modRequest.platformProjectRoot,
        'OneSignalNotificationServiceExtension',
        'Info.plist'
      );
      
      if (fs.existsSync(nseInfoPlistPath)) {
        const nseInfoPlist = plist.parse(fs.readFileSync(nseInfoPlistPath, 'utf8'));
        nseInfoPlist.OneSignal_app_groups_key = appGroupId;
        fs.writeFileSync(nseInfoPlistPath, plist.build(nseInfoPlist));
        console.log('Added custom app group to NSE Info.plist');
      }
      
      return config;
    }
  ]);

  return config
}

export default withWidget
