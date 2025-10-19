#import <React/RCTBridgeModule.h>
#import <WidgetKit/WidgetKit.h>

@interface RCT_EXTERN_MODULE(TaskWidgetModule, NSObject)

RCT_EXTERN_METHOD(updateWidgetData:(NSDictionary *)eatTheFrogTask 
                  todaysTasks:(NSArray *)todaysTasks)

RCT_EXTERN_METHOD(getCompletedTaskId:(RCTResponseSenderBlock)callback)

@end
