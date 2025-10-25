//
//  LiveActivityModule.swift
//  Native module for React Native Live Activities integration
//

import Foundation
import ActivityKit

// Conditional import for React - only available in main app target
#if canImport(React)
import React
#endif

// MARK: - Shared Activity Attributes (MUST match PomodoroLiveActivity.swift exactly)
struct PomodoroActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timeRemaining: Int // seconds
        var totalDuration: Int // seconds
        var sessionType: String // "work", "shortBreak", "longBreak"
        var isRunning: Bool
        var completedPomodoros: Int
        var taskTitle: String
    }
    
    var activityName: String // ✅ Matches PomodoroLiveActivity.swift
}

// MARK: - React Native Module (only compiled for main app target)
#if canImport(React)

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
              let activityName = stateDict["activityName"] as? String else {
            print("❌ [LiveActivityModule] Invalid parameters provided: \(stateDict)")
            reject("INVALID_PARAMS", "Invalid parameters provided", nil)
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
            taskTitle: taskTitle
        )
        
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
        
        let contentState = PomodoroActivityAttributes.ContentState(
            timeRemaining: timeRemaining,
            totalDuration: totalDuration,
            sessionType: sessionType,
            isRunning: isRunning,
            completedPomodoros: completedPomodoros,
            taskTitle: taskTitle
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
