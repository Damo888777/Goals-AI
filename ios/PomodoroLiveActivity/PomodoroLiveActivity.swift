import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes (shared from PomodoroActivityAttributes.swift)
// Note: PomodoroActivityAttributes is defined in PomodoroActivityAttributes.swift and shared between targets

// MARK: - Live Activity Widget
struct PomodoroLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PomodoroActivityAttributes.self) { context in
            // Lock screen/banner UI - matches pomodoro.tsx styling
            PomodoroLockScreenView(context: context)
                .activityBackgroundTint(Color(red: 0.96, green: 0.92, blue: 0.88)) // #f5ebe0
                .activitySystemActionForegroundColor(Color(red: 0.21, green: 0.29, blue: 0.35)) // #364958
            
        } dynamicIsland: { context in
            
            DynamicIsland {
                // Expanded UI - timer and task name only
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 8) {
                        // Timer display with real-time countdown using Date
                        if context.state.isRunning {
                            Text(calculateTargetDate(context), style: .timer)
                                .font(.custom("Helvetica", size: 32))
                                .fontWeight(.bold)
                                .foregroundColor(context.state.sessionType == "work" ? 
                                    Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51 for work
                                    Color(red: 0.21, green: 0.29, blue: 0.35)) // #364958 for break
                                .multilineTextAlignment(.center)
                        } else {
                            Text(formatTime(context.state.timeRemaining))
                                .font(.custom("Helvetica", size: 32))
                                .fontWeight(.bold)
                                .foregroundColor(context.state.sessionType == "work" ? 
                                    Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51 for work
                                    Color(red: 0.21, green: 0.29, blue: 0.35)) // #364958 for break
                        }
                        
                        // Task name
                        Text(context.state.taskTitle)
                            .font(.caption)
                            .lineLimit(1)
                            .foregroundColor(.secondary)
                    }
                }
                
            } compactLeading: {
                // Compact leading - session type emoji
                Text(context.state.sessionType == "work" ? "🍅" : "☕")
                    .font(.system(size: 16))
            } compactTrailing: {
                // Compact trailing - timer with fixed layout
                if context.state.isRunning {
                    Text(calculateTargetDate(context), style: .timer)
                        .font(.custom("Helvetica", size: 14))
                        .fontWeight(.medium)
                        .foregroundColor(context.state.sessionType == "work" ? 
                            Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51
                            Color(red: 0.27, green: 0.47, blue: 0.62)) // #457b9d
                        .multilineTextAlignment(.center)
                        .frame(width: 30, alignment: .center)
                        .fixedSize()
                } else {
                    Text(formatTimeCompact(context.state.timeRemaining))
                        .font(.custom("Helvetica", size: 14))
                        .fontWeight(.medium)
                        .foregroundColor(context.state.sessionType == "work" ? 
                            Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51
                            Color(red: 0.27, green: 0.47, blue: 0.62)) // #457b9d
                        .frame(width: 30, alignment: .center)
                        .fixedSize()
                }
            } minimal: {
                // Minimal - just the emoji
                Text(context.state.sessionType == "work" ? "🍅" : "☕")
                    .font(.system(size: 12))
            }
            .widgetURL(URL(string: "goals-ai://pomodoro"))
            .keylineTint(context.state.sessionType == "work" ? 
                Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51
                Color(red: 0.27, green: 0.47, blue: 0.62)) // #457b9d
        }
    }
}

// MARK: - Lock Screen View
struct PomodoroLockScreenView: View {
    let context: ActivityViewContext<PomodoroActivityAttributes>
    
