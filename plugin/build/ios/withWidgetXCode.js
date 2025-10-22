"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetXCode = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xcode = require("xcode");
const EXTENSION_TARGET_NAME = "widget";
const LIVE_ACTIVITY_TARGET_NAME = "PomodoroLiveActivity";
const TOP_LEVEL_FILES = ["widget.swift", "SharedDataManager.swift", "TaskIntents.swift", "TaskCompletionIntent.swift", "Assets.xcassets", "Info.plist", "widget.entitlements"];
const LIVE_ACTIVITY_TARGET_FILES = ["PomodoroLiveActivity.swift", "Info.plist", "Assets.xcassets"];
const LIVE_ACTIVITY_FILES = ["LiveActivityModule.swift", "LiveActivityModule.m"];
const WIDGET_KIT_FILES = ["WidgetKitReloader.swift", "WidgetKitReloader.m"];
const WIDGET_BUILD_CONFIGURATION_SETTINGS = {
    ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
    ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME: "WidgetBackground",
    CLANG_ANALYZER_NONNULL: "YES",
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
    CLANG_CXX_LANGUAGE_STANDARD: '"gnu++17"',
    CLANG_ENABLE_OBJC_WEAK: "YES",
    CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
    CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: "1",
    DEBUG_INFORMATION_FORMAT: "dwarf",
    GCC_C_LANGUAGE_STANDARD: "gnu11",
    GENERATE_INFOPLIST_FILE: "YES",
    INFOPLIST_FILE: "widget/Info.plist",
    INFOPLIST_KEY_CFBundleDisplayName: "widget",
    INFOPLIST_KEY_NSHumanReadableCopyright: '""',
    IPHONEOS_DEPLOYMENT_TARGET: "17.0",
    LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
    MARKETING_VERSION: "1.0",
    MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
    MTL_FAST_MATH: "YES",
    PRODUCT_NAME: '"$(TARGET_NAME)"',
    SKIP_INSTALL: "YES",
    SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_OPTIMIZATION_LEVEL: "-Onone",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: '"1,2"',
    CODE_SIGN_ENTITLEMENTS: "widget/widget.entitlements",
};
const LIVE_ACTIVITY_BUILD_CONFIGURATION_SETTINGS = {
    ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
    CLANG_ANALYZER_NONNULL: "YES",
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
    CLANG_CXX_LANGUAGE_STANDARD: '"gnu++17"',
    CLANG_ENABLE_OBJC_WEAK: "YES",
    CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
    CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: "1",
    DEBUG_INFORMATION_FORMAT: "dwarf",
    GCC_C_LANGUAGE_STANDARD: "gnu11",
    GENERATE_INFOPLIST_FILE: "YES",
    INFOPLIST_FILE: "PomodoroLiveActivity/Info.plist",
    INFOPLIST_KEY_CFBundleDisplayName: "PomodoroLiveActivity",
    INFOPLIST_KEY_NSHumanReadableCopyright: '""',
    IPHONEOS_DEPLOYMENT_TARGET: "16.2",
    LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
    MARKETING_VERSION: "1.0",
    MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
    MTL_FAST_MATH: "YES",
    PRODUCT_NAME: '"$(TARGET_NAME)"',
    SKIP_INSTALL: "YES",
    SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_OPTIMIZATION_LEVEL: "-Onone",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: '"1,2"',
};
const withWidgetXCode = (config, options = {}) => {
    // Add NSSupportsLiveActivities to main app Info.plist (required per Medium article)
    config = (0, config_plugins_1.withInfoPlist)(config, config => {
        config.modResults.NSSupportsLiveActivities = true;
        return config;
    });
    return (0, config_plugins_1.withXcodeProject)(config, async (newConfig) => {
        try {
            const projectName = newConfig.modRequest.projectName;
            const projectPath = newConfig.modRequest.projectRoot;
            const platformProjectPath = newConfig.modRequest.platformProjectRoot;
            const widgetSourceDirPath = path_1.default.join(projectPath, "widget", "ios", "widget");
            const widgetBundleId = "pro.GoalAchieverAI.widget";
            const extensionFilesDir = path_1.default.join(platformProjectPath, EXTENSION_TARGET_NAME);
            fs_extra_1.default.copySync(widgetSourceDirPath, extensionFilesDir);
            // Copy Live Activity files from /targets/pomodoro-live-activity/
            const liveActivitySourceDir = path_1.default.join(projectPath, "targets", "pomodoro-live-activity");
            const liveActivityBundleId = "pro.GoalAchieverAI.PomodoroLiveActivity";
            const liveActivityTargetDir = path_1.default.join(platformProjectPath, LIVE_ACTIVITY_TARGET_NAME);
            if (fs_extra_1.default.existsSync(liveActivitySourceDir)) {
                fs_extra_1.default.copySync(liveActivitySourceDir, liveActivityTargetDir);
            }
            // Copy Live Activities and WidgetKit files to main app target
            const nativeModulesSourceDir = path_1.default.join(projectPath, "plugin", "src", "ios");
            const mainAppDir = platformProjectPath;
            const allNativeFiles = [...LIVE_ACTIVITY_FILES, ...WIDGET_KIT_FILES];
            allNativeFiles.forEach(file => {
                const sourcePath = path_1.default.join(nativeModulesSourceDir, file);
                const destPath = path_1.default.join(mainAppDir, file);
                if (fs_extra_1.default.existsSync(sourcePath)) {
                    fs_extra_1.default.copySync(sourcePath, destPath);
                }
            });
            const projPath = `${newConfig.modRequest.platformProjectRoot}/${projectName}.xcodeproj/project.pbxproj`;
            await updateXCodeProj(projPath, widgetBundleId, liveActivityBundleId, options.devTeamId || "");
            return newConfig;
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    });
};
exports.withWidgetXCode = withWidgetXCode;
async function updateXCodeProj(projPath, widgetBundleId, liveActivityBundleId, developmentTeamId) {
    const xcodeProject = xcode.project(projPath);
    xcodeProject.parse(() => {
        // Add Live Activities and WidgetKit files to main app target
        const allNativeFiles = [...LIVE_ACTIVITY_FILES, ...WIDGET_KIT_FILES];
        const mainTarget = xcodeProject.getFirstTarget();
        allNativeFiles.forEach(file => {
            try {
                xcodeProject.addSourceFile(file, {}, mainTarget.uuid);
            }
            catch (error) {
                console.warn(`Warning: Could not add source file ${file}:`, error instanceof Error ? error.message : String(error));
            }
        });
        const pbxGroup = xcodeProject.addPbxGroup(TOP_LEVEL_FILES, EXTENSION_TARGET_NAME, EXTENSION_TARGET_NAME);
        // Add the new PBXGroup to the top level group. This makes the
        // files / folder appear in the file explorer in Xcode.
        const groups = xcodeProject.hash.project.objects.PBXGroup;
        Object.keys(groups).forEach(function (groupKey) {
            if (groups[groupKey].name === undefined) {
                xcodeProject.addToPbxGroup(pbxGroup.uuid, groupKey);
            }
        });
        // WORK AROUND for xcodeProject.addTarget BUG
        // Xcode projects don't contain these if there is only one target
        const projObjects = xcodeProject.hash.project.objects;
        projObjects["PBXTargetDependency"] =
            projObjects["PBXTargetDependency"] || {};
        projObjects["PBXContainerItemProxy"] =
            projObjects["PBXTargetDependency"] || {};
        // add widget target
        const widgetTarget = xcodeProject.addTarget(EXTENSION_TARGET_NAME, "app_extension", EXTENSION_TARGET_NAME, widgetBundleId);
        // add widget build phases - use correct file paths
        xcodeProject.addBuildPhase(["widget/widget.swift", "widget/SharedDataManager.swift", "widget/TaskIntents.swift", "widget/TaskCompletionIntent.swift"], "PBXSourcesBuildPhase", "Sources", widgetTarget.uuid);
        xcodeProject.addBuildPhase(["SwiftUI.framework", "WidgetKit.framework", "ActivityKit.framework"], "PBXFrameworksBuildPhase", "Frameworks", widgetTarget.uuid);
        xcodeProject.addBuildPhase(["widget/Assets.xcassets"], "PBXResourcesBuildPhase", "Resources", widgetTarget.uuid);
        // add Live Activity target
        const liveActivityTarget = xcodeProject.addTarget(LIVE_ACTIVITY_TARGET_NAME, "app_extension", LIVE_ACTIVITY_TARGET_NAME, liveActivityBundleId);
        // add Live Activity build phases - use correct file path
        xcodeProject.addBuildPhase(["PomodoroLiveActivity/PomodoroLiveActivity.swift"], "PBXSourcesBuildPhase", "Sources", liveActivityTarget.uuid);
        xcodeProject.addBuildPhase(["SwiftUI.framework", "WidgetKit.framework", "ActivityKit.framework"], "PBXFrameworksBuildPhase", "Frameworks", liveActivityTarget.uuid);
        xcodeProject.addBuildPhase(["PomodoroLiveActivity/Assets.xcassets"], "PBXResourcesBuildPhase", "Resources", liveActivityTarget.uuid);
        /* Update build configurations */
        const configurations = xcodeProject.pbxXCBuildConfigurationSection();
        for (const key in configurations) {
            if (typeof configurations[key].buildSettings !== "undefined") {
                const productName = configurations[key].buildSettings.PRODUCT_NAME;
                if (productName === `"${EXTENSION_TARGET_NAME}"`) {
                    configurations[key].buildSettings = {
                        ...configurations[key].buildSettings,
                        ...WIDGET_BUILD_CONFIGURATION_SETTINGS,
                        DEVELOPMENT_TEAM: developmentTeamId,
                        PRODUCT_BUNDLE_IDENTIFIER: widgetBundleId,
                    };
                }
                if (productName === `"${LIVE_ACTIVITY_TARGET_NAME}"`) {
                    configurations[key].buildSettings = {
                        ...configurations[key].buildSettings,
                        ...LIVE_ACTIVITY_BUILD_CONFIGURATION_SETTINGS,
                        DEVELOPMENT_TEAM: developmentTeamId,
                        PRODUCT_BUNDLE_IDENTIFIER: liveActivityBundleId,
                    };
                }
            }
        }
        // Add Live Activities capability for real-time timer updates
        try {
            const targetUuid = widgetTarget.uuid;
            // Add Push Notifications and Live Activities capabilities
            xcodeProject.addTargetAttribute('SystemCapabilities', {
                'com.apple.Push': {
                    enabled: 1
                },
                'com.apple.developer.live-activities': {
                    enabled: 1
                }
            }, targetUuid);
            xcodeProject.addTargetAttribute('ProvisioningStyle', 'Automatic', targetUuid);
        }
        catch (error) {
            console.warn('Could not add Live Activities capabilities:', error instanceof Error ? error.message : String(error));
        }
        fs_extra_1.default.writeFileSync(projPath, xcodeProject.writeSync());
    });
}
//# sourceMappingURL=withWidgetXCode.js.map