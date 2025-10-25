import { ConfigPlugin, withEntitlementsPlist, withAppDelegate, withDangerousMod } from "@expo/config-plugins"
import { ExpoConfig } from "@expo/config-types"
import { withWidgetIos } from "./ios/withWidgetIos"

export interface WithWidgetProps {
  devTeamId: string
  appGroupId?: string
}

// Lockerer Typ für iOS-Objekt (erweiterbar)
interface IOSConfigMutable {
  teamId?: string
  entitlements?: Record<string, any>
  [key: string]: any
}

/**
 * Expo Config Plugin zum Einrichten eines Widget Targets mit App Group Support.
 */
const withWidget: ConfigPlugin<WithWidgetProps> = (config, options) => {
  const bundleId = config.ios?.bundleIdentifier || "com.example.app"

  // App Group ID generieren, falls keine angegeben ist
  const appGroupId =
    options.appGroupId || `group.${bundleId.replace(/[^a-zA-Z0-9.]/g, "")}`

  // iOS sicherstellen + Mutability erzwingen
  if (!config.ios) (config as ExpoConfig & { ios: IOSConfigMutable }).ios = {}
  const iosConfig = config.ios as IOSConfigMutable

  // ✅ Dev Team ID setzen
  iosConfig.teamId = options.devTeamId

  // ✅ App Group Entitlement für Haupt-App hinzufügen
  config = withEntitlementsPlist(config, (config) => {
    const rawGroups = config.modResults["com.apple.security.application-groups"]

    // Typischerweise string[] oder undefined, wir casten defensiv
    const groups: string[] = Array.isArray(rawGroups)
      ? (rawGroups as string[])
      : typeof rawGroups === "string"
      ? [rawGroups]
      : []

    if (!groups.includes(appGroupId)) {
      config.modResults["com.apple.security.application-groups"] = [
        ...groups,
        appGroupId,
      ]
    }
    return config
  })

  // ✅ Widget Target simulieren (für interne Konsistenz bei EAS)
  iosConfig["widgetTarget"] = {
    bundleIdentifier: `${bundleId}.widget`,
    entitlements: {
      "com.apple.security.application-groups": [appGroupId],
    },
  }

  // ✅ OneSignal AppDelegate Integration (survives prebuild)
  config = withAppDelegate(config, (config) => {
    const { modResults } = config;
    
    // Add OneSignal import
    if (!modResults.contents.includes('#import <OneSignalFramework/OneSignalFramework.h>')) {
      modResults.contents = modResults.contents.replace(
        '#import <React/RCTLinkingManager.h>',
        '#import <React/RCTLinkingManager.h>\n#import <OneSignalFramework/OneSignalFramework.h>'
      );
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
      modResults.contents = modResults.contents.replace(
        'self.initialProps = @{};',
        `self.initialProps = @{};${oneSignalInit}`
      );
    }
    
    return config;
  });

  // ✅ Übergib Parameter an dein iOS Widget Setup
  config = withWidgetIos(config, { ...options, appGroupId })

  // ✅ Add OneSignal frameworks to OneSignalNotificationServiceExtension after all plugins run
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const fs = require('fs-extra');
      const path = require('path');
      const xcode = require('xcode');
      
      const projectPath = path.join(config.modRequest.platformProjectRoot, `${config.modRequest.projectName}.xcodeproj/project.pbxproj`);
      
      if (fs.existsSync(projectPath)) {
        const xcodeProject = xcode.project(projectPath);
        
        await new Promise((resolve, reject) => {
          xcodeProject.parse((err: any) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });
        
        // Find OneSignalNotificationServiceExtension target
        const targets = xcodeProject.pbxNativeTargetSection();
        let notificationTarget = null;
        
        for (const uuid in targets) {
          if (uuid.endsWith('_comment')) continue;
          const target = targets[uuid];
          if (target && target.name === 'OneSignalNotificationServiceExtension') {
            notificationTarget = { uuid };
            break;
          }
        }
        
        if (notificationTarget) {
          console.log('Found OneSignalNotificationServiceExtension target, adding OneSignal frameworks...');
          
          // Add OneSignal frameworks using same logic as our plugin
          const frameworkPhases = xcodeProject.hash.project.objects.PBXFrameworksBuildPhase;
          const targetObj = targets[notificationTarget.uuid];
          
          let frameworkPhase = null;
          if (targetObj && targetObj.buildPhases) {
            for (const phaseRef of targetObj.buildPhases) {
              const phaseUuid = phaseRef.value || phaseRef;
              const phase = frameworkPhases[phaseUuid];
              if (phase && phase.isa === 'PBXFrameworksBuildPhase') {
                frameworkPhase = phase;
                break;
              }
            }
          }
          
          if (frameworkPhase) {
            const frameworks = [
              { name: 'OneSignalFramework.framework', path: 'OneSignalFramework.framework' },
              { name: 'OneSignalCore.framework', path: 'OneSignalCore.framework' },
              { name: 'OneSignalExtension.framework', path: 'OneSignalExtension.framework' }
            ];
            
            const fileRefs = xcodeProject.hash.project.objects.PBXFileReference;
            
            for (const framework of frameworks) {
              // Check if framework already linked
              const alreadyLinked = frameworkPhase.files && frameworkPhase.files.some((fileRef: any) => {
                const file = fileRefs[fileRef.value];
                return file && file.path && file.path.includes(framework.name);
              });
              
              if (!alreadyLinked) {
                // Find or create framework reference
                let frameworkUuid = null;
                for (const [uuid, file] of Object.entries(fileRefs)) {
                  if (uuid.endsWith('_comment')) continue;
                  const fileRef = file as any;
                  if (fileRef && fileRef.path && fileRef.path.includes(framework.name)) {
                    frameworkUuid = uuid;
                    break;
                  }
                }
                
                if (!frameworkUuid) {
                  frameworkUuid = xcodeProject.generateUuid();
                  xcodeProject.hash.project.objects.PBXFileReference[frameworkUuid] = {
                    isa: 'PBXFileReference',
                    lastKnownFileType: 'wrapper.framework',
                    name: framework.name,
                    path: framework.path,
                    sourceTree: '"<group>"'
                  };
                  xcodeProject.hash.project.objects.PBXFileReference[frameworkUuid + '_comment'] = framework.name;
                }
                
                // Add to build file section
                const buildFileUuid = xcodeProject.generateUuid();
                xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid] = {
                  isa: 'PBXBuildFile',
                  fileRef: frameworkUuid,
                  fileRef_comment: framework.name
                };
                xcodeProject.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = `${framework.name} in Frameworks`;
                
                // Add to framework build phase
                if (!frameworkPhase.files) {
                  frameworkPhase.files = [];
                }
                frameworkPhase.files.push({
                  value: buildFileUuid,
                  comment: `${framework.name} in Frameworks`
                });
                
                console.log(`Added ${framework.name} to OneSignalNotificationServiceExtension target`);
              }
            }
            
            // Write the modified project
            fs.writeFileSync(projectPath, xcodeProject.writeSync());
            console.log('Successfully updated OneSignalNotificationServiceExtension with OneSignal frameworks');
          }
        } else {
          console.log('OneSignalNotificationServiceExtension target not found');
        }
      }
      
      return config;
    }
  ]);

  return config
}

export default withWidget
