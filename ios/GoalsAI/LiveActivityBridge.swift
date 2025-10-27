//
//  LiveActivityBridge.swift
//  React Native bridge for Live Activities (MAIN APP ONLY)
//

import Foundation
import ActivityKit

// Conditional import for React - only available in main app target
#if canImport(React)
import React

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
        print("🔍 [LiveActivityModule] areActivitiesEnabled called")
        
        if #available(iOS 17.0, *) {
            let isEnabled = ActivityAuthorizationInfo().areActivitiesEnabled
            print("🔍 [LiveActivityModule] iOS 17.0+ detected, Live Activities enabled: \(isEnabled)")
            resolve(isEnabled)
        } else {
            print("🔍 [LiveActivityModule] iOS version < 17.0, Live Activities not supported")
            resolve(false)
        }
    }
    
    @objc
    func startPomodoroActivity(_ stateDict: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        print("🔍 [LiveActivityModule] startPomodoroActivity called with data: \(stateDict)")
        
        guard #available(iOS 17.0, *) else {
            print("❌ [LiveActivityModule] iOS version < 17.0, rejecting")
            reject("UNSUPPORTED", "Live Activities require iOS 17.0 or later", nil)
            return
        }
        
        let authInfo = ActivityAuthorizationInfo()
        let isEnabled = authInfo.areActivitiesEnabled
        print("🔍 [LiveActivityModule] ActivityAuthorizationInfo: enabled=\(isEnabled)")
        
        guard isEnabled else {
            print("❌ [LiveActivityModule] Live Activities are disabled, rejecting")
            reject("DISABLED", "Live Activities are disabled", nil)
            return
        }
        
        // Parse state from React Native
        print("🔍 [LiveActivityModule] Parsing state parameters...")
        guard let timeRemaining = stateDict["timeRemaining"] as? Int,
              let totalDuration = stateDict["totalDuration"] as? Int,
              let sessionType = stateDict["sessionType"] as? String,
              let isRunning = stateDict["isRunning"] as? Bool,
              let completedPomodoros = stateDict["completedPomodoros"] as? Int,
              let taskTitle = stateDict["taskTitle"] as? String,
              let activityName = stateDict["activityName"] as? String,
              let sessionStartTimeString = stateDict["sessionStartTime"] as? String else {
            print("❌ [LiveActivityModule] Invalid parameters provided: \(stateDict)")
            reject("INVALID_PARAMS", "Invalid parameters provided", nil)
            return
        }
        
        // Parse sessionStartTime
        let dateFormatter = ISO8601DateFormatter()
        guard let sessionStartTime = dateFormatter.date(from: sessionStartTimeString) else {
            print("❌ [LiveActivityModule] Invalid sessionStartTime format: \(sessionStartTimeString)")
            reject("INVALID_PARAMS", "Invalid sessionStartTime format", nil)
            return
        }
        
        print("🔍 [LiveActivityModule] Parameters parsed successfully:")
        print("  - activityName: \(activityName)")
        print("  - timeRemaining: \(timeRemaining)")
        print("  - sessionType: \(sessionType)")
        print("  - taskTitle: \(taskTitle)")
        
        print("🔍 [LiveActivityModule] Creating ActivityAttributes and ContentState...")
        let attributes = PomodoroActivityAttributes(activityName: activityName)
        let contentState = PomodoroActivityAttributes.ContentState(
            timeRemaining: timeRemaining,
            totalDuration: totalDuration,
            sessionType: sessionType,
            isRunning: isRunning,
            completedPomodoros: completedPomodoros,
            taskTitle: taskTitle,
            lastUpdateTime: Date(),
            sessionStartTime: sessionStartTime
        )
        
        print("🔍 [LiveActivityModule] Ending any existing activities first...")
        // End all existing activities to prevent "maximum number" error
        for activity in Activity<PomodoroActivityAttributes>.activities {
            Task {
                await activity.end(nil, dismissalPolicy: .immediate)
                print("🧹 [LiveActivityModule] Ended existing activity: \(activity.id)")
            }
        }
        
        print("🔍 [LiveActivityModule] Attempting to start Live Activity...")
        do {
            let activity = try Activity<PomodoroActivityAttributes>.request(
                attributes: attributes,
                contentState: contentState,
                pushType: nil
            )
            
            print("✅ [LiveActivityModule] Live Activity started successfully! ID: \(activity.id)")
            print("🔍 [LiveActivityModule] Activity state: \(activity.activityState)")
            
            self.currentActivity = activity
            resolve(activity.id)
            
        } catch {
            print("❌ [LiveActivityModule] Failed to start Live Activity: \(error)")
            print("❌ [LiveActivityModule] Error details: \(error.localizedDescription)")
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
        
        // For pause/resume: adjust sessionStartTime to maintain correct elapsed time
        let currentTime = Date()
        let existingSessionStartTime = currentActivity?.contentState.sessionStartTime ?? currentTime
        let existingTimeRemaining = currentActivity?.contentState.timeRemaining ?? timeRemaining
        
        // Calculate how much time has elapsed since last update
        let elapsedSinceLastUpdate = existingTimeRemaining - timeRemaining
        
        // Adjust sessionStartTime to account for the elapsed time
        let sessionStartTime: Date
        if isRunning {
            // Resuming: calculate new start time to maintain correct countdown
            sessionStartTime = Date(timeInterval: -Double(totalDuration - timeRemaining), since: currentTime)
        } else {
            // Pausing: keep existing sessionStartTime
            sessionStartTime = existingSessionStartTime
        }
        
        let contentState = PomodoroActivityAttributes.ContentState(
            timeRemaining: timeRemaining,
            totalDuration: totalDuration,
            sessionType: sessionType,
            isRunning: isRunning,
            completedPomodoros: completedPomodoros,
            taskTitle: taskTitle,
            lastUpdateTime: Date(),
            sessionStartTime: sessionStartTime
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

#endif // canImport(React)