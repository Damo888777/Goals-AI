//
//  LocalizationHelper.swift
//  widget
//

import Foundation

class LocalizationHelper {
    static let shared = LocalizationHelper()
    
    private init() {
        validateTranslations()
    }
    
    // Translation dictionaries
    private let translations: [String: [String: String]] = [
        "en": [
            "widget.today": "Today",
            "widget.noTasksScheduled": "No tasks scheduled",
            "widget.noFrogTaskSet": "No frog task set",
            "widget.allDoneForToday": "All done for today",
            "widget.moreTasksCount": "+ %d more",
            "widget.displayName": "Goals AI Tasks",
            "widget.description": "View today's Eat the Frog task and regular tasks."
        ],
        "de": [
            "widget.today": "Heute",
            "widget.noTasksScheduled": "Keine Aufgaben geplant",
            "widget.noFrogTaskSet": "Keine Frosch-Aufgabe gesetzt",
            "widget.allDoneForToday": "Alles erledigt für heute",
            "widget.moreTasksCount": "+ %d weitere",
            "widget.displayName": "Goals AI Aufgaben",
            "widget.description": "Zeige heutige Eat the Frog Aufgabe und reguläre Aufgaben an."
        ],
        "fr": [
            "widget.today": "Aujourd'hui",
            "widget.noTasksScheduled": "Aucune tâche programmée",
            "widget.noFrogTaskSet": "Aucune tâche grenouille définie",
            "widget.allDoneForToday": "Tout est terminé pour aujourd'hui",
            "widget.moreTasksCount": "+ %d de plus",
            "widget.displayName": "Tâches Goals AI",
            "widget.description": "Affiche la tâche Eat the Frog d'aujourd'hui et les tâches régulières."
        ]
    ]
    
    func localizedString(for key: String, language: String? = nil) -> String {
        // Validate key is not empty
        guard !key.isEmpty else {
            print("⚠️ LocalizationHelper: Empty translation key provided")
            return "Missing Translation"
        }
        
        let currentLanguage = language ?? SharedDataManager.shared.getCurrentLanguage()
        print("🌍 LocalizationHelper: Using language '\(currentLanguage)' for key '\(key)'")
        
        // Validate language is supported
        guard ["en", "de", "fr"].contains(currentLanguage) else {
            print("⚠️ LocalizationHelper: Unsupported language '\(currentLanguage)', falling back to English")
            return localizedString(for: key, language: "en")
        }
        
        // Get translation for current language
        if let languageDict = translations[currentLanguage],
           let translation = languageDict[key] {
            return translation
        }
        
        // Fallback to English
        if let englishDict = translations["en"],
           let fallback = englishDict[key] {
            print("⚠️ LocalizationHelper: Missing '\(key)' for '\(currentLanguage)', using English fallback")
            return fallback
        }
        
        // Return key if no translation found (development safety)
        print("❌ LocalizationHelper: Missing translation for key '\(key)' in all languages")
        return key.replacingOccurrences(of: "widget.", with: "").capitalized
    }
    
    func localizedString(for key: String, count: Int, language: String? = nil) -> String {
        let template = localizedString(for: key, language: language)
        return String(format: template, count)
    }
    
    // Date formatting with localization
    func formatDate(_ date: Date, language: String? = nil) -> (day: String, month: String, weekday: String) {
        let currentLanguage = language ?? SharedDataManager.shared.getCurrentLanguage()
        
        let locale = Locale(identifier: getLocaleIdentifier(for: currentLanguage))
        
        let dayFormatter = DateFormatter()
        dayFormatter.locale = locale
        dayFormatter.dateFormat = "d"
        
        let monthFormatter = DateFormatter()
        monthFormatter.locale = locale
        monthFormatter.dateFormat = "MMMM"
        
        let weekdayFormatter = DateFormatter()
        weekdayFormatter.locale = locale
        weekdayFormatter.dateFormat = "EEEE"
        
        return (
            day: dayFormatter.string(from: date),
            month: monthFormatter.string(from: date),
            weekday: weekdayFormatter.string(from: date)
        )
    }
    
    func formatShortDate(_ date: Date, language: String? = nil) -> String {
        let currentLanguage = language ?? SharedDataManager.shared.getCurrentLanguage()
        let locale = Locale(identifier: getLocaleIdentifier(for: currentLanguage))
        
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.dateFormat = "MMM, EEE"
        
        return formatter.string(from: date)
    }
    
    private func getLocaleIdentifier(for language: String) -> String {
        switch language {
        case "de":
            return "de_DE"
        case "fr":
            return "fr_FR"
        default:
            return "en_US"
        }
    }
    
    // MARK: - Validation
    private func validateTranslations() {
        let requiredKeys = [
            "widget.today",
            "widget.noTasksScheduled", 
            "widget.noFrogTaskSet",
            "widget.allDoneForToday",
            "widget.moreTasksCount",
            "widget.displayName",
            "widget.description"
        ]
        
        let supportedLanguages = ["en", "de", "fr"]
        
        for language in supportedLanguages {
            guard let languageDict = translations[language] else {
                print("⚠️ Missing translations for language: \(language)")
                continue
            }
            
            for key in requiredKeys {
                if languageDict[key] == nil {
                    print("⚠️ Missing translation key '\(key)' for language: \(language)")
                }
            }
        }
        
        print("✅ Translation validation completed")
    }
    
    // MARK: - Advanced Pluralization
    func localizedPluralString(for key: String, count: Int, language: String? = nil) -> String {
        let currentLanguage = language ?? SharedDataManager.shared.getCurrentLanguage()
        
        // Handle pluralization rules for different languages
        switch currentLanguage {
        case "de":
            return germanPluralForm(key: key, count: count)
        case "fr":
            return frenchPluralForm(key: key, count: count)
        default:
            return englishPluralForm(key: key, count: count)
        }
    }
    
    private func englishPluralForm(key: String, count: Int) -> String {
        if key == "widget.moreTasksCount" {
            if count == 1 {
                return "+ 1 more"
            } else {
                return "+ \(count) more"
            }
        }
        return localizedString(for: key, count: count)
    }
    
    private func germanPluralForm(key: String, count: Int) -> String {
        if key == "widget.moreTasksCount" {
            if count == 1 {
                return "+ 1 weitere"
            } else {
                return "+ \(count) weitere"
            }
        }
        return localizedString(for: key, count: count)
    }
    
    private func frenchPluralForm(key: String, count: Int) -> String {
        if key == "widget.moreTasksCount" {
            if count == 1 {
                return "+ 1 de plus"
            } else {
                return "+ \(count) de plus"
            }
        }
        return localizedString(for: key, count: count)
    }
}