    var body: some View {
        VStack(spacing: 16) {
            
            // Timer display with gradient background matching pomodoro.tsx
            ZStack {
                // Background gradient matching pomodoro.tsx timerGradient
                LinearGradient(
                    colors: context.state.sessionType == "work" ? [
                        Color(red: 0.996, green: 0.816, blue: 0.733), // #fed0bb
                        Color(red: 0.957, green: 0.651, blue: 0.651), // #f4a6a6
                        Color(red: 0.910, green: 0.600, blue: 0.600)  // #e89999
                    ] : [
                        Color(red: 0.21, green: 0.29, blue: 0.35), // #364958
                        Color(red: 0.29, green: 0.34, blue: 0.41), // #4a5568
                        Color(red: 0.18, green: 0.22, blue: 0.28)  // #2d3748
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .overlay(
                    // Glass highlight effect matching pomodoro.tsx
                    VStack {
                        Rectangle()
                            .fill(Color.white.opacity(0.3))
                            .frame(height: 20)
                            .cornerRadius(15)
                            .padding(.horizontal, 8)
                            .padding(.top, 8)
                        Spacer()
                        Rectangle()
                            .fill(Color.white.opacity(0.15))
                            .frame(height: 10)
                            .cornerRadius(10)
                            .padding(.horizontal, 8)
                            .padding(.bottom, 8)
                    }
                )
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color(red: 0.74, green: 0.29, blue: 0.32).opacity(0.2), lineWidth: 1)
                )
                
                // Timer text with real-time countdown
                if context.state.isRunning {
                    Text(calculateTargetDate(context), style: .timer)
                        .font(.custom("Helvetica", size: 48))
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .shadow(color: Color(red: 0.74, green: 0.29, blue: 0.32).opacity(0.8), radius: 4, x: 0, y: 2)
                        .multilineTextAlignment(.center)
                } else {
                    Text(formatTime(context.state.timeRemaining))
                        .font(.custom("Helvetica", size: 48))
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .shadow(color: Color(red: 0.74, green: 0.29, blue: 0.32).opacity(0.8), radius: 4, x: 0, y: 2)
                }
            }
            .frame(height: 100)
            
            // Task name centered
            Text(context.state.taskTitle)
                .font(.headline)
                .fontWeight(.medium)
                .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35)) // #364958
                .lineLimit(2)
                .multilineTextAlignment(.center)
        }
        .padding(20)
    }
}

// MARK: - Helper Functions
private func formatTime(_ seconds: Int) -> String {
    let minutes = seconds / 60
    let remainingSeconds = seconds % 60
    return String(format: "%02d:%02d", minutes, remainingSeconds)
}

private func formatTimeCompact(_ seconds: Int) -> String {
    let minutes = seconds / 60
    return "\(minutes)m"
}

private func sessionTypeLabel(_ sessionType: String) -> String {
    switch sessionType {
    case "work":
        return "Focus Time"
    case "shortBreak":
        return "Short Break"
    case "longBreak":
        return "Long Break"
    default:
        return "Pomodoro"
    }
}

// MARK: - Time Calculation for Live Activities
private func calculateTargetDate(_ context: ActivityViewContext<PomodoroActivityAttributes>) -> Date {
    let currentTime = Date()
    let sessionStartTime = context.state.sessionStartTime
    let totalElapsedSeconds = currentTime.timeIntervalSince(sessionStartTime)
    let remainingSeconds = max(0, Double(context.state.totalDuration) - totalElapsedSeconds)
    let targetDate = currentTime.addingTimeInterval(remainingSeconds)
    
    // Comprehensive logging for debugging timer calculations
    print("🕐 [Live Activity] Timer calculation - Session: \(context.state.sessionType), Remaining: \(String(format: "%.1f", remainingSeconds))s")
    
    return targetDate
}

private func calculateCurrentTime(_ context: ActivityViewContext<PomodoroActivityAttributes>) -> Int {
    // If timer is not running, return the stored time
    guard context.state.isRunning else {
        return context.state.timeRemaining
    }
    
    // Calculate elapsed time since the session started
    let currentTime = Date()
    let sessionStartTime = context.state.sessionStartTime
    let totalElapsedSeconds = Int(currentTime.timeIntervalSince(sessionStartTime))
    
    // Calculate remaining time: start with total duration, subtract elapsed time
    // This gives us the actual countdown from when the timer started
    let calculatedTime = max(0, context.state.totalDuration - totalElapsedSeconds)
    
    // Auto-dismiss Live Activity when timer reaches zero
    if calculatedTime <= 0 && context.state.timeRemaining > 0 {
        // Note: Auto-dismiss removed to avoid async/await in widget context
        // Live Activities will auto-dismiss based on system policies
        print("🏁 [Live Activity] Timer complete - relying on system auto-dismiss")
    }
    
    return calculatedTime
}

// MARK: - Widget Bundle Entry Point
@main
struct PomodoroLiveActivityBundle: WidgetBundle {
    init() {
        print("🎨🎨🎨 [WIDGET BUNDLE INIT] PomodoroLiveActivityBundle initialized - Widget extension starting!")
    }
    
    var body: some Widget {
        let _ = print("🎨🎨🎨 [WIDGET BUNDLE BODY] Creating widget bundle body")
        return PomodoroLiveActivity()
    }
}

// Preview code removed to avoid compatibility issues with PreviewActivityBuilder
