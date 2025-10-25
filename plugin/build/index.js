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
    // ✅ Fix OneSignal entitlements to use our existing app group (override after OneSignal plugin)
    config = (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        const entitlements = config.modResults;
        const appGroups = entitlements["com.apple.security.application-groups"];
        if (Array.isArray(appGroups)) {
            // Remove any OneSignal auto-generated app groups and keep only our app group
            entitlements["com.apple.security.application-groups"] = [appGroupId];
        }
        return config;
    });
    // ✅ Übergib Parameter an dein iOS Widget Setup
    config = (0, withWidgetIos_1.withWidgetIos)(config, { ...options, appGroupId });
    // ✅ Configure OneSignal Podfile targets and NSE Info.plist
    config = (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const fs = require('fs-extra');
            const path = require('path');
            // Update NSE Info.plist with custom app group
            const nseInfoPlistPath = path.join(config.modRequest.platformProjectRoot, 'OneSignalNotificationServiceExtension', 'Info.plist');
            if (fs.existsSync(nseInfoPlistPath)) {
                let plistContent = fs.readFileSync(nseInfoPlistPath, 'utf8');
                // Check if key already exists
                if (!plistContent.includes('OneSignal_app_groups_key')) {
                    // Add the key before closing </dict>
                    plistContent = plistContent.replace('</dict>\n</plist>', `\t<key>OneSignal_app_groups_key</key>\n\t<string>${appGroupId}</string>\n</dict>\n</plist>`);
                    fs.writeFileSync(nseInfoPlistPath, plistContent);
                    console.log('Added OneSignal_app_groups_key to NSE Info.plist');
                }
            }
            // Fix NSE entitlements to use our app group
            const nseEntitlementsPath = path.join(config.modRequest.platformProjectRoot, 'OneSignalNotificationServiceExtension', 'OneSignalNotificationServiceExtension.entitlements');
            if (fs.existsSync(nseEntitlementsPath)) {
                let entitlementsContent = fs.readFileSync(nseEntitlementsPath, 'utf8');
                // Replace any .onesignal app group with our app group
                entitlementsContent = entitlementsContent.replace(/group\.pro\.GoalAchieverAI\.onesignal/g, appGroupId);
                fs.writeFileSync(nseEntitlementsPath, entitlementsContent);
                console.log('Fixed NSE entitlements to use correct app group');
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
    return config;
};
exports.default = withWidget;
//# sourceMappingURL=index.js.map