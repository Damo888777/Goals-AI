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
exports.withWidgetIos = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withWidgetXCode_1 = require("./withWidgetXCode");
const withWidgetEAS_1 = require("./withWidgetEAS");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const withWidgetIos = (config, options) => {
    // Führe die notwendigen Modifikatoren in der richtigen Reihenfolge aus.
    // Zuerst die EAS-Konfiguration, damit EAS über die Extension Bescheid weiß.
    config = (0, withWidgetEAS_1.withWidgetEAS)(config, options);
    // Dann die Xcode-Projektmodifikation, die das Target, die Dateien,
    // die Build-Settings UND die Entitlements korrekt einrichtet.
    config = (0, withWidgetXCode_1.withWidgetXCode)(config, options);
    // Fix TaskIntents.swift to use applicationName placeholder
    config = (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (config) => {
            const taskIntentsPath = path.join(config.modRequest.platformProjectRoot, "widget", "TaskIntents.swift");
            if (fs.existsSync(taskIntentsPath)) {
                let content = fs.readFileSync(taskIntentsPath, "utf8");
                // Fix the phrases to use applicationName placeholder
                const oldPhrase = 'phrases: ["Complete task in Goals AI"]';
                const newPhrase = 'phrases: ["Complete task in \\(.applicationName)"]';
                if (content.includes(oldPhrase)) {
                    content = content.replace(oldPhrase, newPhrase);
                    fs.writeFileSync(taskIntentsPath, content, "utf8");
                    console.log("✅ Fixed TaskIntents.swift to use applicationName placeholder");
                }
            }
            return config;
        }
    ]);
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