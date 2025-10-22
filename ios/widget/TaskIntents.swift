//
//  TaskIntents.swift
//  widget
//
// App shortcuts provider - CompleteTaskIntent is defined in TaskCompletionIntent.swift

import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct TaskAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CompleteTaskIntent(),
            phrases: ["Complete task in Goals AI"]
        )
    }
}