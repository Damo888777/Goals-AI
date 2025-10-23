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
    // Check if PBX group already exists
    const groups = xcodeProject.hash.project.objects.PBXGroup
    let existingGroup = null
    
    for (const groupKey in groups) {
      if (groupKey.endsWith('_comment')) continue
      const group = groups[groupKey]
      if (group && group.name === EXTENSION_TARGET_NAME) {
        existingGroup = { uuid: groupKey }
        break
      }
    }
    
    // Only create PBX group if it doesn't exist
    let pbxGroup = existingGroup
    if (!pbxGroup) {
      pbxGroup = xcodeProject.addPbxGroup(
        TOP_LEVEL_FILES,
        EXTENSION_TARGET_NAME,
        EXTENSION_TARGET_NAME,
      )

      // Add the new PBXGroup to the top level group. This makes the
      // files / folder appear in the file explorer in Xcode.
      Object.keys(groups).forEach(function (groupKey) {
        if (groups[groupKey].name === undefined) {
          // Check if group is already added to this parent group
          const parentGroup = groups[groupKey]
          const isAlreadyAdded = parentGroup.children && parentGroup.children.some((child: any) => child.value === pbxGroup!.uuid)
          if (!isAlreadyAdded) {
            xcodeProject.addToPbxGroup(pbxGroup!.uuid, groupKey)
          }
        }
      })
    }

    // WORK AROUND for xcodeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    const projObjects = xcodeProject.hash.project.objects
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {}
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXContainerItemProxy"] || {}

    // Check if widget target already exists
    const existingTargets = xcodeProject.pbxNativeTargetSection()
    let widgetTarget = null
    for (const uuid in existingTargets) {
      if (uuid.endsWith('_comment')) continue
      const target = existingTargets[uuid]
      if (target && target.name === EXTENSION_TARGET_NAME) {
        widgetTarget = { uuid }
        break
      }
    }
    
    // Only add widget target if it doesn't exist
    if (!widgetTarget) {
      const newTarget = xcodeProject.addTarget(EXTENSION_TARGET_NAME, "app_extension", EXTENSION_TARGET_NAME, widgetBundleId)
      widgetTarget = { uuid: newTarget.uuid }
      console.log(`Created new widget target with UUID: ${newTarget.uuid}`)
    }

    // Check existing build phases for widget target
    const widgetBuildPhases = xcodeProject.hash.project.objects.PBXSourcesBuildPhase
    const widgetFrameworkPhases = xcodeProject.hash.project.objects.PBXFrameworksBuildPhase
    const widgetResourcePhases = xcodeProject.hash.project.objects.PBXResourcesBuildPhase
    
    let hasWidgetSources = false
    let hasWidgetFrameworks = false
    let hasWidgetResources = false
    
    // Check sources
    for (const phaseUuid in widgetBuildPhases) {
      if (phaseUuid.endsWith('_comment')) continue
      const phase = widgetBuildPhases[phaseUuid]
      if (phase && phase.files) {
        const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
        const hasWidgetFiles = phase.files.some((fileRef: any) => {
          const file = fileRefs[fileRef.value]
          return file && file.path && file.path.includes('widget.swift')
        })
        if (hasWidgetFiles) {
          hasWidgetSources = true
          break
        }
      }
    }
    
    // Check frameworks
    for (const phaseUuid in widgetFrameworkPhases) {
      if (phaseUuid.endsWith('_comment')) continue
      const phase = widgetFrameworkPhases[phaseUuid]
      if (phase && phase.files) {
        const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
        const hasFrameworkFiles = phase.files.some((fileRef: any) => {
          const file = fileRefs[fileRef.value]
          return file && file.path && file.path.includes('WidgetKit.framework')
        })
        if (hasFrameworkFiles) {
          hasWidgetFrameworks = true
          break
        }
      }
    }
    
    // Check resources
    for (const phaseUuid in widgetResourcePhases) {
      if (phaseUuid.endsWith('_comment')) continue
      const phase = widgetResourcePhases[phaseUuid]
      if (phase && phase.files) {
        const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
        const hasResourceFiles = phase.files.some((fileRef: any) => {
          const file = fileRefs[fileRef.value]
          return file && file.path && file.path.includes('widget/Assets.xcassets')
        })
        if (hasResourceFiles) {
          hasWidgetResources = true
          break
        }
      }
    }

    // Skip adding widget build phases - they should be created automatically with the target
    console.log(`Widget target build phases check: Sources=${hasWidgetSources}, Frameworks=${hasWidgetFrameworks}, Resources=${hasWidgetResources}`)

    // Check if Live Activity target already exists
    let liveActivityTarget = null
    for (const uuid in existingTargets) {
      if (uuid.endsWith('_comment')) continue
      const target = existingTargets[uuid]
      if (target && target.name === LIVE_ACTIVITY_TARGET_NAME) {
        liveActivityTarget = { uuid }
        break
      }
    }
    
    // Only add Live Activity target if it doesn't exist
    if (!liveActivityTarget) {
      const newTarget = xcodeProject.addTarget(LIVE_ACTIVITY_TARGET_NAME, "app_extension", LIVE_ACTIVITY_TARGET_NAME, liveActivityBundleId)
      liveActivityTarget = { uuid: newTarget.uuid }
      console.log(`Created new Live Activity target with UUID: ${newTarget.uuid}`)
    }

    // Check existing build phases for Live Activity target
    const liveActivityBuildPhases = xcodeProject.hash.project.objects.PBXSourcesBuildPhase
    const liveActivityFrameworkPhases = xcodeProject.hash.project.objects.PBXFrameworksBuildPhase
    const liveActivityResourcePhases = xcodeProject.hash.project.objects.PBXResourcesBuildPhase
    
    let hasLiveActivitySources = false
    let hasLiveActivityFrameworks = false
    let hasLiveActivityResources = false
    
    // Check sources
    for (const phaseUuid in liveActivityBuildPhases) {
      if (phaseUuid.endsWith('_comment')) continue
      const phase = liveActivityBuildPhases[phaseUuid]
      if (phase && phase.files) {
        const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
        const hasLiveActivityFiles = phase.files.some((fileRef: any) => {
          const file = fileRefs[fileRef.value]
          return file && file.path && file.path.includes('PomodoroLiveActivity.swift')
        })
        if (hasLiveActivityFiles) {
          hasLiveActivitySources = true
          break
        }
      }
    }
    
    // Check frameworks
    for (const phaseUuid in liveActivityFrameworkPhases) {
      if (phaseUuid.endsWith('_comment')) continue
      const phase = liveActivityFrameworkPhases[phaseUuid]
      if (phase && phase.files) {
        const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
        const hasFrameworkFiles = phase.files.some((fileRef: any) => {
          const file = fileRefs[fileRef.value]
          return file && file.path && file.path.includes('ActivityKit.framework')
        })
        if (hasFrameworkFiles) {
          hasLiveActivityFrameworks = true
          break
        }
      }
    }
    
    // Check resources
    for (const phaseUuid in liveActivityResourcePhases) {
      if (phaseUuid.endsWith('_comment')) continue
      const phase = liveActivityResourcePhases[phaseUuid]
      if (phase && phase.files) {
        const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
        const hasResourceFiles = phase.files.some((fileRef: any) => {
          const file = fileRefs[fileRef.value]
          return file && file.path && file.path.includes('PomodoroLiveActivity/Assets.xcassets')
        })
        if (hasResourceFiles) {
          hasLiveActivityResources = true
          break
        }
      }
    }

    // Skip adding Live Activity build phases - they should be created automatically with the target
    console.log(`Live Activity target build phases check: Sources=${hasLiveActivitySources}, Frameworks=${hasLiveActivityFrameworks}, Resources=${hasLiveActivityResources}`)

    /* Update build configurations */
    const configurations = xcodeProject.pbxXCBuildConfigurationSection()

    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== "undefined") {
        const productName = configurations[key].buildSettings.PRODUCT_NAME
        if (productName === `"${EXTENSION_TARGET_NAME}"`) {
          // Check if widget build settings already applied
          const hasWidgetSettings = configurations[key].buildSettings.ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME === "WidgetBackground"
          if (!hasWidgetSettings) {
            configurations[key].buildSettings = {
              ...configurations[key].buildSettings,
              ...WIDGET_BUILD_CONFIGURATION_SETTINGS,
              DEVELOPMENT_TEAM: developmentTeamId,
              PRODUCT_BUNDLE_IDENTIFIER: widgetBundleId,
            }
          }
        }
        if (productName === `"${LIVE_ACTIVITY_TARGET_NAME}"`) {
          // Check if live activity build settings already applied
          const hasLiveActivitySettings = configurations[key].buildSettings.INFOPLIST_KEY_CFBundleDisplayName === "PomodoroLiveActivity"
          if (!hasLiveActivitySettings) {
            configurations[key].buildSettings = {
              ...configurations[key].buildSettings,
              ...LIVE_ACTIVITY_BUILD_CONFIGURATION_SETTINGS,
              DEVELOPMENT_TEAM: developmentTeamId,
              PRODUCT_BUNDLE_IDENTIFIER: liveActivityBundleId,
            }
          }
        }
      }
    }

    // Add Live Activities capability for real-time timer updates
    try {
      const targetUuid = widgetTarget.uuid
      
      // Check if target attributes already exist
      const targets = xcodeProject.hash.project.objects.PBXNativeTarget
      const target = targets[targetUuid]
      const hasCapabilities = target && target.attributes && target.attributes.SystemCapabilities
      const hasProvisioningStyle = target && target.attributes && target.attributes.ProvisioningStyle
      
      // Only add capabilities if they don't exist
      if (!hasCapabilities) {
        xcodeProject.addTargetAttribute('SystemCapabilities', {
          'com.apple.Push': {
            enabled: 1
          },
          'com.apple.developer.live-activities': {
            enabled: 1
          }
        }, targetUuid)
      }
      
      if (!hasProvisioningStyle) {
        xcodeProject.addTargetAttribute('ProvisioningStyle', 'Automatic', targetUuid)
      }
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
    
    // Skip adding native module files to main target - they should be handled by Expo
    console.log(`Main target UUID found: ${mainTargetUuid}`)
    console.log('Skipping native module file addition - handled by Expo prebuild')

    fs.writeFileSync(projPath, xcodeProject.writeSync())
  })
}