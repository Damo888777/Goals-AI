"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetXCode = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
// HILFSFUNKTION, UM DEN PROJEKTNAMEN ZU BEKOMMEN
function getProjectName(config) {
    const { name } = config;
    return name.replace(/[^A-Za-z0-9]/g, "");
}
const withWidgetXCode = (config, options = {}) => {
    return (0, config_plugins_1.withXcodeProject)(config, (projectConfig) => {
        const platformProjectRoot = projectConfig.modRequest.platformProjectRoot;
        const projectRoot = projectConfig.modRequest.projectRoot;
        const projectName = getProjectName(config);
        // Use the Expo-provided xcodeProject instead of manually parsing
        const xcodeProject = projectConfig.modResults;
        const targetName = "widget";
        const bundleIdentifier = `${config.ios.bundleIdentifier}.${targetName}`;
        const appGroupId = options.appGroupId || `group.${config.ios.bundleIdentifier}`;
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
        const widgetGroup = xcodeProject.addPbxGroup([
            "widget.swift",
            "SharedDataManager.swift",
            "TaskIntents.swift",
            "Info.plist",
            "Assets.xcassets",
            "widget.entitlements",
        ], targetName, targetName);
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
            }
            catch (error) {
                console.log(`[withWidgetXCode] Could not add target dependency:`, error);
            }
        }
        else {
            console.error(`[withWidgetXCode] FEHLER: Haupt-Target '${projectName}' konnte nicht gefunden werden!`);
        }
        return projectConfig;
    });
};
exports.withWidgetXCode = withWidgetXCode;
//# sourceMappingURL=withWidgetXCode.js.map