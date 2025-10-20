"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetIos = void 0;
const withWidgetXCode_1 = require("./withWidgetXCode");
const withWidgetEAS_1 = require("./withWidgetEAS");
const withWidgetIos = (config, options) => {
    // Führe die notwendigen Modifikatoren in der richtigen Reihenfolge aus.
    // Zuerst die EAS-Konfiguration, damit EAS über die Extension Bescheid weiß.
    config = (0, withWidgetEAS_1.withWidgetEAS)(config, options);
    // Dann die Xcode-Projektmodifikation, die das Target, die Dateien,
    // die Build-Settings UND die Entitlements korrekt einrichtet.
    config = (0, withWidgetXCode_1.withWidgetXCode)(config, options);
    // Stelle sicher, dass die Haupt-App auch die App Group hat.
    // Dies ist der einzige Teil, den wir aus der alten Logik behalten.
    if (options.appGroupId) {
        if (!config.ios)
            config.ios = {};
        if (!config.ios.entitlements)
            config.ios.entitlements = {};
        const appGroups = config.ios.entitlements["com.apple.security.application-groups"] || [];
        if (!appGroups.includes(options.appGroupId)) {
            appGroups.push(options.appGroupId);
        }
        config.ios.entitlements["com.apple.security.application-groups"] = appGroups;
    }
    return config;
};
exports.withWidgetIos = withWidgetIos;
//# sourceMappingURL=withWidgetIos.js.map