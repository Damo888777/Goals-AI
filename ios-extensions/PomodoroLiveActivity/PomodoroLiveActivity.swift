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
                // Expanded UI - detailed timer view
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.state.sessionType == "work" ? "🍅" : "☕")
                            .font(.title2)
                        Text(sessionTypeLabel(context.state.sessionType))
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("\(context.state.completedPomodoros)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 0.74, green: 0.29, blue: 0.32)) // #bc4b51
                        Text("completed")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 8) {
                        // Timer display matching pomodoro.tsx digital font style
                        Text(formatTime(context.state.timeRemaining))
                            .font(.custom("Helvetica", size: 32))
                            .fontWeight(.bold)
                            .foregroundColor(context.state.sessionType == "work" ? 
                                Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51 for work
                                Color(red: 0.21, green: 0.29, blue: 0.35)) // #364958 for break
                        
                        // Progress bar
                        ProgressView(value: Double(context.state.totalDuration - context.state.timeRemaining), 
                                   total: Double(context.state.totalDuration))
                            .progressViewStyle(LinearProgressViewStyle(tint: context.state.sessionType == "work" ? 
                                Color(red: 0.64, green: 0.69, blue: 0.54) : // #a3b18a for work
                                Color(red: 0.27, green: 0.47, blue: 0.62))) // #457b9d for break
                            .scaleEffect(x: 1, y: 2, anchor: .center)
                        
                        // Task title (truncated)
                        Text(context.state.taskTitle)
                            .font(.caption)
                            .lineLimit(1)
                            .foregroundColor(.secondary)
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        // Session indicators matching pomodoro.tsx
                        HStack(spacing: 4) {
                            ForEach(0..<4, id: \.self) { index in
                                Circle()
                                    .fill(index < (context.state.completedPomodoros % 4) ? 
                                          Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51
                                          Color(red: 0.88, green: 0.88, blue: 0.88)) // #e0e0e0
                                    .frame(width: 8, height: 8)
                            }
                        }
                        
                        Spacer()
                        
                        // Running status
                        HStack(spacing: 4) {
                            Circle()
                                .fill(context.state.isRunning ? Color.green : Color.orange)
                                .frame(width: 6, height: 6)
                            Text(context.state.isRunning ? "Running" : "Paused")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 8)
                }
                
            } compactLeading: {
                // Compact leading - session type emoji
                Text(context.state.sessionType == "work" ? "🍅" : "☕")
                    .font(.system(size: 16))
            } compactTrailing: {
                // Compact trailing - timer
                Text(formatTimeCompact(context.state.timeRemaining))
                    .font(.custom("Helvetica", size: 14))
                    .fontWeight(.medium)
                    .foregroundColor(context.state.sessionType == "work" ? 
                        Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51
                        Color(red: 0.27, green: 0.47, blue: 0.62)) // #457b9d
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
            // Header with session type and task
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(context.state.sessionType == "work" ? "🍅" : "☕")
                            .font(.title2)
                        Text(sessionTypeLabel(context.state.sessionType))
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35)) // #364958
                    }
                    
                    Text(context.state.taskTitle)
                        .font(.subheadline)
                        .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35).opacity(0.8))
                        .lineLimit(2)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(context.state.completedPomodoros)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 0.74, green: 0.29, blue: 0.32)) // #bc4b51
                    Text("completed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
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
                
                // Timer text matching pomodoro.tsx digital font
                Text(formatTime(context.state.timeRemaining))
                    .font(.custom("Helvetica", size: 48))
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .shadow(color: Color(red: 0.74, green: 0.29, blue: 0.32).opacity(0.8), radius: 4, x: 0, y: 2)
            }
            .frame(height: 100)
            
            // Progress and status
            VStack(spacing: 12) {
                // Progress bar
                ProgressView(value: Double(context.state.totalDuration - context.state.timeRemaining), 
                           total: Double(context.state.totalDuration))
                    .progressViewStyle(LinearProgressViewStyle(tint: context.state.sessionType == "work" ? 
                        Color(red: 0.64, green: 0.69, blue: 0.54) : // #a3b18a
                        Color(red: 0.27, green: 0.47, blue: 0.62))) // #457b9d
                    .scaleEffect(x: 1, y: 3, anchor: .center)
                
                // Session indicators and status
                HStack {
                    // Session indicators matching pomodoro.tsx
                    HStack(spacing: 6) {
                        ForEach(0..<4, id: \.self) { index in
                            Circle()
                                .fill(index < (context.state.completedPomodoros % 4) ? 
                                      Color(red: 0.74, green: 0.29, blue: 0.32) : // #bc4b51
                                      Color(red: 0.88, green: 0.88, blue: 0.88)) // #e0e0e0
                                .frame(width: 12, height: 12)
                        }
                    }
                    
                    Spacer()
                    
                    // Running status
                    HStack(spacing: 6) {
                        Circle()
                            .fill(context.state.isRunning ? Color.green : Color.orange)
                            .frame(width: 8, height: 8)
                        Text(context.state.isRunning ? "Running" : "Paused")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                    }
                }
            }
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

// Preview code removed to avoid compatibility issues with PreviewActivityBuilder
