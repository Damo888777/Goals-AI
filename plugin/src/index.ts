import { ConfigPlugin, withEntitlementsPlist } from "@expo/config-plugins"
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

  // ✅ Übergib Parameter an dein iOS Widget Setup
  config = withWidgetIos(config, { ...options, appGroupId })

  return config
}

export default withWidget
