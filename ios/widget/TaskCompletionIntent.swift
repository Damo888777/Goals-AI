//
//  TaskCompletionIntent.swift
//  App Intent for completing tasks from widget
//

import SwiftUI
import AppIntents
import UIKit
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
        let startTime = Date()
        print("🚀 [CompleteTaskIntent] ========== TASK COMPLETION STARTED ==========")
        print("🚀 [CompleteTaskIntent] Task ID: \(taskId)")
        print("🚀 [CompleteTaskIntent] Task Title: '\(taskTitle)'")
        print("🚀 [CompleteTaskIntent] Timestamp: \(ISO8601DateFormatter().string(from: startTime))")
        
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
            await updateWidgetData(completedTaskId: taskId)
            
            // Add haptic feedback for completion
            do {
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.prepare() // Prepare for optimal performance
                impactFeedback.impactOccurred()
                print("✅ [CompleteTaskIntent] Haptic feedback triggered successfully")
            } catch {
                print("⚠️ [CompleteTaskIntent] Haptic feedback failed: \(error)")
            }
            
            // Modern iOS widget update pattern with optimized performance
            await performOptimizedWidgetUpdate()
            
            let completionTime = Date()
            let executionTime = completionTime.timeIntervalSince(startTime)
            print("🚀 [CompleteTaskIntent] ========== TASK COMPLETION FINISHED ==========")
            print("🚀 [CompleteTaskIntent] Execution time: \(String(format: "%.3f", executionTime))s")
            print("🚀 [CompleteTaskIntent] Status: SUCCESS ✅")
            
            return .result()
        } else {
            print("❌ [CompleteTaskIntent] Failed to access App Group: \(appGroupId)")
            throw NSError(domain: "WidgetError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to access App Group"])
        }
    }
    
    private func updateWidgetData(completedTaskId: String) async {
        let appGroupId = "group.pro.GoalAchieverAI"
        let tasksKey = "@goals_ai:widget_tasks"
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { 
            print("❌ [Widget Update] CRITICAL: Failed to access App Group \(appGroupId)")
            print("❌ [Widget Update] This indicates a configuration issue with App Groups")
            return 
        }
        
        print("✅ [Widget Update] Successfully accessed App Group for task: \(completedTaskId)")
        
        // Try Data first, then String for backward compatibility
        var jsonData: Data?
        
        if let data = userDefaults.data(forKey: tasksKey) {
            jsonData = data
        } else if let stringData = userDefaults.string(forKey: tasksKey) {
            jsonData = stringData.data(using: .utf8)
        }
        
        guard let validJsonData = jsonData else {
            print("❌ [Widget Update] CRITICAL: No widget data found in App Group")
            print("❌ [Widget Update] Checked both Data and String formats for key: \(tasksKey)")
            print("❌ [Widget Update] This suggests the main app hasn't written widget data yet")
            return
        }
        
        print("✅ [Widget Update] Found widget data (\(validJsonData.count) bytes)")
        
        do {
            var widgetData = try JSONDecoder().decode(WidgetData.self, from: validJsonData)
            print("🔄 [Widget Update] Current widget data loaded, updating task: \(completedTaskId)")
            
            // Remove completed frog task entirely (don't just mark as completed)
            if widgetData.frogTask?.id == completedTaskId {
                print("🐸 [Widget Update] Removing completed frog task")
                widgetData.frogTask = nil
            }
            
            // Remove completed regular task entirely (don't just mark as completed)
            widgetData.regularTasks.removeAll { $0.id == completedTaskId }
            print("📝 [Widget Update] Removed completed regular task, remaining: \(widgetData.regularTasks.count)")
            
            // Update timestamp
            widgetData.lastUpdated = ISO8601DateFormatter().string(from: Date())
            
            // Save updated data as Data (consistent with UserDefaultsManager)
            let updatedData = try JSONEncoder().encode(widgetData)
            userDefaults.set(updatedData, forKey: tasksKey)
            userDefaults.synchronize()
            
            print("✅ [Widget Update] Widget data updated and saved successfully")
        } catch {
            print("❌ [Widget Update] Failed to update widget data: \(error)")
        }
    }
    
    /// Performs optimized widget updates using modern iOS patterns
    private func performOptimizedWidgetUpdate() async {
        await MainActor.run {
            // Immediate update for instant UI feedback
            WidgetCenter.shared.reloadAllTimelines()
            print("✅ [Widget Update] Immediate reload triggered")
        }
        
        // Schedule secondary update to ensure consistency
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            WidgetCenter.shared.reloadTimelines(ofKind: "widget")
            print("🚀 [Widget Update] Optimized secondary reload completed")
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
            
            // Add haptic feedback for frog task toggle
            do {
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.prepare() // Prepare for optimal performance
                impactFeedback.impactOccurred()
                print("✅ [ToggleFrogTaskIntent] Haptic feedback triggered successfully")
            } catch {
                print("⚠️ [ToggleFrogTaskIntent] Haptic feedback failed: \(error)")
            }
            
            // Use optimized widget update pattern
            await performOptimizedWidgetUpdate()
            
            return .result()
        } catch {
            print("Failed to toggle frog task: \(error)")
            throw NSError(domain: "WidgetError", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to process widget data: \(error.localizedDescription)"])
        }
    }
}

// Data models are defined in SharedDataManager.swift to avoid duplicates
