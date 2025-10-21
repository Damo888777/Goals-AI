//
//  TaskIntents.swift
//  widget
//

import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct CompleteTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Complete Task"
    static var description = IntentDescription("Mark a task as completed")
    
    @Parameter(title: "Task ID")
    var taskId: String
    
    init() {}
    
    init(taskId: String) {
        self.taskId = taskId
    }
    
    func perform() async throws -> some IntentResult {
        // Mark task as completed in shared data
        SharedDataManager.shared.markTaskCompleted(taskId: taskId)
        
        // Reload all widgets to reflect the change
        WidgetCenter.shared.reloadAllTimelines()
        
        return .result()
    }
}

@available(iOS 17.0, *)
struct TaskAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CompleteTaskIntent(),
            phrases: ["Complete task in Goals AI"]
        )
    }
}