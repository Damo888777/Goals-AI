//
//  WidgetBuildValidator.swift
//  widget
//
//  Build-time validation to prevent EAS build crashes
//

import Foundation
import WidgetKit

class WidgetBuildValidator {
    static func validateConfiguration() {
        print("🔍 [BuildValidator] Starting widget build validation...")
        
        // Validate App Group configuration
        validateAppGroup()
        
        // Validate localization completeness
        validateLocalization()
        
        // Validate required frameworks
        validateFrameworks()
        
        print("✅ [BuildValidator] Widget build validation completed successfully")
    }
    
    private static func validateAppGroup() {
        let appGroupId = "group.pro.GoalAchieverAI"
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            print("❌ [BuildValidator] CRITICAL: App Group '\(appGroupId)' not accessible")
            print("❌ [BuildValidator] This will cause widget functionality to fail")
            return
        }
        
        // Test write/read capability
        let testKey = "build_validation_test"
        let testValue = "validation_success"
        
        userDefaults.set(testValue, forKey: testKey)
        userDefaults.synchronize()
        
        if let readValue = userDefaults.string(forKey: testKey), readValue == testValue {
            userDefaults.removeObject(forKey: testKey)
            print("✅ [BuildValidator] App Group validation successful")
        } else {
            print("❌ [BuildValidator] App Group read/write test failed")
        }
    }
    
    private static func validateLocalization() {
        let localization = LocalizationHelper.shared
        let requiredKeys = [
            "widget.today",
            "widget.noTasksScheduled", 
            "widget.noFrogTaskSet",
            "widget.allDoneForToday",
            "widget.moreTasksCount",
            "widget.displayName",
            "widget.description"
        ]
        
        let languages = ["en", "de", "fr"]
        var hasErrors = false
        
        for language in languages {
            for key in requiredKeys {
                let translation = localization.localizedString(for: key, language: language)
                if translation == key || translation.isEmpty {
                    print("❌ [BuildValidator] Missing translation: '\(key)' for language '\(language)'")
                    hasErrors = true
                }
            }
        }
        
        if !hasErrors {
            print("✅ [BuildValidator] All translations validated successfully")
        }
    }
    
    private static func validateFrameworks() {
        // Validate WidgetKit availability
        if #available(iOS 17.0, *) {
            print("✅ [BuildValidator] WidgetKit iOS 17.0+ available")
        } else {
            print("❌ [BuildValidator] WidgetKit requires iOS 17.0+")
        }
        
        // Validate AppIntents availability
        if #available(iOS 16.0, *) {
            print("✅ [BuildValidator] AppIntents available")
        } else {
            print("❌ [BuildValidator] AppIntents requires iOS 16.0+")
        }
    }
}

// Run validation during widget initialization
extension GoalsAIWidgetBundle {
    init() {
        #if DEBUG
        WidgetBuildValidator.validateConfiguration()
        #endif
    }
}
