import { ConfigPlugin, withInfoPlist } from "@expo/config-plugins"
import { withWidgetXCode } from "./withWidgetXCode"
import { withWidgetEAS } from "./withWidgetEAS"
import { WithWidgetProps } from "../index"
import * as fs from "fs"
import * as path from "path"
import plist from "@expo/plist"

// Funktion zum Hinzufügen der App Group zu Widget Entitlements
const withWidgetEntitlements: ConfigPlugin<WithWidgetProps> = (
  config,
  options
) => {
  return withInfoPlist(config, (config) => {
    // Wir verwenden withInfoPlist als Hook um nach dem prebuild zu laufen
    // und dann manuell die entitlements Datei zu erstellen/modifizieren
    
    const projectRoot = config._internal?.projectRoot || "."
    const widgetName = "widget" // Standard Widget Name
    const widgetEntitlementsPath = path.join(
      projectRoot,
      "ios",
      widgetName,
      `${widgetName}.entitlements`
    )
    
    // Erstelle das Widget Verzeichnis falls es nicht existiert
    const widgetDir = path.dirname(widgetEntitlementsPath)
    if (!fs.existsSync(widgetDir)) {
      fs.mkdirSync(widgetDir, { recursive: true })
    }
    
    // App Group ID - verwende die aus options oder generiere eine
    const appGroupId = options.appGroupId || 
      `group.${config.ios?.bundleIdentifier || "com.example"}.widgetextension`
    
    // Entitlements Inhalt
    const entitlements = {
      "com.apple.security.application-groups": [appGroupId]
    }
    
    // Schreibe die Entitlements Datei
    try {
      const entitlementsContent = plist.build(entitlements)
      fs.writeFileSync(widgetEntitlementsPath, entitlementsContent)
      
      console.log(`✅ Widget entitlements created with App Group: ${appGroupId}`)
    } catch (error) {
      console.error(`❌ Failed to create widget entitlements: ${error}`)
    }
    
    // Stelle sicher dass auch die Haupt-App die App Group hat
    if (!config.ios) {
      config.ios = {}
    }
    if (!config.ios.entitlements) {
      config.ios.entitlements = {}
    }
    if (!config.ios.entitlements["com.apple.security.application-groups"]) {
      config.ios.entitlements["com.apple.security.application-groups"] = []
    }
    if (!config.ios.entitlements["com.apple.security.application-groups"].includes(appGroupId)) {
      config.ios.entitlements["com.apple.security.application-groups"].push(appGroupId)
    }
    
    return config
  })
}

export const withWidgetIos: ConfigPlugin<WithWidgetProps> = (
  config,
  options,
) => {
  // Zuerst die bestehenden Plugin Funktionen ausführen
  config = withWidgetXCode(config, options)
  config = withWidgetEAS(config, options)
  
  // Dann App Groups hinzufügen wenn eine appGroupId vorhanden ist
  if (options.appGroupId) {
    config = withWidgetEntitlements(config, options)
  }
  
  return config
}