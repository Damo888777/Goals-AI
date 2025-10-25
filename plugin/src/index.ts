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

  // ✅ Configure OneSignal Podfile targets and NSE Info.plist
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const fs = require('fs-extra');
      const path = require('path');
      
      // 1. Update NSE Info.plist with custom app group
      const nseInfoPlistPath = path.join(
        config.modRequest.platformProjectRoot,
        'OneSignalNotificationServiceExtension',
        'Info.plist'
      );
      
      if (fs.existsSync(nseInfoPlistPath)) {
        let plistContent = fs.readFileSync(nseInfoPlistPath, 'utf8');
        
        if (!plistContent.includes('OneSignal_app_groups_key')) {
          plistContent = plistContent.replace(
            '</dict>\n</plist>',
            `\t<key>OneSignal_app_groups_key</key>\n\t<string>${appGroupId}</string>\n</dict>\n</plist>`
          );
          fs.writeFileSync(nseInfoPlistPath, plistContent);
          console.log('✅ Added OneSignal_app_groups_key to NSE Info.plist');
        }
      }

      // 2. Force correct app group in ALL entitlement files
      const entitlementFiles = [
        'GoalsAI/GoalsAI.entitlements',
        'OneSignalNotificationServiceExtension/OneSignalNotificationServiceExtension.entitlements',
        'widget/widget.entitlements',
        'PomodoroLiveActivity/PomodoroLiveActivity.entitlements'
      ];
      
      const correctAppGroup = appGroupId;
      const wrongAppGroup = `${appGroupId}.onesignal`;
      
      for (const entitlementFile of entitlementFiles) {
        const entitlementPath = path.join(
          config.modRequest.platformProjectRoot,
          entitlementFile
        );
        
        if (fs.existsSync(entitlementPath)) {
          let content = fs.readFileSync(entitlementPath, 'utf8');
          
          // Remove OneSignal's auto-generated app group
          content = content.replace(
            new RegExp(`<string>${wrongAppGroup}</string>`, 'g'),
            ''
          );
          
          // Ensure only correct app group exists
          if (!content.includes(correctAppGroup)) {
            content = content.replace(
              '<key>com.apple.security.application-groups</key>\n\t<array>',
              `<key>com.apple.security.application-groups</key>\n\t<array>\n\t\t<string>${correctAppGroup}</string>`
            );
          }
          
          // Remove empty array entries and duplicates
          content = content.replace(/<string><\/string>/g, '');
          content = content.replace(/\n\s*\n/g, '\n');
          
          fs.writeFileSync(entitlementPath, content);
          console.log(`✅ Fixed app group in ${entitlementFile}`);
        }
      }
      
      // Add OneSignal targets to Podfile
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
      
      return config;
    }
  ]);

  return config
}

export default withWidget
