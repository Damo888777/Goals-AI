//
//  SharedDataManager.swift
//  widget
//

import Foundation

// Shared data models matching TypeScript interfaces
struct WidgetTaskData: Codable {
    let id: String
    let title: String
    var isCompleted: Bool
    let isFrog: Bool
}

struct WidgetData: Codable {
    var frogTask: WidgetTaskData?
    var regularTasks: [WidgetTaskData]
    var lastUpdated: String
}

class SharedDataManager {
    static let shared = SharedDataManager()
    
    private let appGroupId = "group.pro.GoalAchieverAI"
    private let sharedTasksKey = "@goals_ai:widget_tasks"
    
    private init() {}
    
    func getWidgetData() -> WidgetData? {
        print("📁 [Swift Widget] Reading real data from UserDefaults")
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            print("📁 [Swift Widget] Failed to access App Group UserDefaults")
            return nil
        }
        
        // First try to read as Data (from UserDefaultsManager bridge)
        if let data = userDefaults.data(forKey: sharedTasksKey) {
            print("📁 [Swift Widget] Found Data object, attempting to decode...")
            do {
                let widgetData = try JSONDecoder().decode(WidgetData.self, from: data)
                print("📁 [Swift Widget] Successfully decoded from Data: \(widgetData.regularTasks.count) tasks")
                return widgetData
            } catch {
                print("📁 [Swift Widget] Failed to decode Data: \(error)")
            }
        }
        
        // Fallback: try to read as String (from AsyncStorage testing)
        if let jsonString = userDefaults.string(forKey: sharedTasksKey) {
            print("📁 [Swift Widget] Found String, attempting to decode...")
            guard let data = jsonString.data(using: .utf8) else {
                print("📁 [Swift Widget] Failed to convert string to data")
                return nil
            }
            
            do {
                let widgetData = try JSONDecoder().decode(WidgetData.self, from: data)
                print("📁 [Swift Widget] Successfully decoded from String: \(widgetData.regularTasks.count) tasks")
                return widgetData
            } catch {
                print("📁 [Swift Widget] Failed to decode String: \(error)")
            }
        }
        
        print("📁 [Swift Widget] No widget data found in UserDefaults")
        return nil
        
        /* ORIGINAL CODE - will restore after testing
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            print("📁 [Swift Widget] Failed to access App Group UserDefaults")
            return nil
        }
        
        guard let data = userDefaults.data(forKey: sharedTasksKey) else {
            print("📁 [Swift Widget] No widget data found in UserDefaults")
            return nil
        }
        
        // Validate data is not empty or corrupted
        guard data.count > 0 else {
            print("📁 [Swift Widget] Widget data is empty")
            return nil
        }
        
        do {
            let widgetData = try JSONDecoder().decode(WidgetData.self, from: data)
            
            // Validate data structure
            guard widgetData.regularTasks.count <= 50 else {
                print("📁 [Swift Widget] Too many tasks in widget data, truncating to 50")
                let truncatedData = WidgetData(
                    frogTask: widgetData.frogTask,
                    regularTasks: Array(widgetData.regularTasks.prefix(50)),
                    lastUpdated: widgetData.lastUpdated
                )
                return truncatedData
            }
            
            print("📁 [Swift Widget] Successfully loaded widget data: \(widgetData.regularTasks.count) tasks")
            return widgetData
        } catch {
            print("📁 [Swift Widget] Failed to decode widget data: \(error)")
            // Clear corrupted data
            userDefaults.removeObject(forKey: sharedTasksKey)
            return nil
        }
    }
    
    func markTaskCompleted(taskId: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            print("📁 [Swift Widget] Failed to access App Group UserDefaults")
            return
        }
        
        guard var widgetData = getWidgetData() else {
            print("📁 [Swift Widget] No widget data found to update")
            return
        }
        
        // Update frog task if it matches
        if let frogTask = widgetData.frogTask, frogTask.id == taskId {
            let updatedFrogTask = WidgetTaskData(
                id: frogTask.id,
                title: frogTask.title,
                isCompleted: true,
                isFrog: frogTask.isFrog
            )
            widgetData = WidgetData(
                frogTask: updatedFrogTask,
                regularTasks: widgetData.regularTasks,
                lastUpdated: ISO8601DateFormatter().string(from: Date())
            )
        }
        
        // Update regular task if it matches
        let updatedRegularTasks = widgetData.regularTasks.map { task in
            if task.id == taskId {
                return WidgetTaskData(
                    id: task.id,
                    title: task.title,
                    isCompleted: true,
                    isFrog: task.isFrog
                )
            }
            return task
        }
        
        widgetData = WidgetData(
            frogTask: widgetData.frogTask,
            regularTasks: updatedRegularTasks,
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        )
        
        // Save updated data
        do {
            let data = try JSONEncoder().encode(widgetData)
            userDefaults.set(data, forKey: sharedTasksKey)
            print("📁 [Swift Widget] Task \(taskId) marked as completed in widget data")
        } catch {
            print("📁 [Swift Widget] Failed to save updated widget data: \(error)")
        }
    }
}