"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withWidgetIos_1 = require("./ios/withWidgetIos");
/**
 * Expo Config Plugin zum Einrichten eines Widget Targets mit App Group Support.
 */
const withWidget = (config, options) => {
    var _a;
    const bundleId = ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier) || "com.example.app";
    // App Group ID generieren, falls keine angegeben ist
    const appGroupId = options.appGroupId || `group.${bundleId.replace(/[^a-zA-Z0-9.]/g, "")}`;
    // iOS sicherstellen + Mutability erzwingen
    if (!config.ios)
        config.ios = {};
    const iosConfig = config.ios;
    // ✅ Dev Team ID setzen
    iosConfig.teamId = options.devTeamId;
    // ✅ App Group Entitlement für Haupt-App hinzufügen
    config = (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        const rawGroups = config.modResults["com.apple.security.application-groups"];
        // Typischerweise string[] oder undefined, wir casten defensiv
        const groups = Array.isArray(rawGroups)
            ? rawGroups
            : typeof rawGroups === "string"
                ? [rawGroups]
                : [];
        if (!groups.includes(appGroupId)) {
            config.modResults["com.apple.security.application-groups"] = [
                ...groups,
                appGroupId,
            ];
        }
        return config;
    });
    // ✅ Widget Target simulieren (für interne Konsistenz bei EAS)
    iosConfig["widgetTarget"] = {
        bundleIdentifier: `${bundleId}.widget`,
        entitlements: {
            "com.apple.security.application-groups": [appGroupId],
        },
    };
    // ✅ Übergib Parameter an dein iOS Widget Setup
    config = (0, withWidgetIos_1.withWidgetIos)(config, { ...options, appGroupId });
    return config;
};
exports.default = withWidget;
//# sourceMappingURL=index.js.map