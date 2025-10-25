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
    // ✅ OneSignal AppDelegate Integration (survives prebuild)
    config = (0, config_plugins_1.withAppDelegate)(config, (config) => {
        const { modResults } = config;
        // Add OneSignal import
        if (!modResults.contents.includes('#import <OneSignalFramework/OneSignalFramework.h>')) {
            modResults.contents = modResults.contents.replace('#import <React/RCTLinkingManager.h>', '#import <React/RCTLinkingManager.h>\n#import <OneSignalFramework/OneSignalFramework.h>');
        }
        // Add OneSignal initialization
        const oneSignalInit = `
  // Initialize OneSignal with Live Activities
  [OneSignal initialize:@"bcd988a6-d832-4c7c-83bf-4af40c46bf53" withLaunchOptions:launchOptions];
  
  // Setup Live Activities for iOS 16.1+
  if (@available(iOS 16.1, *)) {
    [OneSignal.LiveActivities setupDefault];
  }
`;
        if (!modResults.contents.includes('OneSignal initialize')) {
            modResults.contents = modResults.contents.replace('self.initialProps = @{};', `self.initialProps = @{};${oneSignalInit}`);
        }
        return config;
    });
    // ✅ Übergib Parameter an dein iOS Widget Setup
    config = (0, withWidgetIos_1.withWidgetIos)(config, { ...options, appGroupId });
    // ✅ Remove OneSignalNotificationServiceExtension target completely
    config = (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const fs = require('fs-extra');
            const path = require('path');
            const xcode = require('xcode');
            const projectPath = path.join(config.modRequest.platformProjectRoot, `${config.modRequest.projectName}.xcodeproj/project.pbxproj`);
            if (fs.existsSync(projectPath)) {
                const xcodeProject = xcode.project(projectPath);
                await new Promise((resolve, reject) => {
                    xcodeProject.parse((err) => {
                        if (err)
                            reject(err);
                        else
                            resolve(undefined);
                    });
                });
                // Remove OneSignalNotificationServiceExtension target
                const targets = xcodeProject.pbxNativeTargetSection();
                let targetToRemove = null;
                for (const uuid in targets) {
                    if (uuid.endsWith('_comment'))
                        continue;
                    const target = targets[uuid];
                    if (target && target.name === 'OneSignalNotificationServiceExtension') {
                        targetToRemove = uuid;
                        console.log('Found OneSignalNotificationServiceExtension target to remove');
                        break;
                    }
                }
                if (targetToRemove) {
                    // Remove the target from project
                    delete xcodeProject.hash.project.objects.PBXNativeTarget[targetToRemove];
                    delete xcodeProject.hash.project.objects.PBXNativeTarget[targetToRemove + '_comment'];
                    // Remove from root project targets list
                    const rootProject = xcodeProject.hash.project.objects.PBXProject;
                    for (const projUuid in rootProject) {
                        if (projUuid.endsWith('_comment'))
                            continue;
                        const proj = rootProject[projUuid];
                        if (proj && proj.targets) {
                            proj.targets = proj.targets.filter((target) => target.value !== targetToRemove);
                        }
                    }
                    // Write the modified project
                    fs.writeFileSync(projectPath, xcodeProject.writeSync());
                    console.log('Successfully removed OneSignalNotificationServiceExtension target from Xcode project');
                }
                else {
                    console.log('OneSignalNotificationServiceExtension target not found in project');
                }
            }
            return config;
        }
    ]);
    return config;
};
exports.default = withWidget;
//# sourceMappingURL=index.js.map