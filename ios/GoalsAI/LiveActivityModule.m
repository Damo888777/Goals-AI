//
//  LiveActivityModule.m
//  Bridge for LiveActivityModule
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModuleBridge, NSObject)

RCT_EXTERN_METHOD(areActivitiesEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startPomodoroActivity:(NSDictionary *)stateDict
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updatePomodoroActivity:(NSString *)activityId
                  stateDict:(NSDictionary *)stateDict
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endPomodoroActivity:(NSString *)activityId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
