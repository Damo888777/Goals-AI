//
//  LiveActivityModule.swift
//  Native module for React Native Live Activities integration
//

import Foundation
import ActivityKit
import React
import OneSignalLiveActivities

// MARK: - Activity Attributes (shared with Live Activity target)

// MARK: - Shared Activity Attributes
struct PomodoroActivityAttributes: OneSignalLiveActivityAttributes {
    public struct ContentState: OneSignalLiveActivityContentState {
        var timeRemaining: Int // seconds
        var totalDuration: Int // seconds
        var sessionType: String // "work", "shortBreak", "longBreak"
        var isRunning: Bool
        var completedPomodoros: Int
        var taskTitle: String
        
        // Required OneSignal reference
        var onesignal: OneSignalLiveActivityContentStateData
    }
    
    var startTime: Date
}

// MARK: - React Native Module (Bridge + Implementation Combined)
@objc(LiveActivityModule)
class LiveActivityModule: NSObject, RCTBridgeModule {
    
    private var currentActivity: Activity<PomodoroActivityAttributes>?
    
    static func moduleName() -> String! {
        return "LiveActivityModule"
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func areActivitiesEnabled(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 17.0, *) {
            let isEnabled = ActivityAuthorizationInfo().areActivitiesEnabled
            resolve(isEnabled)
        } else {
            resolve(false)
        }
    }
    
    @objc
    func startPomodoroActivity(_ stateDict: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard #available(iOS 17.0, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 17.0 or later", nil)
            return
        }
        
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            reject("DISABLED", "Live Activities are disabled", nil)
            return
        }
        
        // Parse state from React Native
        guard let timeRemaining = stateDict["timeRemaining"] as? Int,
              let totalDuration = stateDict["totalDuration"] as? Int,
              let sessionType = stateDict["sessionType"] as? String,
              let isRunning = stateDict["isRunning"] as? Bool,
              let completedPomodoros = stateDict["completedPomodoros"] as? Int,
              let taskTitle = stateDict["taskTitle"] as? String else {
            reject("INVALID_PARAMS", "Invalid parameters provided", nil)
            return
        }
        
        let attributes = PomodoroActivityAttributes(startTime: Date())
        let contentState = PomodoroActivityAttributes.ContentState(
            timeRemaining: timeRemaining,
            totalDuration: totalDuration,
            sessionType: sessionType,
            isRunning: isRunning,
            completedPomodoros: completedPomodoros,
            taskTitle: taskTitle,
            onesignal: OneSignalLiveActivityContentStateData()
        )
        
        do {
            let activity = try Activity<PomodoroActivityAttributes>.request(
                attributes: attributes,
                contentState: contentState,
                pushType: nil
            )
            
            self.currentActivity = activity
            resolve(activity.id)
            
        } catch {
            reject("ACTIVITY_ERROR", "Failed to start Live Activity: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func updatePomodoroActivity(_ activityId: String, stateDict: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard #available(iOS 17.0, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 17.0 or later", nil)
            return
        }
        
        guard let activity = currentActivity else {
            reject("NO_ACTIVITY", "No active Live Activity found", nil)
            return
        }
        
        // Parse state from React Native
        guard let timeRemaining = stateDict["timeRemaining"] as? Int,
              let totalDuration = stateDict["totalDuration"] as? Int,
              let sessionType = stateDict["sessionType"] as? String,
              let isRunning = stateDict["isRunning"] as? Bool,
              let completedPomodoros = stateDict["completedPomodoros"] as? Int,
              let taskTitle = stateDict["taskTitle"] as? String else {
            reject("INVALID_PARAMS", "Invalid parameters provided", nil)
            return
        }
        
        let contentState = PomodoroActivityAttributes.ContentState(
            timeRemaining: timeRemaining,
            totalDuration: totalDuration,
            sessionType: sessionType,
            isRunning: isRunning,
            completedPomodoros: completedPomodoros,
            taskTitle: taskTitle,
            onesignal: OneSignalLiveActivityContentStateData()
        )
        
        Task {
            await activity.update(using: contentState)
            resolve(nil)
        }
    }
    
    @objc
    func endPomodoroActivity(_ activityId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard #available(iOS 17.0, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 17.0 or later", nil)
            return
        }
        
        guard let activity = currentActivity else {
            reject("NO_ACTIVITY", "No active Live Activity found", nil)
            return
        }
        
        Task {
            await activity.end(dismissalPolicy: .immediate)
            self.currentActivity = nil
            resolve(nil)
        }
    }
}
