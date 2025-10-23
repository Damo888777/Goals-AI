import { ConfigPlugin, withXcodeProject, withInfoPlist } from "@expo/config-plugins";
import fs from "fs-extra";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const xcode = require("xcode");

interface WithWidgetProps {
  devTeamId?: string;
}

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

export const withWidgetXCode: ConfigPlugin<WithWidgetProps> = (
  config,
  options: WithWidgetProps = {}
) => {
  // Add NSSupportsLiveActivities to main app Info.plist (required per Medium article)
  config = withInfoPlist(config, config => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });

  return withXcodeProject(config, async newConfig => {
    try {
      const projectName = newConfig.modRequest.projectName
      const projectPath = newConfig.modRequest.projectRoot
      const platformProjectPath = newConfig.modRequest.platformProjectRoot
      const widgetSourceDirPath = path.join(projectPath, "widget", "ios", "widget");
      const widgetBundleId = "pro.GoalAchieverAI.widget";
      const extensionFilesDir = path.join(platformProjectPath, EXTENSION_TARGET_NAME);
      fs.copySync(widgetSourceDirPath, extensionFilesDir);

      // Copy Live Activity files from /targets/pomodoro-live-activity/
      const liveActivitySourceDir = path.join(projectPath, "targets", "pomodoro-live-activity");
      const liveActivityBundleId = "pro.GoalAchieverAI.PomodoroLiveActivity";
      const liveActivityTargetDir = path.join(platformProjectPath, LIVE_ACTIVITY_TARGET_NAME);
      
      if (fs.existsSync(liveActivitySourceDir)) {
        fs.copySync(liveActivitySourceDir, liveActivityTargetDir);
      }

      // Copy Live Activities and WidgetKit files to main app target (GoalsAI folder)
      const nativeModulesSourceDir = path.join(projectPath, "plugin", "src", "ios");
      const mainAppTargetDir = path.join(platformProjectPath, "GoalsAI");
      const allNativeFiles = [...LIVE_ACTIVITY_FILES, ...WIDGET_KIT_FILES];
      
      allNativeFiles.forEach(file => {
        const sourcePath = path.join(nativeModulesSourceDir, file);
        const destPath = path.join(mainAppTargetDir, file);
        if (fs.existsSync(sourcePath)) {
          fs.copySync(sourcePath, destPath);
          console.log(`Copied ${file} to GoalsAI target directory`);
        } else {
          console.warn(`Source file not found: ${sourcePath}`);
        }
      });

      const projPath = `${newConfig.modRequest.platformProjectRoot}/${projectName}.xcodeproj/project.pbxproj`
      await updateXCodeProj(projPath, widgetBundleId, liveActivityBundleId, options.devTeamId || "")
      return newConfig
    } catch (e) {
      console.error(e)
      throw e
    }
  })
};

