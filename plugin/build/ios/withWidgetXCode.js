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
const TOP_LEVEL_FILES = ["widget.swift", "SharedDataManager.swift", "TaskIntents.swift", "Assets.xcassets", "Info.plist"];
const LIVE_ACTIVITY_FILES = ["LiveActivityModule.swift", "LiveActivityModule.m"];
const WIDGET_KIT_FILES = ["WidgetKitReloader.swift", "WidgetKitReloader.m"];
const BUILD_CONFIGURATION_SETTINGS = {
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
    "com.apple.developer.live-activities": "YES",
};
const withWidgetXCode = (config, options = {}) => {
    return (0, config_plugins_1.withXcodeProject)(config, async (newConfig) => {
        var _a;
        try {
            const projectName = newConfig.modRequest.projectName;
            const projectPath = newConfig.modRequest.projectRoot;
            const platformProjectPath = newConfig.modRequest.platformProjectRoot;
            const widgetSourceDirPath = path_1.default.join(projectPath, "widget", "ios", "widget");
            const bundleId = ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier) || "";
            const widgetBundleId = `${bundleId}.widget`;
            const extensionFilesDir = path_1.default.join(platformProjectPath, EXTENSION_TARGET_NAME);
            fs_extra_1.default.copySync(widgetSourceDirPath, extensionFilesDir);
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
            await updateXCodeProj(projPath, widgetBundleId, options.devTeamId || "");
            return newConfig;
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    });
};
exports.withWidgetXCode = withWidgetXCode;
async function updateXCodeProj(projPath, widgetBundleId, developmentTeamId) {
    const xcodeProject = xcode.project(projPath);
    xcodeProject.parse(() => {
        // Add Live Activities and WidgetKit files to main app target
        const allNativeFiles = [...LIVE_ACTIVITY_FILES, ...WIDGET_KIT_FILES];
        allNativeFiles.forEach(file => {
            xcodeProject.addSourceFile(file, {}, xcodeProject.getFirstTarget().uuid);
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
        // add target
        const widgetTarget = xcodeProject.addTarget(EXTENSION_TARGET_NAME, "app_extension", EXTENSION_TARGET_NAME, widgetBundleId);
        // add build phase
        xcodeProject.addBuildPhase(["widget.swift", "SharedDataManager.swift", "TaskIntents.swift"], "PBXSourcesBuildPhase", "Sources", widgetTarget.uuid, undefined, "widget");
        xcodeProject.addBuildPhase(["SwiftUI.framework", "WidgetKit.framework"], "PBXFrameworksBuildPhase", "Frameworks", widgetTarget.uuid);
        xcodeProject.addBuildPhase(["Assets.xcassets"], "PBXResourcesBuildPhase", "Resources", widgetTarget.uuid, undefined, "widget");
        /* Update build configurations */
        const configurations = xcodeProject.pbxXCBuildConfigurationSection();
        for (const key in configurations) {
            if (typeof configurations[key].buildSettings !== "undefined") {
                const productName = configurations[key].buildSettings.PRODUCT_NAME;
                if (productName === `"${EXTENSION_TARGET_NAME}"`) {
                    configurations[key].buildSettings = {
                        ...configurations[key].buildSettings,
                        ...BUILD_CONFIGURATION_SETTINGS,
                        DEVELOPMENT_TEAM: developmentTeamId,
                        PRODUCT_BUNDLE_IDENTIFIER: widgetBundleId,
                    };
                }
            }
        }
        fs_extra_1.default.writeFileSync(projPath, xcodeProject.writeSync());
    });
}
//# sourceMappingURL=withWidgetXCode.js.map