//
//  WidgetKitReloader.swift
//  Native module for triggering WidgetKit timeline reloads
//

import Foundation
import WidgetKit
import React

@objc(WidgetKitReloader)
class WidgetKitReloader: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func reloadAllTimelines(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            resolve("Widget timelines reloaded")
        } else {
            reject("UNSUPPORTED", "WidgetKit requires iOS 14.0 or later", nil)
        }
    }
    
    @objc
    func reloadTimelines(_ widgetKind: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
            resolve("Widget timeline reloaded for kind: \(widgetKind)")
        } else {
            reject("UNSUPPORTED", "WidgetKit requires iOS 14.0 or later", nil)
        }
    }
    
    @objc
    func getCurrentConfigurations(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.getCurrentConfigurations { result in
                switch result {
                case .success(let configurations):
                    let configData = configurations.map { config in
                        return [
                            "kind": config.kind,
                            "family": config.family.rawValue,
                            "displayName": config.displayName
                        ]
                    }
                    resolve(configData)
                case .failure(let error):
                    reject("CONFIG_ERROR", "Failed to get widget configurations: \(error.localizedDescription)", error)
                }
            }
        } else {
            reject("UNSUPPORTED", "WidgetKit requires iOS 14.0 or later", nil)
        }
    }
}

// MARK: - React Native Module Export
@objc(WidgetKitReloaderBridge)
class WidgetKitReloaderBridge: RCTBridgeModule {
    
    static func moduleName() -> String! {
        return "WidgetKitReloader"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func reloadAllTimelines(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let module = WidgetKitReloader()
        module.reloadAllTimelines(resolve, rejecter: reject)
    }
    
    @objc
    func reloadTimelines(_ widgetKind: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let module = WidgetKitReloader()
        module.reloadTimelines(widgetKind, resolver: resolve, rejecter: reject)
    }
    
    @objc
    func getCurrentConfigurations(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let module = WidgetKitReloader()
        module.getCurrentConfigurations(resolve, rejecter: reject)
    }
}
