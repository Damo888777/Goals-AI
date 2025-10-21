//
//  LiveActivityModule.swift
//  Native module for React Native Live Activities integration
//

import Foundation
import ActivityKit
import React

// MARK: - Activity Attributes (matching PomodoroLiveActivity.swift)
struct PomodoroActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        let timeRemaining: Int
        let totalDuration: Int
        let sessionType: String
        let isRunning: Bool
        let completedPomodoros: Int
        let taskTitle: String
    }
    
    let startTime: Date
}

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
    
    private var currentActivity: Activity<PomodoroActivityAttributes>?
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func areActivitiesEnabled(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.2, *) {
            let isEnabled = ActivityAuthorizationInfo().areActivitiesEnabled
            resolve(isEnabled)
        } else {
            resolve(false)
        }
    }
    
    @objc
    func startPomodoroActivity(_ stateDict: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard #available(iOS 16.2, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 16.2 or later", nil)
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
            taskTitle: taskTitle
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
        
        guard #available(iOS 16.2, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 16.2 or later", nil)
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
        
        guard #available(iOS 16.2, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 16.2 or later", nil)
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

// MARK: - React Native Module Export
@objc(LiveActivityModuleBridge)
class LiveActivityModuleBridge: RCTBridgeModule {
    
    static func moduleName() -> String! {
        return "LiveActivityModule"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func areActivitiesEnabled(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let module = LiveActivityModule()
        module.areActivitiesEnabled(resolve, rejecter: reject)
    }
    
    @objc
    func startPomodoroActivity(_ stateDict: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let module = LiveActivityModule()
        module.startPomodoroActivity(stateDict, resolver: resolve, rejecter: reject)
    }
    
    @objc
    func updatePomodoroActivity(_ activityId: String, stateDict: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let module = LiveActivityModule()
        module.updatePomodoroActivity(activityId, stateDict: stateDict, resolver: resolve, rejecter: reject)
    }
    
    @objc
    func endPomodoroActivity(_ activityId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let module = LiveActivityModule()
        module.endPomodoroActivity(activityId, resolver: resolve, rejecter: reject)
    }
}
