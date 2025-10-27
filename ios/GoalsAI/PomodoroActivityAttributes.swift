//
//  PomodoroActivityAttributes.swift
//  Shared Activity Attributes for Live Activities
//

import ActivityKit
import Foundation

// MARK: - Shared Activity Attributes
struct PomodoroActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var timeRemaining: Int
        var totalDuration: Int
        var sessionType: String
        var isRunning: Bool
        var completedPomodoros: Int
        var taskTitle: String
        var lastUpdateTime: Date
        var sessionStartTime: Date
        
        // Helper computed property to check if timer is complete
        var isComplete: Bool {
            return timeRemaining <= 0
        }
    }

    // Fixed non-changing properties about your activity go here!
    var activityName: String
}