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
    
    // Regular initializer
    init(frogTask: WidgetTaskData?, regularTasks: [WidgetTaskData], lastUpdated: String) {
        self.frogTask = frogTask
        self.regularTasks = regularTasks
        self.lastUpdated = lastUpdated
    }
    
    // Custom decoding to handle JSON null properly
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle frogTask that might be null in JSON
        if container.contains(.frogTask) && !(try container.decodeNil(forKey: .frogTask)) {
            self.frogTask = try container.decode(WidgetTaskData.self, forKey: .frogTask)
        } else {
            self.frogTask = nil
        }
        
        self.regularTasks = try container.decode([WidgetTaskData].self, forKey: .regularTasks)
        self.lastUpdated = try container.decode(String.self, forKey: .lastUpdated)
    }
    
    private enum CodingKeys: String, CodingKey {
        case frogTask, regularTasks, lastUpdated
    }
}

class SharedDataManager {
    static let shared = SharedDataManager()
    
    private let appGroupId = "group.pro.GoalAchieverAI"
    private let sharedTasksKey = "@goals_ai:widget_tasks"
    
    private init() {}
    
    func getWidgetData() -> WidgetData? {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            print("Failed to access App Group UserDefaults")
            return nil
        }
        
        guard let data = userDefaults.data(forKey: sharedTasksKey) else {
            print("No widget data found in shared container")
            return nil
        }
        
        // Validate data is not empty or corrupted
        guard data.count > 0 else {
            print("Widget data is empty")
            return nil
        }
        
        do {
            let widgetData = try JSONDecoder().decode(WidgetData.self, from: data)
            
            // Validate data structure
            guard widgetData.regularTasks.count <= 50 else {
                print("Too many tasks in widget data, truncating to 50")
                let truncatedData = WidgetData(
                    frogTask: widgetData.frogTask,
                    regularTasks: Array(widgetData.regularTasks.prefix(50)),
                    lastUpdated: widgetData.lastUpdated
                )
                return truncatedData
            }
            
            print("Successfully loaded widget data: \(widgetData.regularTasks.count) tasks")
            return widgetData
        } catch {
            print("Failed to decode widget data: \(error)")
            // Clear corrupted data
            userDefaults.removeObject(forKey: sharedTasksKey)
            return nil
        }
    }
    
    func markTaskCompleted(taskId: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            print("Failed to access App Group UserDefaults")
            return
        }
        
        guard var widgetData = getWidgetData() else {
            print("No widget data found to update")
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
            print("Task \(taskId) marked as completed in widget data")
        } catch {
            print("Failed to save updated widget data: \(error)")
        }
    }
}