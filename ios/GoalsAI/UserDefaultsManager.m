//
//  UserDefaultsManager.m
//  GoalsAI
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(UserDefaultsManager, NSObject)

RCT_EXTERN_METHOD(setStringForAppGroup:(NSString *)key 
                  value:(NSString *)value 
                  appGroupId:(NSString *)appGroupId
                  resolve:(RCTPromiseResolveBlock)resolve 
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getStringForAppGroup:(NSString *)key 
                  appGroupId:(NSString *)appGroupId
                  resolve:(RCTPromiseResolveBlock)resolve 
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeKeyForAppGroup:(NSString *)key 
                  appGroupId:(NSString *)appGroupId
                  resolve:(RCTPromiseResolveBlock)resolve 
                  reject:(RCTPromiseRejectBlock)reject)

@end