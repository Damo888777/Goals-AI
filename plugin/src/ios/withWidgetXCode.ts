import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";
import fs from "fs-extra";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const xcode = require("xcode");

interface WithWidgetProps {
  appGroupId?: string;
}

const EXTENSION_TARGET_NAME = "widget";
const LIVE_ACTIVITY_TARGET_NAME = "PomodoroLiveActivity";
const TOP_LEVEL_FILES = ["widget.swift", "SharedDataManager.swift", "TaskIntents.swift", "Assets.xcassets", "Info.plist"];
const LIVE_ACTIVITY_FILES = ["PomodoroLiveActivity.swift", "Info.plist"];

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
};

export const withWidgetXCode: ConfigPlugin<WithWidgetProps> = (
  config,
  options: WithWidgetProps = {}
) => {
  return withXcodeProject(config, async (newConfig) => {
    try {
      const projectName = newConfig.modRequest.projectName!;
      const projectPath = newConfig.modRequest.projectRoot;
      const platformProjectPath = newConfig.modRequest.platformProjectRoot;
      const bundleIdentifier = `${config.ios!.bundleIdentifier!}.${EXTENSION_TARGET_NAME}`;
      
      // Copy widget files
      const sourcePath = path.join(projectPath, "widget", "ios", "widget");
      const widgetPath = path.join(platformProjectPath, EXTENSION_TARGET_NAME);
      fs.copySync(sourcePath, widgetPath, { overwrite: true });
      
      // Copy Live Activity files
      const liveActivitySourcePath = path.join(projectPath, "widget", "ios", LIVE_ACTIVITY_TARGET_NAME);
      const liveActivityPath = path.join(platformProjectPath, LIVE_ACTIVITY_TARGET_NAME);
      fs.copySync(liveActivitySourcePath, liveActivityPath, { overwrite: true });
      
      // Update Xcode project
      const projPath = path.join(platformProjectPath, `${projectName}.xcodeproj`, "project.pbxproj");
      const liveActivityBundleId = `${config.ios!.bundleIdentifier!}.${LIVE_ACTIVITY_TARGET_NAME}`;
      await updateXCodeProj(projPath, bundleIdentifier, liveActivityBundleId, (config.ios as any)?.developmentTeam || "");
      
      console.log("[withWidgetXCode] Widget target dependency added to main target.");
      return newConfig;
    } catch (error) {
      console.error("[withWidgetXCode] Error:", error);
      throw error;
    }
  });
};

async function updateXCodeProj(
  projPath: string,
  widgetBundleId: string,
  liveActivityBundleId: string,
  developmentTeamId: string,
) {
  const xcodeProject = xcode.project(projPath);

  xcodeProject.parse(() => {
    // Add PBX Group for widget files
    const pbxGroup = xcodeProject.addPbxGroup(
      TOP_LEVEL_FILES,
      EXTENSION_TARGET_NAME,
      EXTENSION_TARGET_NAME,
    );

    // Add PBX Group for Live Activity files
    const liveActivityPbxGroup = xcodeProject.addPbxGroup(
      LIVE_ACTIVITY_FILES,
      LIVE_ACTIVITY_TARGET_NAME,
      LIVE_ACTIVITY_TARGET_NAME,
    );

    // Add the new PBXGroups to the top level group
    const groups = xcodeProject.hash.project.objects.PBXGroup;
    Object.keys(groups).forEach(function (groupKey) {
      if (groups[groupKey].name === undefined) {
        xcodeProject.addToPbxGroup(pbxGroup.uuid, groupKey);
        xcodeProject.addToPbxGroup(liveActivityPbxGroup.uuid, groupKey);
      }
    });

    // WORK AROUND for xcodeProject.addTarget BUG
    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] = projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] = projObjects["PBXContainerItemProxy"] || {};

    // Add widget target
    const widgetTarget = xcodeProject.addTarget(
      EXTENSION_TARGET_NAME,
      "app_extension",
      EXTENSION_TARGET_NAME,
      widgetBundleId,
    );

    // Add Live Activity target
    const liveActivityTarget = xcodeProject.addTarget(
      LIVE_ACTIVITY_TARGET_NAME,
      "app_extension",
      LIVE_ACTIVITY_TARGET_NAME,
      liveActivityBundleId,
    );

    // Add build phases for widget
    xcodeProject.addBuildPhase(
      ["widget.swift", "SharedDataManager.swift", "TaskIntents.swift"],
      "PBXSourcesBuildPhase",
      "Sources",
      widgetTarget.uuid,
      undefined,
      "widget",
    );
    
    xcodeProject.addBuildPhase(
      ["SwiftUI.framework", "WidgetKit.framework"],
      "PBXFrameworksBuildPhase", 
      "Frameworks",
      widgetTarget.uuid,
    );
    
    xcodeProject.addBuildPhase(
      ["Assets.xcassets"],
      "PBXResourcesBuildPhase",
      "Resources",
      widgetTarget.uuid,
      undefined,
      "widget",
    );

    // Add build phases for Live Activity
    xcodeProject.addBuildPhase(
      ["PomodoroLiveActivity.swift"],
      "PBXSourcesBuildPhase",
      "Sources",
      liveActivityTarget.uuid,
      undefined,
      LIVE_ACTIVITY_TARGET_NAME,
    );
    
    xcodeProject.addBuildPhase(
      ["SwiftUI.framework", "WidgetKit.framework", "ActivityKit.framework"],
      "PBXFrameworksBuildPhase", 
      "Frameworks",
      liveActivityTarget.uuid,
    );

    // Update build configurations
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== "undefined") {
        const productName = configurations[key].buildSettings.PRODUCT_NAME;
        if (productName === `"${EXTENSION_TARGET_NAME}"`) {
          const buildSettings = {
            ...configurations[key].buildSettings,
            ...BUILD_CONFIGURATION_SETTINGS,
            PRODUCT_BUNDLE_IDENTIFIER: widgetBundleId,
            DEVELOPMENT_TEAM: developmentTeamId,
            LD_RUNPATH_SEARCH_PATHS: `"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"`,
          };
          configurations[key].buildSettings = buildSettings;
        }
        if (productName === `"${LIVE_ACTIVITY_TARGET_NAME}"`) {
          const buildSettings = {
            ...configurations[key].buildSettings,
            ...BUILD_CONFIGURATION_SETTINGS,
            PRODUCT_BUNDLE_IDENTIFIER: liveActivityBundleId,
            DEVELOPMENT_TEAM: developmentTeamId,
            LD_RUNPATH_SEARCH_PATHS: `"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"`,
            IPHONEOS_DEPLOYMENT_TARGET: "16.2",
          };
          configurations[key].buildSettings = buildSettings;
        }
      }
    }

    // Add ActivityKit framework to main app target
    const targets = xcodeProject.hash.project.objects.PBXNativeTarget;
    for (const targetKey in targets) {
      if (targets[targetKey].name && targets[targetKey].name.indexOf('quot') === -1) {
        const targetName = targets[targetKey].name.replace(/"/g, '');
        if (targetName === xcodeProject.productName) {
          // Add ActivityKit framework to main app
          xcodeProject.addFramework('ActivityKit.framework', {
            target: targetKey,
            link: true
          });
        }
      }
    }

    // Write the updated project file
    fs.writeFileSync(projPath, xcodeProject.writeSync());
  });
}