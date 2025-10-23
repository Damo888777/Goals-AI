//
//  WidgetKitReloader.m
//  Bridge for WidgetKitReloader
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetKitReloader, NSObject)

RCT_EXTERN_METHOD(reloadAllTimelines:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reloadTimelines:(NSString *)widgetKind
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCurrentConfigurations:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
