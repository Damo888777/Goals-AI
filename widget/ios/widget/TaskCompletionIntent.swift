//
//  TaskCompletionIntent.swift
//  App Intent for completing tasks from widget
//

import Foundation
import AppIntents
import WidgetKit

@available(iOS 16.0, *)
struct CompleteTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Complete Task"
    static var description = IntentDescription("Mark a task as completed from the widget")
    
    @Parameter(title: "Task ID")
    var taskId: String
    
    @Parameter(title: "Task Title")
    var taskTitle: String
    
    init() {
        self.taskId = ""
        self.taskTitle = ""
    }
    
    init(taskId: String, taskTitle: String) {
        self.taskId = taskId
        self.taskTitle = taskTitle
    }
    
    func perform() async throws -> some IntentResult {
        // Write completion to App Group storage for app to process
        let appGroupId = "group.pro.GoalAchieverAI"
        let completionsKey = "@goals_ai:widget_completions"
        
        if let userDefaults = UserDefaults(suiteName: appGroupId) {
            // Get existing completions
            var completions = userDefaults.array(forKey: completionsKey) as? [[String: Any]] ?? []
            
            // Add new completion
            let completion = [
                "taskId": taskId,
                "taskTitle": taskTitle,
                "completedAt": ISO8601DateFormatter().string(from: Date()),
                "source": "widget"
            ]
            completions.append(completion)
            
            // Save back to UserDefaults
            userDefaults.set(completions, forKey: completionsKey)
            userDefaults.synchronize()
            
            // Update widget data to reflect completion immediately
            updateWidgetData(completedTaskId: taskId)
            
            // Reload all widget timelines
            WidgetCenter.shared.reloadAllTimelines()
            
            return .result()
        } else {
            throw NSError(domain: "WidgetError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to access App Group"])
        }
    }
    
    private func updateWidgetData(completedTaskId: String) {
        let appGroupId = "group.pro.GoalAchieverAI"
        let tasksKey = "@goals_ai:widget_tasks"
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId),
              let tasksData = userDefaults.string(forKey: tasksKey),
              let jsonData = tasksData.data(using: .utf8) else { return }
        
        do {
            var widgetData = try JSONDecoder().decode(WidgetData.self, from: jsonData)
            
            // Mark frog task as completed if it matches
            if widgetData.frogTask?.id == completedTaskId {
                widgetData.frogTask?.isCompleted = true
            }
            
            // Mark regular task as completed if it matches
            if let taskIndex = widgetData.regularTasks.firstIndex(where: { $0.id == completedTaskId }) {
                widgetData.regularTasks[taskIndex].isCompleted = true
            }
            
            // Update timestamp
            widgetData.lastUpdated = ISO8601DateFormatter().string(from: Date())
            
            // Save updated data
            let updatedData = try JSONEncoder().encode(widgetData)
            if let updatedString = String(data: updatedData, encoding: .utf8) {
                userDefaults.set(updatedString, forKey: tasksKey)
                userDefaults.synchronize()
            }
        } catch {
            print("Failed to update widget data after completion: \(error)")
        }
    }
}

@available(iOS 16.0, *)
struct ToggleFrogTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Frog Task"
    static var description = IntentDescription("Toggle the completion state of the frog task")
    
    @Parameter(title: "Task ID")
    var taskId: String
    
    @Parameter(title: "Task Title")
    var taskTitle: String
    
    init() {
        self.taskId = ""
        self.taskTitle = ""
    }
    
    init(taskId: String, taskTitle: String) {
        self.taskId = taskId
        self.taskTitle = taskTitle
    }
    
    func perform() async throws -> some IntentResult {
        let appGroupId = "group.pro.GoalAchieverAI"
        let tasksKey = "@goals_ai:widget_tasks"
        let completionsKey = "@goals_ai:widget_completions"
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            throw NSError(domain: "WidgetError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to access App Group"])
        }
        
        // Get current widget data
        guard let tasksData = userDefaults.string(forKey: tasksKey),
              let jsonData = tasksData.data(using: .utf8) else {
            throw NSError(domain: "WidgetError", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to read widget data"])
        }
        
        do {
            var widgetData = try JSONDecoder().decode(WidgetData.self, from: jsonData)
            
            // Toggle frog task completion
            if widgetData.frogTask?.id == taskId {
                let wasCompleted = widgetData.frogTask?.isCompleted ?? false
                widgetData.frogTask?.isCompleted = !wasCompleted
                
                // Log completion/incompletion
                var completions = userDefaults.array(forKey: completionsKey) as? [[String: Any]] ?? []
                let completion = [
                    "taskId": taskId,
                    "taskTitle": taskTitle,
                    "completedAt": ISO8601DateFormatter().string(from: Date()),
                    "source": "widget",
                    "action": !wasCompleted ? "complete" : "uncomplete"
                ]
                completions.append(completion)
                userDefaults.set(completions, forKey: completionsKey)
            }
            
            // Update timestamp
            widgetData.lastUpdated = ISO8601DateFormatter().string(from: Date())
            
            // Save updated data
            let updatedData = try JSONEncoder().encode(widgetData)
            if let updatedString = String(data: updatedData, encoding: .utf8) {
                userDefaults.set(updatedString, forKey: tasksKey)
                userDefaults.synchronize()
            }
            
            // Reload widget timelines
            WidgetCenter.shared.reloadAllTimelines()
            
            return .result()
        } catch {
            throw NSError(domain: "WidgetError", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to process widget data: \(error.localizedDescription)"])
        }
    }
}

// MARK: - Widget Data Models
struct WidgetData: Codable {
    var frogTask: WidgetTaskData?
    var regularTasks: [WidgetTaskData]
    var lastUpdated: String
}

struct WidgetTaskData: Codable {
    let id: String
    let title: String
    var isCompleted: Bool
    let isFrog: Bool
}
