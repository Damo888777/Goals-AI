import { ConfigPlugin, withXcodeProject, withInfoPlist, withEntitlementsPlist } from "@expo/config-plugins";
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
const LIVE_ACTIVITY_TARGET_FILES = ["PomodoroLiveActivity.swift", "Info.plist", "Assets.xcassets", "PomodoroLiveActivity.entitlements"];
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
  GENERATE_INFOPLIST_FILE: "NO",
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
  CODE_SIGN_ENTITLEMENTS: "PomodoroLiveActivity/PomodoroLiveActivity.entitlements",
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

      // Create Live Activity target directory and copy files
      const liveActivityBundleId = "pro.GoalAchieverAI.PomodoroLiveActivity";
      const liveActivityTargetDir = path.join(platformProjectPath, LIVE_ACTIVITY_TARGET_NAME);
      const liveActivitySourceDir = path.join(projectPath, "targets", "pomodoro-live-activity");
      
      // Ensure Live Activity target directory exists
      fs.ensureDirSync(liveActivityTargetDir);
      
      // Copy Live Activity files if source directory exists
      if (fs.existsSync(liveActivitySourceDir)) {
        LIVE_ACTIVITY_TARGET_FILES.forEach(file => {
          const sourcePath = path.join(liveActivitySourceDir, file);
          const destPath = path.join(liveActivityTargetDir, file);
          if (fs.existsSync(sourcePath)) {
            fs.copySync(sourcePath, destPath);
            console.log(`Copied Live Activity file: ${file}`);
          }
        });
      }
      
      // Generate Info.plist for Live Activity target if it doesn't exist
      const infoPlistPath = path.join(liveActivityTargetDir, "Info.plist");
      if (!fs.existsSync(infoPlistPath)) {
        const liveActivityInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDisplayName</key>
	<string>Goals AI Live Activity</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.widgetkit-extension</string>
	</dict>
</dict>
</plist>`;
        
        fs.writeFileSync(infoPlistPath, liveActivityInfoPlist);
      }

      // Generate Info.plist for Widget target if it doesn't exist
      const widgetTargetDir = path.join(platformProjectPath, EXTENSION_TARGET_NAME);
      if (!fs.existsSync(widgetTargetDir)) {
        fs.mkdirSync(widgetTargetDir, { recursive: true });
      }
      
      const widgetInfoPlistPath = path.join(widgetTargetDir, "Info.plist");
      if (!fs.existsSync(widgetInfoPlistPath)) {
        const widgetInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDisplayName</key>
	<string>Widget</string>
	<key>CFBundleName</key>
	<string>widget</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundlePackageType</key>
	<string>XPC!</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.widgetkit-extension</string>
	</dict>
</dict>
</plist>`;
        
        fs.writeFileSync(widgetInfoPlistPath, widgetInfoPlist);
        console.log(`Generated widget Info.plist with all required CFBundle keys`);
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

    // Add widget files to widget target build phases if they don't exist
    console.log(`Widget target build phases check: Sources=${hasWidgetSources}, Frameworks=${hasWidgetFrameworks}, Resources=${hasWidgetResources}`)
    
    if (widgetTarget && !hasWidgetSources) {
      try {
        // Find widget target's source build phase
        const targets = xcodeProject.hash.project.objects.PBXNativeTarget
        const widgetTargetObj = targets[widgetTarget.uuid]
        
        if (widgetTargetObj && widgetTargetObj.buildPhases) {
          let widgetSourcePhase = null
          
          // Look through the widget target's build phases to find the sources build phase
          for (const phaseRef of widgetTargetObj.buildPhases) {
            const phaseUuid = phaseRef.value || phaseRef
            const phase = widgetBuildPhases[phaseUuid]
            if (phase && phase.isa === 'PBXSourcesBuildPhase') {
              widgetSourcePhase = phase
              console.log(`Found widget target source build phase: ${phaseUuid}`)
              break
            }
          }
          
          // If no source build phase found, create one
          if (!widgetSourcePhase) {
            const sourceBuildPhaseUuid = xcodeProject.generateUuid()
            widgetBuildPhases[sourceBuildPhaseUuid] = {
              isa: 'PBXSourcesBuildPhase',
              buildActionMask: '2147483647',
              files: [],
              runOnlyForDeploymentPostprocessing: '0'
            }
            widgetBuildPhases[sourceBuildPhaseUuid + '_comment'] = 'Sources'
            
            // Add to target's build phases
            widgetTargetObj.buildPhases.push({
              value: sourceBuildPhaseUuid,
              comment: 'Sources'
            })
            
            widgetSourcePhase = widgetBuildPhases[sourceBuildPhaseUuid]
            console.log(`Created widget target source build phase: ${sourceBuildPhaseUuid}`)
          }
          
          if (widgetSourcePhase) {
            // Add widget Swift files to build phase
            let addedWidgetFiles = 0
            const widgetSwiftFiles = TOP_LEVEL_FILES.filter(file => file.endsWith('.swift'))
            
            for (const widgetFile of widgetSwiftFiles) {
              const fileName = widgetFile.split('/').pop() || widgetFile
              const fullPath = `${EXTENSION_TARGET_NAME}/${widgetFile}`
              
              // Check if file already exists in project
              const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
              const existingFile = Object.values(fileRefs).find((file: any) => 
                file && file.path && file.path.includes(fileName)
              )
              
              let fileUuid: string
              
              if (!existingFile) {
                // Add file reference manually
                fileUuid = xcodeProject.generateUuid()
                const fileType = 'sourcecode.swift'
                
                // Add to PBXFileReference section
                xcodeProject.hash.project.objects.PBXFileReference[fileUuid] = {
                  isa: 'PBXFileReference',
                  lastKnownFileType: fileType,
                  name: fileName,
                  path: fullPath,
                  sourceTree: '"<group>"'
                }
                xcodeProject.hash.project.objects.PBXFileReference[fileUuid + '_comment'] = fileName
                console.log(`Created file reference for: ${widgetFile}`)
              } else {
                // Use existing file reference
                fileUuid = Object.keys(xcodeProject.hash.project.objects.PBXFileReference).find(key => 
                  !key.endsWith('_comment') && xcodeProject.hash.project.objects.PBXFileReference[key] === existingFile
                ) || ''
                console.log(`Using existing file reference for: ${widgetFile}`)
              }
              
              if (fileUuid) {
                try {
                  // Check if build file already exists for this file reference
                  const buildFiles = xcodeProject.hash.project.objects.PBXBuildFile
                  const existingBuildFile = Object.values(buildFiles).find((buildFile: any) =>
                    buildFile && buildFile.fileRef === fileUuid
                  )
                  
                  let buildFileUuid: string
                  if (!existingBuildFile) {
                    // Create new build file
                    buildFileUuid = xcodeProject.generateUuid()
                    xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid] = {
                      isa: 'PBXBuildFile',
                      fileRef: fileUuid,
                      fileRef_comment: fileName
                    }
                    xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = `${fileName} in Sources`
                  } else {
                    // Use existing build file
                    buildFileUuid = Object.keys(buildFiles).find(key => 
                      !key.endsWith('_comment') && buildFiles[key] === existingBuildFile
                    ) || ''
                  }
                  
                  // Add to widget target's source build phase (always do this)
                  if (!widgetSourcePhase.files) {
                    widgetSourcePhase.files = []
                  }
                  
                  // Check if already in build phase
                  const alreadyInBuildPhase = widgetSourcePhase.files.some((file: any) => 
                    file.value === buildFileUuid
                  )
                  
                  if (!alreadyInBuildPhase) {
                    widgetSourcePhase.files.push({
                      value: buildFileUuid,
                      comment: `${fileName} in Sources`
                    })
                    addedWidgetFiles++
                    console.log(`Added widget file to target: ${widgetFile}`)
                  } else {
                    console.log(`Widget file ${widgetFile} already in target build phase`)
                  }
                } catch (fileError) {
                  console.warn(`Could not add widget file ${widgetFile}:`, fileError instanceof Error ? fileError.message : String(fileError))
                }
              }
            }
            
            if (addedWidgetFiles > 0) {
              console.log(`Successfully added ${addedWidgetFiles} widget files to widget target`)
            } else {
              console.log('All widget files already exist in widget target')
            }
          } else {
            console.warn('Could not find widget target source build phase')
          }
        }
      } catch (error) {
        console.error('Error adding widget files to target:', error instanceof Error ? error.message : String(error))
      }
    }

    // Add WidgetKit framework to widget target if not present
    if (widgetTarget && !hasWidgetFrameworks) {
      try {
        const targets = xcodeProject.hash.project.objects.PBXNativeTarget
        const widgetTargetObj = targets[widgetTarget.uuid]
        
        if (widgetTargetObj && widgetTargetObj.buildPhases) {
          let widgetFrameworkPhase = null
          
          // Look for existing framework build phase
          for (const phaseRef of widgetTargetObj.buildPhases) {
            const phaseUuid = phaseRef.value || phaseRef
            const phase = widgetFrameworkPhases[phaseUuid]
            if (phase && phase.isa === 'PBXFrameworksBuildPhase') {
              widgetFrameworkPhase = phase
              console.log(`Found widget target framework build phase: ${phaseUuid}`)
              break
            }
          }
          
          // If no framework build phase found, create one
          if (!widgetFrameworkPhase) {
            const frameworkBuildPhaseUuid = xcodeProject.generateUuid()
            widgetFrameworkPhases[frameworkBuildPhaseUuid] = {
              isa: 'PBXFrameworksBuildPhase',
              buildActionMask: '2147483647',
              files: [],
              runOnlyForDeploymentPostprocessing: '0'
            }
            widgetFrameworkPhases[frameworkBuildPhaseUuid + '_comment'] = 'Frameworks'
            
            // Add to target's build phases
            widgetTargetObj.buildPhases.push({
              value: frameworkBuildPhaseUuid,
              comment: 'Frameworks'
            })
            
            widgetFrameworkPhase = widgetFrameworkPhases[frameworkBuildPhaseUuid]
            console.log(`Created widget target framework build phase: ${frameworkBuildPhaseUuid}`)
          }
          
          if (widgetFrameworkPhase) {
            // Add WidgetKit framework
            const frameworkName = 'WidgetKit.framework'
            const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
            
            // Check if WidgetKit framework already exists
            const existingFramework = Object.values(fileRefs).find((file: any) => 
              file && file.path && file.path.includes(frameworkName)
            )
            
            if (!existingFramework) {
              // Add WidgetKit framework reference
              const frameworkUuid = xcodeProject.generateUuid()
              xcodeProject.hash.project.objects.PBXFileReference[frameworkUuid] = {
                isa: 'PBXFileReference',
                lastKnownFileType: 'wrapper.framework',
                name: frameworkName,
                path: `System/Library/Frameworks/${frameworkName}`,
                sourceTree: 'SDKROOT'
              }
              xcodeProject.hash.project.objects.PBXFileReference[frameworkUuid + '_comment'] = frameworkName
              
              // Add to build file section
              const buildFileUuid = xcodeProject.generateUuid()
              xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid] = {
                isa: 'PBXBuildFile',
                fileRef: frameworkUuid,
                fileRef_comment: frameworkName
              }
              xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = `${frameworkName} in Frameworks`
              
              // Add to widget target's framework build phase
              if (!widgetFrameworkPhase.files) {
                widgetFrameworkPhase.files = []
              }
              widgetFrameworkPhase.files.push({
                value: buildFileUuid,
                comment: `${frameworkName} in Frameworks`
              })
              
              console.log(`Added WidgetKit framework to widget target`)
            } else {
              console.log('WidgetKit framework already exists in project')
            }
          }
        }
      } catch (error) {
        console.error('Error adding WidgetKit framework to widget target:', error instanceof Error ? error.message : String(error))
      }
    }


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
      
      // Ensure the target has proper build phases
      const targetObj = xcodeProject.hash.project.objects.PBXNativeTarget[newTarget.uuid]
      if (targetObj && !targetObj.buildPhases) {
        targetObj.buildPhases = []
      }
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

    // Add ActivityKit and OneSignal frameworks to Live Activity target if not present  
    if (liveActivityTarget && !hasLiveActivityFrameworks) {
      try {
        const targets = xcodeProject.hash.project.objects.PBXNativeTarget
        const liveActivityTargetObj = targets[liveActivityTarget.uuid]
        
        if (liveActivityTargetObj && liveActivityTargetObj.buildPhases) {
          let liveActivityFrameworkPhase = null
          
          // Look for existing framework build phase
          for (const phaseRef of liveActivityTargetObj.buildPhases) {
            const phaseUuid = phaseRef.value || phaseRef
            const phase = liveActivityFrameworkPhases[phaseUuid]
            if (phase && phase.isa === 'PBXFrameworksBuildPhase') {
              liveActivityFrameworkPhase = phase
              console.log(`Found Live Activity target framework build phase: ${phaseUuid}`)
              break
            }
          }
          
          // If no framework build phase found, create one
          if (!liveActivityFrameworkPhase) {
            const frameworkBuildPhaseUuid = xcodeProject.generateUuid()
            liveActivityFrameworkPhases[frameworkBuildPhaseUuid] = {
              isa: 'PBXFrameworksBuildPhase',
              buildActionMask: '2147483647',
              files: [],
              runOnlyForDeploymentPostprocessing: '0'
            }
            liveActivityFrameworkPhases[frameworkBuildPhaseUuid + '_comment'] = 'Frameworks'
            
            // Add to target's build phases
            liveActivityTargetObj.buildPhases.push({
              value: frameworkBuildPhaseUuid,
              comment: 'Frameworks'
            })
            
            liveActivityFrameworkPhase = liveActivityFrameworkPhases[frameworkBuildPhaseUuid]
            console.log(`Created Live Activity target framework build phase: ${frameworkBuildPhaseUuid}`)
          }
          
          if (liveActivityFrameworkPhase) {
            // Add ActivityKit framework (OneSignal is handled by CocoaPods)
            const frameworks = [
              { name: 'ActivityKit.framework', path: 'System/Library/Frameworks/ActivityKit.framework' }
            ]
            
            const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
            
            for (const framework of frameworks) {
              // Check if framework already exists
              const existingFramework = Object.values(fileRefs).find((file: any) => 
                file && file.path && file.path.includes(framework.name)
              )
              
              if (!existingFramework) {
                // Add framework reference
                const frameworkUuid = xcodeProject.generateUuid()
                xcodeProject.hash.project.objects.PBXFileReference[frameworkUuid] = {
                  isa: 'PBXFileReference',
                  lastKnownFileType: 'wrapper.framework',
                  name: framework.name,
                  path: framework.path,
                  sourceTree: 'SDKROOT'
                }
                xcodeProject.hash.project.objects.PBXFileReference[frameworkUuid + '_comment'] = framework.name
                
                // Add to build file section
                const buildFileUuid = xcodeProject.generateUuid()
                xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid] = {
                  isa: 'PBXBuildFile',
                  fileRef: frameworkUuid,
                  fileRef_comment: framework.name
                }
                xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = `${framework.name} in Frameworks`
                
                // Add to Live Activity target's framework build phase
                if (!liveActivityFrameworkPhase.files) {
                  liveActivityFrameworkPhase.files = []
                }
                liveActivityFrameworkPhase.files.push({
                  value: buildFileUuid,
                  comment: `${framework.name} in Frameworks`
                })
                
                console.log(`Added ${framework.name} to Live Activity target`)
              } else {
                console.log(`${framework.name} already exists in project`)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error adding frameworks to Live Activity target:', error instanceof Error ? error.message : String(error))
      }
    }

    // Add Live Activity files to Live Activity target build phases
    if (liveActivityTarget) {
      try {
        // Find Live Activity target's source build phase
        const targets = xcodeProject.hash.project.objects.PBXNativeTarget
        const liveActivityTargetObj = targets[liveActivityTarget.uuid]
        
        if (liveActivityTargetObj && liveActivityTargetObj.buildPhases) {
          let liveActivitySourcePhase = null
          
          // Look through the Live Activity target's build phases to find the sources build phase
          for (const phaseRef of liveActivityTargetObj.buildPhases) {
            const phaseUuid = phaseRef.value || phaseRef
            const phase = liveActivityBuildPhases[phaseUuid]
            if (phase && phase.isa === 'PBXSourcesBuildPhase') {
              liveActivitySourcePhase = phase
              console.log(`Found Live Activity target source build phase: ${phaseUuid}`)
              break
            }
          }
          
          // If no source build phase found, create one
          if (!liveActivitySourcePhase) {
            const sourceBuildPhaseUuid = xcodeProject.generateUuid()
            liveActivityBuildPhases[sourceBuildPhaseUuid] = {
              isa: 'PBXSourcesBuildPhase',
              buildActionMask: '2147483647',
              files: [],
              runOnlyForDeploymentPostprocessing: '0'
            }
            liveActivityBuildPhases[sourceBuildPhaseUuid + '_comment'] = 'Sources'
            
            // Add to target's build phases
            liveActivityTargetObj.buildPhases.push({
              value: sourceBuildPhaseUuid,
              comment: 'Sources'
            })
            
            liveActivitySourcePhase = liveActivityBuildPhases[sourceBuildPhaseUuid]
            console.log(`Created Live Activity target source build phase: ${sourceBuildPhaseUuid}`)
          }
          
          if (liveActivitySourcePhase) {
            // Add Live Activity Swift files to build phase
            let addedLiveActivityFiles = 0
            const liveActivitySwiftFiles = LIVE_ACTIVITY_TARGET_FILES.filter(file => file.endsWith('.swift'))
            
            for (const liveActivityFile of liveActivitySwiftFiles) {
              const fileName = liveActivityFile.split('/').pop() || liveActivityFile
              const fullPath = `${LIVE_ACTIVITY_TARGET_NAME}/${liveActivityFile}`
              
              // Check if file already exists in project
              const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
              const existingFile = Object.values(fileRefs).find((file: any) => 
                file && file.path && file.path.includes(fileName)
              )
              
              if (!existingFile) {
                try {
                  // Add file reference manually
                  const fileUuid = xcodeProject.generateUuid()
                  const fileType = 'sourcecode.swift'
                  
                  // Add to PBXFileReference section
                  xcodeProject.hash.project.objects.PBXFileReference[fileUuid] = {
                    isa: 'PBXFileReference',
                    lastKnownFileType: fileType,
                    name: fileName,
                    path: fullPath,
                    sourceTree: '"<group>"'
                  }
                  xcodeProject.hash.project.objects.PBXFileReference[fileUuid + '_comment'] = fileName
                  
                  // Add to build file section
                  const buildFileUuid = xcodeProject.generateUuid()
                  xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid] = {
                    isa: 'PBXBuildFile',
                    fileRef: fileUuid,
                    fileRef_comment: fileName
                  }
                  xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = `${fileName} in Sources`
                  
                  // Add to Live Activity target's source build phase
                  if (!liveActivitySourcePhase.files) {
                    liveActivitySourcePhase.files = []
                  }
                  liveActivitySourcePhase.files.push({
                    value: buildFileUuid,
                    comment: `${fileName} in Sources`
                  })
                  
                  addedLiveActivityFiles++
                  console.log(`Added Live Activity file to target: ${liveActivityFile}`)
                } catch (fileError) {
                  console.warn(`Could not add Live Activity file ${liveActivityFile}:`, fileError instanceof Error ? fileError.message : String(fileError))
                }
              } else {
                console.log(`Live Activity file ${liveActivityFile} already exists in project`)
              }
            }
            
            if (addedLiveActivityFiles > 0) {
              console.log(`Successfully added ${addedLiveActivityFiles} Live Activity files to Live Activity target`)
            } else {
              console.log('All Live Activity files already exist in Live Activity target')
            }
          } else {
            console.warn('Could not find Live Activity target source build phase')
          }
        }
      } catch (error) {
        console.error('Error adding Live Activity files to target:', error instanceof Error ? error.message : String(error))
      }
    }

    // CRITICAL: Add LiveActivityModule.swift to Live Activity target for shared attributes
    if (liveActivityTarget) {
      try {
        const targets = xcodeProject.hash.project.objects.PBXNativeTarget;
        const liveActivityTargetObj = targets[liveActivityTarget.uuid];
        
        if (liveActivityTargetObj && liveActivityTargetObj.buildPhases) {
          let liveActivitySourcePhase = null;
          
          // Find Live Activity target's source build phase
          for (const phaseRef of liveActivityTargetObj.buildPhases) {
            const phaseUuid = phaseRef.value || phaseRef;
            const phase = liveActivityBuildPhases[phaseUuid];
            if (phase && phase.isa === 'PBXSourcesBuildPhase') {
              liveActivitySourcePhase = phase;
              break;
            }
          }
          
          if (liveActivitySourcePhase) {
            // Add LiveActivityModule.swift to Live Activity target (for shared attributes)
            const sharedFile = 'LiveActivityModule.swift';
            const fileName = sharedFile;
            
            const fileRefs = xcodeProject.hash.project.objects.PBXFileReference;
            const existingFile = Object.values(fileRefs).find((file: any) => 
              file && file.path && file.path.includes(fileName)
            );
            
            if (existingFile) {
              const fileUuid = Object.keys(fileRefs).find(key => 
                !key.endsWith('_comment') && fileRefs[key] === existingFile
              ) || '';
              
              if (fileUuid) {
                // Check if build file already exists
                const buildFiles = xcodeProject.hash.project.objects.PBXBuildFile;
                let buildFileUuid = Object.keys(buildFiles).find(key => 
                  !key.endsWith('_comment') && buildFiles[key] && buildFiles[key].fileRef === fileUuid
                ) || null;
                
                if (!buildFileUuid) {
                  // Create new build file
                  buildFileUuid = xcodeProject.generateUuid();
                }
                
                // Ensure buildFileUuid is not null before using
                if (buildFileUuid) {
                  xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid] = {
                    isa: 'PBXBuildFile',
                    fileRef: fileUuid,
                    fileRef_comment: fileName
                  };
                  xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = `${fileName} in Sources`;
                }
                
                // Add to Live Activity target's source build phase
                if (buildFileUuid) {
                  if (!liveActivitySourcePhase.files) {
                    liveActivitySourcePhase.files = [];
                  }
                  
                  const alreadyInBuildPhase = liveActivitySourcePhase.files.some((file: any) => 
                    file.value === buildFileUuid
                  );
                  
                  if (!alreadyInBuildPhase) {
                    liveActivitySourcePhase.files.push({
                      value: buildFileUuid,
                      comment: `${fileName} in Sources`
                    });
                    console.log(`✅ Added ${fileName} to Live Activity target for shared attributes`);
                  } else {
                    console.log(`${fileName} already in Live Activity target`);
                  }
                }
              }
            } else {
              console.warn(`Could not find ${fileName} in project file references`);
            }
          }
        }
      } catch (error) {
        console.error('Error adding LiveActivityModule.swift to Live Activity target:', error instanceof Error ? error.message : String(error));
      }
    }

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
    
    // Add native module files to main target only if they don't already exist
    if (mainTargetUuid) {
      try {
        // Get existing source files in main target to prevent duplicates
        const mainTargetBuildPhases = xcodeProject.hash.project.objects.PBXSourcesBuildPhase
        const fileRefs = xcodeProject.hash.project.objects.PBXFileReference
        
        // Find main target's source build phase using the target UUID
        let mainTargetSourcePhase = null
        const targets = xcodeProject.hash.project.objects.PBXNativeTarget
        const mainTarget = targets[mainTargetUuid]
        
        if (mainTarget && mainTarget.buildPhases) {
          // Look through the main target's build phases to find the sources build phase
          for (const phaseRef of mainTarget.buildPhases) {
            const phaseUuid = phaseRef.value
            const phase = mainTargetBuildPhases[phaseUuid]
            if (phase && phase.isa === 'PBXSourcesBuildPhase') {
              mainTargetSourcePhase = phase
              console.log(`Found main target source build phase: ${phaseUuid}`)
              break
            }
          }
        }
        
        if (mainTargetSourcePhase) {
          // Manual approach: Add files directly to project structure
          let addedCount = 0
          for (const nativeFile of allNativeFiles) {
            const fileName = nativeFile.split('/').pop() || nativeFile
            const fullPath = `GoalsAI/${nativeFile}`
            
            // Check if file already exists in project
            const existingFile = Object.values(fileRefs).find((file: any) => 
              file && file.path && file.path.includes(fileName)
            )
            
            if (!existingFile) {
              try {
                // Add file reference manually
                const fileUuid = xcodeProject.generateUuid()
                const fileType = nativeFile.endsWith('.swift') ? 'sourcecode.swift' : 'sourcecode.c.objc'
                
                // Add to PBXFileReference section
                xcodeProject.hash.project.objects.PBXFileReference[fileUuid] = {
                  isa: 'PBXFileReference',
                  lastKnownFileType: fileType,
                  name: fileName,
                  path: fullPath,
                  sourceTree: '"<group>"'
                }
                xcodeProject.hash.project.objects.PBXFileReference[fileUuid + '_comment'] = fileName
                
                // Add to build file section
                const buildFileUuid = xcodeProject.generateUuid()
                xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid] = {
                  isa: 'PBXBuildFile',
                  fileRef: fileUuid,
                  fileRef_comment: fileName
                }
                xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = `${fileName} in Sources`
                
                // Add to main target's source build phase
                if (!mainTargetSourcePhase.files) {
                  mainTargetSourcePhase.files = []
                }
                mainTargetSourcePhase.files.push({
                  value: buildFileUuid,
                  comment: `${fileName} in Sources`
                })
                
                addedCount++
                console.log(`Added native module file: ${nativeFile}`)
              } catch (fileError) {
                console.warn(`Could not add ${nativeFile}:`, fileError instanceof Error ? fileError.message : String(fileError))
              }
            } else {
              console.log(`Native module file ${nativeFile} already exists in project`)
            }
          }
          
          if (addedCount > 0) {
            console.log(`Successfully added ${addedCount} native module files to main target`)
          } else {
            console.log('All native module files already exist in main target')
          }
        } else {
          console.warn('Could not find main target source build phase')
        }
      } catch (error) {
        console.warn(`Warning: Could not add native module files:`, error instanceof Error ? error.message : String(error))
      }
    } else {
      console.warn('Could not find main target UUID')
    }

    fs.writeFileSync(projPath, xcodeProject.writeSync())
  })
}

// Add ActivityKit entitlement to main app
export const withActivityKitEntitlement: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.ActivityKit'] = true
    return config
  })
}