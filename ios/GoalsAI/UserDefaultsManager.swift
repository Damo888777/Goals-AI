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
  
  // Write string to App Group UserDefaults
  @objc
  func setStringForAppGroup(_ key: String, value: String, appGroupId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("APP_GROUP_ERROR", "Failed to access App Group UserDefaults", nil)
      return
    }
    
    // Convert string to Data to match what widget expects
    guard let data = value.data(using: .utf8) else {
      reject("ENCODING_ERROR", "Failed to encode string to UTF-8", nil)
      return
    }
    
    userDefaults.set(data, forKey: key)
    let success = userDefaults.synchronize()
    
    if success {
      print("📁 [Native UserDefaults] Successfully wrote Data to App Group: \(key)")
      resolve(true)
    } else {
      reject("WRITE_ERROR", "Failed to write to UserDefaults", nil)
    }
  }
  
  // Read string from App Group UserDefaults
  @objc
  func getStringForAppGroup(_ key: String, appGroupId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("APP_GROUP_ERROR", "Failed to access App Group UserDefaults", nil)
      return
    }
    
    // Read Data and convert to string to match what was written
    guard let data = userDefaults.data(forKey: key) else {
      print("📁 [Native UserDefaults] No data found for key: \(key)")
      resolve(nil)
      return
    }
    
    guard let value = String(data: data, encoding: .utf8) else {
      reject("DECODING_ERROR", "Failed to decode Data to UTF-8 string", nil)
      return
    }
    
    print("📁 [Native UserDefaults] Read from App Group: \(key) = found")
    resolve(value)
  }
  
  // Remove key from App Group UserDefaults
  @objc
  func removeKeyForAppGroup(_ key: String, appGroupId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("APP_GROUP_ERROR", "Failed to access App Group UserDefaults", nil)
      return
    }
    
    userDefaults.removeObject(forKey: key)
    let success = userDefaults.synchronize()
    
    if success {
      print("📁 [Native UserDefaults] Successfully removed from App Group: \(key)")
      resolve(true)
    } else {
      reject("REMOVE_ERROR", "Failed to remove from UserDefaults", nil)
    }
  }
}