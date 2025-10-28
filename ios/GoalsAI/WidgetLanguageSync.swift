//
//  WidgetLanguageSync.swift
//  GoalsAI
//

import Foundation
import React
import WidgetKit

@objc(WidgetLanguageSync)
class WidgetLanguageSync: NSObject {
    
    private let appGroupId = "group.pro.GoalAchieverAI"
    private let languageKey = "user-language"
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func setLanguage(_ language: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            rejecter("ERROR", "Failed to access App Group UserDefaults", nil)
            return
        }
        
        // Validate language
        let supportedLanguages = ["en", "de", "fr"]
        guard supportedLanguages.contains(language) else {
            rejecter("INVALID_LANGUAGE", "Unsupported language: \(language)", nil)
            return
        }
        
        // Set language in shared container
        userDefaults.set(language, forKey: languageKey)
        userDefaults.synchronize()
        
        // Immediately refresh widget to show new language
        WidgetCenter.shared.reloadTimelines(ofKind: "widget")
        
        print("✅ Widget language set to: \(language) and widget refreshed")
        resolver("Language synced successfully")
    }
    
    @objc
    func getLanguage(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            rejecter("ERROR", "Failed to access App Group UserDefaults", nil)
            return
        }
        
        let language = userDefaults.string(forKey: languageKey) ?? "en"
        resolver(language)
    }
}