async function updateXCodeProj(
  projPath: string,
  widgetBundleId: string,
  liveActivityBundleId: string,
  developmentTeamId: string,
) {
  const xcodeProject = xcode.project(projPath)

  xcodeProject.parse(() => {
    const pbxGroup = xcodeProject.addPbxGroup(
      TOP_LEVEL_FILES,
      EXTENSION_TARGET_NAME,
      EXTENSION_TARGET_NAME,
    )

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects.PBXGroup
    Object.keys(groups).forEach(function (groupKey) {
      if (groups[groupKey].name === undefined) {
        xcodeProject.addToPbxGroup(pbxGroup.uuid, groupKey)
      }
    })

    // WORK AROUND for xcodeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    const projObjects = xcodeProject.hash.project.objects
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {}
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {}

    // add widget target
    const widgetTarget = xcodeProject.addTarget(EXTENSION_TARGET_NAME, "app_extension", EXTENSION_TARGET_NAME, widgetBundleId)

    // add widget build phases - use correct file paths
    xcodeProject.addBuildPhase(["widget/widget.swift", "widget/SharedDataManager.swift", "widget/TaskIntents.swift", "widget/TaskCompletionIntent.swift"], "PBXSourcesBuildPhase", "Sources", widgetTarget.uuid)
    xcodeProject.addBuildPhase(["SwiftUI.framework", "WidgetKit.framework", "ActivityKit.framework"], "PBXFrameworksBuildPhase", "Frameworks", widgetTarget.uuid)
    xcodeProject.addBuildPhase(["widget/Assets.xcassets"], "PBXResourcesBuildPhase", "Resources", widgetTarget.uuid)

    // add Live Activity target
    const liveActivityTarget = xcodeProject.addTarget(LIVE_ACTIVITY_TARGET_NAME, "app_extension", LIVE_ACTIVITY_TARGET_NAME, liveActivityBundleId)

    // add Live Activity build phases - use correct file path
    xcodeProject.addBuildPhase(["PomodoroLiveActivity/PomodoroLiveActivity.swift"], "PBXSourcesBuildPhase", "Sources", liveActivityTarget.uuid)
    xcodeProject.addBuildPhase(["SwiftUI.framework", "WidgetKit.framework", "ActivityKit.framework"], "PBXFrameworksBuildPhase", "Frameworks", liveActivityTarget.uuid)
    xcodeProject.addBuildPhase(["PomodoroLiveActivity/Assets.xcassets"], "PBXResourcesBuildPhase", "Resources", liveActivityTarget.uuid)

    /* Update build configurations */
    const configurations = xcodeProject.pbxXCBuildConfigurationSection()

    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== "undefined") {
        const productName = configurations[key].buildSettings.PRODUCT_NAME
        if (productName === `"${EXTENSION_TARGET_NAME}"`) {
          configurations[key].buildSettings = {
            ...configurations[key].buildSettings,
            ...WIDGET_BUILD_CONFIGURATION_SETTINGS,
            DEVELOPMENT_TEAM: developmentTeamId,
            PRODUCT_BUNDLE_IDENTIFIER: widgetBundleId,
          }
        }
        if (productName === `"${LIVE_ACTIVITY_TARGET_NAME}"`) {
          configurations[key].buildSettings = {
            ...configurations[key].buildSettings,
            ...LIVE_ACTIVITY_BUILD_CONFIGURATION_SETTINGS,
            DEVELOPMENT_TEAM: developmentTeamId,
            PRODUCT_BUNDLE_IDENTIFIER: liveActivityBundleId,
          }
        }
      }
    }

    // Add Live Activities capability for real-time timer updates
    try {
      const targetUuid = widgetTarget.uuid
      
      // Add Push Notifications and Live Activities capabilities
      xcodeProject.addTargetAttribute('SystemCapabilities', {
        'com.apple.Push': {
          enabled: 1
        },
        'com.apple.developer.live-activities': {
          enabled: 1
        }
      }, targetUuid)
      
      xcodeProject.addTargetAttribute('ProvisioningStyle', 'Automatic', targetUuid)
    } catch (error) {
      console.warn('Could not add Live Activities capabilities:', error instanceof Error ? error.message : String(error))
    }

    // Add native module files to main app target
    const allNativeFiles = [...LIVE_ACTIVITY_FILES, ...WIDGET_KIT_FILES]
    
    // Get all native targets and find the main app target
    const nativeTargets = xcodeProject.pbxNativeTargetSection()
    let mainTargetUuid: string | null = null
    
    // Look for the main app target (should be the first one that's not a widget/extension)
    for (const uuid in nativeTargets) {
      if (uuid.endsWith('_comment')) continue // Skip comment entries
      
      const target = nativeTargets[uuid]
      if (target && target.name && target.name.includes('GoalsAI') && !target.name.includes('Widget') && !target.name.includes('Extension')) {
        mainTargetUuid = uuid
        console.log(`Found main target: ${target.name} with UUID: ${uuid}`)
        break
      }
    }
    
    if (mainTargetUuid) {
      // Use addBuildPhase method which is more reliable for adding source files
      const sourceFiles = allNativeFiles.map(file => `GoalsAI/${file}`)
      
      try {
        // Add all native module files to the sources build phase at once
        xcodeProject.addBuildPhase(sourceFiles, "PBXSourcesBuildPhase", "Sources", mainTargetUuid)
        console.log(`Successfully added native module files to main target: ${allNativeFiles.join(', ')}`)
      } catch (error) {
        console.warn(`Warning: Could not add native module files to build phase:`, error instanceof Error ? error.message : String(error))
        
        // Fallback: try adding files individually using the safer method
        allNativeFiles.forEach(file => {
          try {
            const relativePath = `GoalsAI/${file}`
            // Use addSourceFile with minimal options to avoid syntax issues
            const fileRef = xcodeProject.addSourceFile(relativePath)
            if (fileRef) {
              console.log(`Successfully added ${file} to main target (fallback method)`)
            }
          } catch (fallbackError) {
            console.warn(`Warning: Could not add source file ${file} (fallback):`, fallbackError instanceof Error ? fallbackError.message : String(fallbackError))
          }
        })
      }
    } else {
      console.warn('Could not find main target UUID - files copied but not linked in Xcode project')
      console.log('Available targets:', Object.keys(nativeTargets).filter(k => !k.endsWith('_comment')))
    }

    fs.writeFileSync(projPath, xcodeProject.writeSync())
  })
}