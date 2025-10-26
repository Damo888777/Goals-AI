//
//  LiveActivityModule.swift
//  Shared utilities for Live Activities (NO REACT NATIVE CODE)
//

import Foundation
import ActivityKit

// MARK: - Shared Helper Functions
class LiveActivityHelper {
    
    static func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%02d:%02d", minutes, remainingSeconds)
    }
    
    static func formatTimeCompact(_ seconds: Int) -> String {
        let minutes = seconds / 60
        return "\(minutes)m"
    }
    
    static func sessionTypeLabel(_ sessionType: String) -> String {
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
}