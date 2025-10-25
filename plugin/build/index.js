"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withWidgetIos_1 = require("./ios/withWidgetIos");
/**
 * Expo Config Plugin zum Einrichten eines Widget Targets mit App Group Support.
 */
const withWidget = (config, options) => {
    var _a;
    const bundleId = ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier) || "com.example.app";
    // App Group ID generieren, falls keine angegeben ist
    const appGroupId = options.appGroupId || `group.${bundleId.replace(/[^a-zA-Z0-9.]/g, "")}`;
    // iOS sicherstellen + Mutability erzwingen
    if (!config.ios)
        config.ios = {};
    const iosConfig = config.ios;
    // ✅ Dev Team ID setzen
    iosConfig.teamId = options.devTeamId;
    // ✅ App Group Entitlement für Haupt-App hinzufügen
    config = (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        const rawGroups = config.modResults["com.apple.security.application-groups"];
        // Typischerweise string[] oder undefined, wir casten defensiv
        const groups = Array.isArray(rawGroups)
            ? rawGroups
            : typeof rawGroups === "string"
                ? [rawGroups]
                : [];
        if (!groups.includes(appGroupId)) {
            config.modResults["com.apple.security.application-groups"] = [
                ...groups,
                appGroupId,
            ];
        }
        return config;
    });
    // ✅ Widget Target simulieren (für interne Konsistenz bei EAS)
    iosConfig["widgetTarget"] = {
        bundleIdentifier: `${bundleId}.widget`,
        entitlements: {
            "com.apple.security.application-groups": [appGroupId],
        },
    };
    // ✅ Configure OneSignal to use our existing app group
    config = (0, config_plugins_1.withInfoPlist)(config, config => {
        config.modResults.NSSupportsLiveActivities = true;
        config.modResults.OneSignal_app_groups_key = appGroupId;
        return config;
    });
    // ✅ Übergib Parameter an dein iOS Widget Setup
    config = (0, withWidgetIos_1.withWidgetIos)(config, { ...options, appGroupId });
    // ✅ Configure OneSignal Podfile targets
    config = (0, config_plugins_1.withDangerousMod)(config, [
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
            const nseInfoPlistPath = path.join(config.modRequest.platformProjectRoot, 'OneSignalNotificationServiceExtension', 'Info.plist');
            if (fs.existsSync(nseInfoPlistPath)) {
                const nseInfoPlist = plist.parse(fs.readFileSync(nseInfoPlistPath, 'utf8'));
                nseInfoPlist.OneSignal_app_groups_key = appGroupId;
                fs.writeFileSync(nseInfoPlistPath, plist.build(nseInfoPlist));
                console.log('Added custom app group to NSE Info.plist');
            }
            return config;
        }
    ]);
    return config;
};
exports.default = withWidget;
//# sourceMappingURL=index.js.map