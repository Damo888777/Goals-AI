//
//  UserDefaultsManager.swift
//  GoalsAI
//

import Foundation
import React

@objc(UserDefaultsManager)
class UserDefaultsManager: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func setStringForAppGroup(_ key: String, value: String, appGroupId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("ERROR", "Failed to access App Group UserDefaults", nil)
      return
    }
    
    // Convert string to Data for widget compatibility
    guard let data = value.data(using: .utf8) else {
      reject("ERROR", "Failed to convert string to data", nil)
      return
    }
    
    userDefaults.set(data, forKey: key)
    resolve(true)
  }
  
  @objc
  func getStringForAppGroup(_ key: String, appGroupId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("ERROR", "Failed to access App Group UserDefaults", nil)
      return
    }
    
    // Try to read as Data first (preferred format)
    if let data = userDefaults.data(forKey: key) {
      guard let string = String(data: data, encoding: .utf8) else {
        reject("ERROR", "Failed to convert data to string", nil)
        return
      }
      resolve(string)
      return
    }
    
    // Fallback: try to read as String
    if let string = userDefaults.string(forKey: key) {
      resolve(string)
      return
    }
    
    resolve(nil)
  }
  
  @objc
  func removeKeyForAppGroup(_ key: String, appGroupId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("ERROR", "Failed to access App Group UserDefaults", nil)
      return
    }
    
    userDefaults.removeObject(forKey: key)
    resolve(true)
  }
}