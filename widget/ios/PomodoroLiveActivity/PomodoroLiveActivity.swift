//
//  PomodoroLiveActivity.swift
//  PomodoroLiveActivity
//
//  Live Activity for Pomodoro Timer in Dynamic Island and Lock Screen
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

// MARK: - Colors Extension
extension Color {
    static let pomodoroBackground = Color(red: 0.96, green: 0.92, blue: 0.88) // #f5ebe0
    static let pomodoroText = Color(red: 0.21, green: 0.29, blue: 0.35) // #364958
    static let pomodoroTimer = Color(red: 0.99, green: 0.82, blue: 0.73) // #fed0bb
    static let pomodoroAccent = Color(red: 0.74, green: 0.29, blue: 0.32) // #bc4b51
    static let pomodoroGreen = Color(red: 0.91, green: 0.93, blue: 0.79) // #e9edc9
    static let pomodoroShadow = Color(red: 0.49, green: 0.49, blue: 0.49) // #7c7c7c
}

// MARK: - Live Activity Widget
struct PomodoroLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PomodoroActivityAttributes.self) { context in
            // Lock screen and notification center view
            LockScreenActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.sessionType == "work" ? "Focus Time" : "Break Time")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.pomodoroText)
                        
                        Text(context.state.taskTitle)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.pomodoroText.opacity(0.8))
                            .lineLimit(2)
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(formatTime(context.state.timeRemaining))
                            .font(.system(size: 20, weight: .bold, design: .monospaced))
                            .foregroundColor(.pomodoroAccent)
                        
                        Text("\(context.state.completedPomodoros)/4")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.pomodoroText.opacity(0.7))
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        // Progress bar
                        ProgressView(value: progress(from: context.state))
                            .tint(context.state.sessionType == "work" ? .pomodoroAccent : .pomodoroGreen)
                            .scaleEffect(x: 1, y: 0.8)
                        
                        // Session indicators
                        HStack(spacing: 6) {
                            ForEach(0..<4, id: \.self) { index in
                                Circle()
                                    .fill(index < (context.state.completedPomodoros % 4) ? Color.pomodoroAccent : Color.gray.opacity(0.3))
                                    .frame(width: 6, height: 6)
                            }
                        }
                    }
                }
                
            } compactLeading: {
                // Compact leading view - timer icon
                Image(systemName: context.state.isRunning ? "timer" : "pause.circle")
                    .foregroundColor(context.state.sessionType == "work" ? .pomodoroAccent : .pomodoroGreen)
                    .font(.system(size: 16, weight: .medium))
                
            } compactTrailing: {
                // Compact trailing view - time remaining
                Text(formatTimeCompact(context.state.timeRemaining))
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundColor(.pomodoroText)
                    .minimumScaleFactor(0.8)
                
            } minimal: {
                // Minimal view - just the timer icon with progress
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.3), lineWidth: 2)
                        .frame(width: 16, height: 16)
                    
                    Circle()
                        .trim(from: 0, to: progress(from: context.state))
                        .stroke(
                            context.state.sessionType == "work" ? Color.pomodoroAccent : Color.pomodoroGreen,
                            style: StrokeStyle(lineWidth: 2, lineCap: .round)
                        )
                        .frame(width: 16, height: 16)
                        .rotationEffect(.degrees(-90))
                    
                    Image(systemName: "timer")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(.pomodoroText)
                }
            }
        }
    }
    
    // Helper functions
    private func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%02d:%02d", minutes, remainingSeconds)
    }
    
    private func formatTimeCompact(_ seconds: Int) -> String {
        let minutes = seconds / 60
        return minutes > 0 ? "\(minutes)m" : "\(seconds)s"
    }
    
    private func progress(from state: PomodoroActivityAttributes.ContentState) -> Double {
        let elapsed = Double(state.totalDuration - state.timeRemaining)
        return elapsed / Double(state.totalDuration)
    }
}

// MARK: - Lock Screen View
struct LockScreenActivityView: View {
    let context: ActivityViewContext<PomodoroActivityAttributes>
    
    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: context.state.sessionType == "work" ? "timer" : "cup.and.saucer")
                    .foregroundColor(context.state.sessionType == "work" ? .pomodoroAccent : .pomodoroGreen)
                    .font(.system(size: 16, weight: .medium))
                
                Text(context.state.sessionType == "work" ? "Focus Time" : "Break Time")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.pomodoroText)
                
                Spacer()
                
                Text("\(context.state.completedPomodoros)/4")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.pomodoroText.opacity(0.7))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.pomodoroGreen.opacity(0.3))
                    .cornerRadius(8)
            }
            
            // Timer Display (matching pomodoro screen style)
            ZStack {
                // Background gradient (similar to pomodoro screen)
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        LinearGradient(
                            colors: context.state.sessionType == "work" 
                                ? [Color.pomodoroTimer, Color.pomodoroTimer.opacity(0.8)] 
                                : [Color.pomodoroText, Color.pomodoroText.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .shadow(
                        color: Color.pomodoroShadow.opacity(0.75),
                        radius: 0,
                        x: 0,
                        y: 4
                    )
                
                // Glass highlight (matching pomodoro screen)
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.3), Color.clear],
                            startPoint: .top,
                            endPoint: .center
                        )
                    )
                
                VStack(spacing: 8) {
                    // Timer text (matching pomodoro screen font and size)
                    Text(formatTime(context.state.timeRemaining))
                        .font(.custom("Digital-7", size: 32))
                        .foregroundColor(.white)
                        .shadow(
                            color: Color.pomodoroAccent.opacity(0.8),
                            radius: 2,
                            x: 0,
                            y: 1
                        )
                    
                    // Task title
                    Text(context.state.taskTitle)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 20)
            }
            
            // Progress bar
            VStack(spacing: 6) {
                ProgressView(value: progress(from: context.state))
                    .tint(context.state.sessionType == "work" ? .pomodoroAccent : .pomodoroGreen)
                    .scaleEffect(x: 1, y: 1.5)
                
                // Session indicators
                HStack(spacing: 8) {
                    ForEach(0..<4, id: \.self) { index in
                        Circle()
                            .fill(index < (context.state.completedPomodoros % 4) ? Color.pomodoroAccent : Color.gray.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.pomodoroBackground)
    }
    
    private func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%02d:%02d", minutes, remainingSeconds)
    }
    
    private func progress(from state: PomodoroActivityAttributes.ContentState) -> Double {
        let elapsed = Double(state.totalDuration - state.timeRemaining)
        return elapsed / Double(state.totalDuration)
    }
}

// MARK: - Main Entry Point  
@main
struct PomodoroLiveActivity: Widget {
    var body: some WidgetConfiguration {
        PomodoroLiveActivityWidget()
    }
}
