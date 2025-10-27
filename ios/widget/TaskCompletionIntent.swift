//
//  TaskCompletionIntent.swift
//  App Intent for completing tasks from widget
//

import Foundation
import AppIntents
import WidgetKit

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
        print("🚀 [CompleteTaskIntent] PERFORM CALLED! TaskId: \(taskId), Title: \(taskTitle)")
        
        // Write completion to App Group storage for app to process
        let appGroupId = "group.pro.GoalAchieverAI"
        let completionsKey = "@goals_ai:widget_completions"
        
        print("🚀 [CompleteTaskIntent] Using App Group: \(appGroupId), Key: \(completionsKey)")
        
        if let userDefaults = UserDefaults(suiteName: appGroupId) {
            // Get existing completions - try Data first, then String for backward compatibility
            var completions: [[String: Any]] = []
            
            if let existingData = userDefaults.data(forKey: completionsKey) {
                // Read as Data (new format)
                completions = (try? JSONSerialization.jsonObject(with: existingData, options: [])) as? [[String: Any]] ?? []
            } else if let existingString = userDefaults.string(forKey: completionsKey) {
                // Fallback to String (old format)
                completions = (try? JSONSerialization.jsonObject(with: existingString.data(using: .utf8) ?? Data(), options: [])) as? [[String: Any]] ?? []
            }
            
            // Add new completion
            let completion = [
                "taskId": taskId,
                "taskTitle": taskTitle,
                "completedAt": ISO8601DateFormatter().string(from: Date()),
                "source": "widget",
                "action": "complete"
            ]
            completions.append(completion)
            
            // Save back to UserDefaults as Data (not String) for bridge compatibility
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: completions, options: [])
                userDefaults.set(jsonData, forKey: completionsKey)
                print("🚀 [CompleteTaskIntent] Successfully saved completion data: \(completion)")
            } catch {
                print("❌ [CompleteTaskIntent] Failed to serialize completions: \(error)")
            }
            userDefaults.synchronize()
            print("🚀 [CompleteTaskIntent] UserDefaults synchronized")
            
            // Update widget data to reflect completion immediately
            updateWidgetData(completedTaskId: taskId)
            
            // Reload all widget timelines
            WidgetCenter.shared.reloadAllTimelines()
            print("🚀 [CompleteTaskIntent] Widget timelines reloaded, task completion finished!")
            
            return .result()
        } else {
            print("❌ [CompleteTaskIntent] Failed to access App Group: \(appGroupId)")
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
        print("🐸 [ToggleFrogTaskIntent] PERFORM CALLED! TaskId: \(taskId), Title: \(taskTitle)")
        
        let appGroupId = "group.pro.GoalAchieverAI"
        let tasksKey = "@goals_ai:widget_tasks"
        let completionsKey = "@goals_ai:widget_completions"
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            throw NSError(domain: "WidgetError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to access App Group"])
        }
        
        // Get current widget data - try Data first, then String for backward compatibility
        var jsonData: Data?
        
        if let data = userDefaults.data(forKey: tasksKey) {
            jsonData = data
        } else if let stringData = userDefaults.string(forKey: tasksKey) {
            jsonData = stringData.data(using: .utf8)
        }
        
        guard let validJsonData = jsonData else {
            throw NSError(domain: "WidgetError", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to read widget data"])
        }
        
        do {
            var widgetData = try JSONDecoder().decode(WidgetData.self, from: validJsonData)
            
            // Toggle frog task completion
            if let frogTask = widgetData.frogTask, frogTask.id == taskId {
                let wasCompleted = frogTask.isCompleted
                widgetData.frogTask = WidgetTaskData(
                    id: frogTask.id,
                    title: frogTask.title,
                    isCompleted: !wasCompleted,
                    isFrog: frogTask.isFrog
                )
                
                // Log completion/incompletion as JSON string
                let existingData = userDefaults.string(forKey: completionsKey) ?? "[]"
                var completions = (try? JSONSerialization.jsonObject(with: existingData.data(using: .utf8) ?? Data(), options: [])) as? [[String: Any]] ?? []
                let completion = [
                    "taskId": taskId,
                    "taskTitle": taskTitle,
                    "completedAt": ISO8601DateFormatter().string(from: Date()),
                    "source": "widget",
                    "action": !wasCompleted ? "complete" : "uncomplete"
                ]
                completions.append(completion)
                do {
                    let jsonData = try JSONSerialization.data(withJSONObject: completions, options: [])
                    userDefaults.set(jsonData, forKey: completionsKey)
                } catch {
                    print("Failed to serialize completions: \(error)")
                }
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
            print("Failed to toggle frog task: \(error)")
            throw NSError(domain: "WidgetError", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to process widget data: \(error.localizedDescription)"])
        }
    }
}

// Data models are defined in SharedDataManager.swift to avoid duplicates
