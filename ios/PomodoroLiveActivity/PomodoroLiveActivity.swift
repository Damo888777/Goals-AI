//
//  PomodoroLiveActivity.swift
//  Pomodoro Timer Live Activity
//

import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes
struct PomodoroActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        let timeRemaining: Int // seconds
        let totalDuration: Int // seconds  
        let sessionType: String // "work", "shortBreak", "longBreak"
        let isRunning: Bool
        let completedPomodoros: Int
        let taskTitle: String
    }
    
    let startTime: Date
}

// MARK: - Pomodoro Live Activity Widget
struct PomodoroLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PomodoroActivityAttributes.self) { context in
            // Lock screen and notification center view
            VStack(spacing: 8) {
                HStack {
                    Text(context.state.sessionType == "work" ? "🍅 Focus Time" : "☕ Break Time")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Color("textPrimary"))
                    
                    Spacer()
                    
                    Text(formatTime(context.state.timeRemaining))
                        .font(.system(size: 20, weight: .bold, design: .monospaced))
                        .foregroundColor(Color("accent"))
                }
                
                ProgressView(value: Double(context.state.totalDuration - context.state.timeRemaining), 
                           total: Double(context.state.totalDuration))
                    .progressViewStyle(LinearProgressViewStyle(tint: Color("accent")))
                
                HStack {
                    Text(context.state.taskTitle)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color("textPrimary"))
                        .lineLimit(1)
                    
                    Spacer()
                    
                    Text("🍅 \(context.state.completedPomodoros)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Color("textPrimary"))
                }
            }
            .padding(16)
            .background(Color("background"))
            .activityBackgroundTint(Color("background"))
            .activitySystemActionForegroundColor(Color("textPrimary"))
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.sessionType == "work" ? "Focus" : "Break")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Color("textPrimary"))
                        
                        Text("🍅 \(context.state.completedPomodoros)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color("accent"))
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formatTime(context.state.timeRemaining))
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(Color("accent"))
                        
                        Text(context.state.isRunning ? "Running" : "Paused")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Color("textPrimary"))
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 4) {
                        ProgressView(value: Double(context.state.totalDuration - context.state.timeRemaining), 
                                   total: Double(context.state.totalDuration))
                            .progressViewStyle(LinearProgressViewStyle(tint: Color("accent")))
                        
                        Text(context.state.taskTitle)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color("textPrimary"))
                            .lineLimit(1)
                    }
                }
            } compactLeading: {
                Text("🍅")
                    .font(.system(size: 16))
            } compactTrailing: {
                Text(formatTime(context.state.timeRemaining))
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(Color("accent"))
            } minimal: {
                Text("🍅")
                    .font(.system(size: 16))
            }
            .keylineTint(Color("accent"))
        }
    }
    
    private func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", mins, secs)
    }
}

// MARK: - Preview
#if DEBUG
#Preview("Notification", as: .content, using: PomodoroActivityAttributes(
    startTime: Date()
)) {
    PomodoroLiveActivity()
} contentStates: {
    PomodoroActivityAttributes.ContentState(
        timeRemaining: 1205,
        totalDuration: 1500,
        sessionType: "work",
        isRunning: true,
        completedPomodoros: 3,
        taskTitle: "Complete project presentation"
    )
}
#endif
