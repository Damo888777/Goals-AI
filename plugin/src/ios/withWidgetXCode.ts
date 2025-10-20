import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";
import * as fs from "fs-extra";
import * as path from "path";

// HILFSFUNKTION, UM DEN PROJEKTNAMEN ZU BEKOMMEN
function getProjectName(config: any): string {
  const { name } = config;
  return name.replace(/[^A-Za-z0-9]/g, "");
}

export const withWidgetXCode: ConfigPlugin<any> = (config) => {
  return withXcodeProject(config, (projectConfig) => {
    const platformProjectRoot = projectConfig.modRequest.platformProjectRoot;
    const projectRoot = projectConfig.modRequest.projectRoot;
    const projectName = getProjectName(config);
    
    // Use the Expo-provided xcodeProject instead of manually parsing
    const xcodeProject = projectConfig.modResults;

    const targetName = "widget";
    const bundleIdentifier = `${config.ios!.bundleIdentifier!}.${targetName}`;
    const appGroupId = `group.pro.GoalAchieverAI`;

    const widgetPath = path.join(platformProjectRoot, targetName);
    const sourcePath = path.join(projectRoot, "widget/ios/widget");
    
    fs.copySync(sourcePath, widgetPath, { overwrite: true });

    const entitlementsPath = path.join(widgetPath, "widget.entitlements");
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${appGroupId}</string>
  </array>
</dict>
</plist>`;
    fs.writeFileSync(entitlementsPath, entitlementsContent);

    if (xcodeProject.pbxTargetByName(targetName)) {
      console.log(`[withWidgetXCode] Target '${targetName}' existiert bereits. Überspringe Erstellung.`);
      return projectConfig;
    }

    const widgetGroup = xcodeProject.addPbxGroup(
      [
        "widget.swift",
        "SharedDataManager.swift",
        "TaskIntents.swift",
        "Info.plist",
        "Assets.xcassets",
        "widget.entitlements",
      ],
      targetName,
      targetName
    );

    const groups = xcodeProject.hash.project.objects.PBXGroup;
    for (const key of Object.keys(groups)) {
      if (groups[key].name === undefined && groups[key].path === undefined) {
        xcodeProject.addToPbxGroup(widgetGroup.uuid, key);
        break;
      }
    }

    const target = xcodeProject.addTarget(targetName, "app_extension", targetName);
    
    xcodeProject.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
    xcodeProject.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);
    xcodeProject.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);

    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings && buildSettings.PRODUCT_NAME === `"${targetName}"`) {
        buildSettings["PRODUCT_BUNDLE_IDENTIFIER"] = `"${bundleIdentifier}"`;
        buildSettings["IPHONEOS_DEPLOYMENT_TARGET"] = `"17.0"`;
        buildSettings["TARGETED_DEVICE_FAMILY"] = `"1,2"`;
        buildSettings["CODE_SIGN_STYLE"] = `"Automatic"`;
        buildSettings["INFOPLIST_FILE"] = `"${targetName}/Info.plist"`;
        buildSettings["PRODUCT_NAME"] = `"${targetName}"`;
        buildSettings["SWIFT_VERSION"] = "5.0";
        buildSettings["CODE_SIGN_ENTITLEMENTS"] = `"${targetName}/widget.entitlements"`;
        delete buildSettings.DEVELOPMENT_TEAM;
      }
    }

    // Embed the widget target into the main app target
    const mainTarget = xcodeProject.pbxTargetByName(projectName);
    if (mainTarget) {
      try {
        // Add the widget as an app extension to the main target
        xcodeProject.addTargetDependency(mainTarget.uuid, target.uuid);
        console.log(`[withWidgetXCode] Widget target dependency added to main target.`);
      } catch (error) {
        console.log(`[withWidgetXCode] Could not add target dependency:`, error);
      }
    } else {
      console.error(`[withWidgetXCode] FEHLER: Haupt-Target '${projectName}' konnte nicht gefunden werden!`);
    }

    return projectConfig;
  });
};