//
//  WidgetLanguageSync.m
//  GoalsAI
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetLanguageSync, NSObject)

RCT_EXTERN_METHOD(setLanguage:(NSString *)language
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getLanguage:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
