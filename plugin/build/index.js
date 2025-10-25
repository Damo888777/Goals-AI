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
                    // Remove the target completely from all sections
                    const projectObjects = xcodeProject.hash.project.objects;
                    // 1. Remove from PBXNativeTarget
                    delete projectObjects.PBXNativeTarget[targetToRemove];
                    delete projectObjects.PBXNativeTarget[targetToRemove + '_comment'];
                    // 2. Remove from root project targets list
                    const rootProject = projectObjects.PBXProject;
                    for (const projUuid in rootProject) {
                        if (projUuid.endsWith('_comment'))
                            continue;
                        const proj = rootProject[projUuid];
                        if (proj && proj.targets) {
                            proj.targets = proj.targets.filter((target) => target.value !== targetToRemove);
                        }
                    }
                    // 3. Remove build files and file references
                    for (const section in projectObjects) {
                        const sectionData = projectObjects[section];
                        if (typeof sectionData === 'object') {
                            for (const uuid in sectionData) {
                                if (uuid.endsWith('_comment'))
                                    continue;
                                const item = sectionData[uuid];
                                if (item && typeof item === 'object') {
                                    // Remove references to OneSignalNotificationServiceExtension
                                    if (JSON.stringify(item).includes('OneSignalNotificationServiceExtension')) {
                                        delete sectionData[uuid];
                                        delete sectionData[uuid + '_comment'];
                                    }
                                }
                            }
                        }
                    }
                    // 4. Remove file groups
                    const pbxGroups = projectObjects.PBXGroup;
                    for (const groupUuid in pbxGroups) {
                        if (groupUuid.endsWith('_comment'))
                            continue;
                        const group = pbxGroups[groupUuid];
                        if (group && group.name === 'OneSignalNotificationServiceExtension') {
                            delete pbxGroups[groupUuid];
                            delete pbxGroups[groupUuid + '_comment'];
                        }
                        // Remove references from parent groups
                        if (group && group.children) {
                            group.children = group.children.filter((child) => {
                                const childGroup = pbxGroups[child.value];
                                return childGroup && childGroup.name !== 'OneSignalNotificationServiceExtension';
                            });
                        }
                    }
                    // Write the modified project
                    fs.writeFileSync(projectPath, xcodeProject.writeSync());
                    console.log('Successfully removed OneSignalNotificationServiceExtension target from Xcode project');
                }
                else {
                    console.log('OneSignalNotificationServiceExtension target not found in project');
                }
                // Remove OneSignalNotificationServiceExtension directory from filesystem
                const extensionDir = path.join(config.modRequest.platformProjectRoot, 'OneSignalNotificationServiceExtension');
                if (fs.existsSync(extensionDir)) {
                    fs.removeSync(extensionDir);
                    console.log('Removed OneSignalNotificationServiceExtension directory from filesystem');
                }
            }
            return config;
        }
    ]);
    return config;
};
exports.default = withWidget;
//# sourceMappingURL=index.js.map