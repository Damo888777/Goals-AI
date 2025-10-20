import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins"
import fs from "fs-extra"
import path from "path"
const xcode = require("xcode")
import { WithWidgetProps } from "../index"

const EXTENSION_TARGET_NAME = "widget"

const TOP_LEVEL_FILES = ["Assets.xcassets", "Info.plist", "widget.swift", "widget.entitleaments", "SharedDataManager.swift", "TaskIntents.swift"]

export const withWidgetXCode: ConfigPlugin<WithWidgetProps> = (
  config,
  options: WithWidgetProps,
) => {
  return withXcodeProject(config, async newConfig => {
    const projectName = newConfig.modRequest.projectName
    const projectPath = newConfig.modRequest.projectRoot
    const platformProjectPath = newConfig.modRequest.platformProjectRoot
    const widgetSourceDirPath = path.join(
      projectPath,
      "widget",
      "ios",
      "widget",
    )
    const bundleId = config.ios?.bundleIdentifier || ""
    const widgetBundleId = `${bundleId}.widget`

    const extensionFilesDir = path.join(
      platformProjectPath,
      EXTENSION_TARGET_NAME,
    )
    fs.copySync(widgetSourceDirPath, extensionFilesDir)

    const projPath = `${newConfig.modRequest.platformProjectRoot}/${projectName}.xcodeproj/project.pbxproj`
    const xcodeProject = xcode.project(projPath)

    xcodeProject.parseSync()

    // DIESE ZEILE WAR DER FEHLER - JETZT IST SIE KORREKT HINZUGEFÜGT
    const projObjects = xcodeProject.hash.project.objects;

    // Überprüfen, ob das Target bereits existiert, um Duplikate zu vermeiden
    const existingTarget = xcodeProject.pbxTargetByName(EXTENSION_TARGET_NAME);
    if (existingTarget) {
        console.log(`[withWidgetXCode] Target '${EXTENSION_TARGET_NAME}' existiert bereits. Überspringe Erstellung.`);
        return newConfig;
    }

    const pbxGroup = xcodeProject.addPbxGroup(
      TOP_LEVEL_FILES,
      EXTENSION_TARGET_NAME,
      EXTENSION_TARGET_NAME,
    )
    
    const groups = xcodeProject.hash.project.objects.PBXGroup
    Object.keys(groups).forEach(function (groupKey) {
      if (groups[groupKey].name === undefined) {
        xcodeProject.addToPbxGroup(pbxGroup.uuid, groupKey)
      }
    })

    projObjects["PBXTargetDependency"] = projObjects["PBXTargetDependency"] || {}
    projObjects["PBXContainerItemProxy"] = projObjects["PBXContainerItemProxy"] || {}

    const widgetTarget = xcodeProject.addTarget(
      EXTENSION_TARGET_NAME,
      "app_extension",
      EXTENSION_TARGET_NAME,
      widgetBundleId,
    )

    xcodeProject.addBuildPhase(["widget.swift", "SharedDataManager.swift", "TaskIntents.swift"], "PBXSourcesBuildPhase", "Sources", widgetTarget.uuid, undefined, "widget")
    xcodeProject.addBuildPhase(["SwiftUI.framework", "WidgetKit.framework"], "PBXFrameworksBuildPhase", "Frameworks", widgetTarget.uuid)
    xcodeProject.addBuildPhase(["Assets.xcassets"], "PBXResourcesBuildPhase", "Resources", widgetTarget.uuid, undefined, "widget")

    const configurations = xcodeProject.pbxXCBuildConfigurationSection()
    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== "undefined") {
        const buildProductName = configurations[key].buildSettings.PRODUCT_NAME
        if (buildProductName === `"${EXTENSION_TARGET_NAME}"`) {
          // Wir entfernen alle hartcodierten Signatur-Einstellungen.
          // Nur das Nötigste bleibt.
          configurations[key].buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "17.0"
          configurations[key].buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${widgetBundleId}"`
          configurations[key].buildSettings.CODE_SIGN_STYLE = `"Automatic"`
          configurations[key].buildSettings.TARGETED_DEVICE_FAMILY = `"1"`
          configurations[key].buildSettings.INFOPLIST_FILE = `"widget/Info.plist"`
          configurations[key].buildSettings.SWIFT_VERSION = "5.0"
          
          // DIESE ZEILEN SIND ENTSCHEIDEND - sie sagen Xcode, es soll nicht selbst entscheiden, sondern gehorchen.
          delete configurations[key].buildSettings.PROVISIONING_PROFILE_SPECIFIER
          delete configurations[key].buildSettings.CODE_SIGN_IDENTITY
          delete configurations[key].buildSettings.DEVELOPMENT_TEAM
        }
      }
    }

    fs.writeFileSync(projPath, xcodeProject.writeSync())

    return newConfig
  })
}