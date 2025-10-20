"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetEAS = void 0;
const withWidgetEAS = (config, options) => {
    var _a;
    // Pfad zur EAS Build Konfiguration im app.json extra-Feld
    config.extra = config.extra || {};
    config.extra.eas = config.extra.eas || {};
    config.extra.eas.build = config.extra.eas.build || {};
    config.extra.eas.build.experimental =
        config.extra.eas.build.experimental || {};
    config.extra.eas.build.experimental.ios =
        config.extra.eas.build.experimental.ios || {};
    config.extra.eas.build.experimental.ios.appExtensions =
        config.extra.eas.build.experimental.ios.appExtensions || [];
    // Überprüfen, ob das Widget bereits konfiguriert ist
    const widgetIndex = config.extra.eas.build.experimental.ios.appExtensions.findIndex((extension) => extension.targetName === "widget");
    if (widgetIndex !== -1) {
        // Widget-Konfiguration entfernen, um sie neu hinzuzufügen
        config.extra.eas.build.experimental.ios.appExtensions.splice(widgetIndex, 1);
    }
    const bundleIdentifier = (_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier;
    if (!bundleIdentifier) {
        throw new Error(`[withWidget] ios.bundleIdentifier muss in der app.json gesetzt sein.`);
    }
    const appGroupId = options.appGroupId;
    if (!appGroupId) {
        throw new Error(`[withWidget] appGroupId muss in den Plugin-Optionen übergeben werden.`);
    }
    // Die neue, erweiterte Konfiguration für die App Extension
    const newExtensionConfig = {
        targetName: "widget",
        bundleIdentifier: `${bundleIdentifier}.widget`,
        // DIES IST DER ENTSCHEIDENDE TEIL:
        // Wir teilen EAS direkt mit, welche Entitlements das Provisioning Profile haben MUSS.
        entitlements: {
            "com.apple.security.application-groups": [appGroupId],
        },
    };
    config.extra.eas.build.experimental.ios.appExtensions.push(newExtensionConfig);
    return config;
};
exports.withWidgetEAS = withWidgetEAS;
//# sourceMappingURL=withWidgetEAS.js.map