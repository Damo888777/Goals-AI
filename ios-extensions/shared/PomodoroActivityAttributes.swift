//
//  PomodoroActivityAttributes.swift
//  Shared Activity Attributes for Live Activities
//

import Foundation
import ActivityKit

// MARK: - Shared Activity Attributes
struct PomodoroActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timeRemaining: Int // seconds
        var totalDuration: Int // seconds
        var sessionType: String // "work", "shortBreak", "longBreak"
        var isRunning: Bool
        var completedPomodoros: Int
        var taskTitle: String
    }
    
    var activityName: String
}