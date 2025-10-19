import Foundation
import React

@objc(TaskWidgetModule)
class TaskWidgetModule: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func updateWidgetData(_ eatTheFrogTask: NSDictionary?, todaysTasks: NSArray) {
        let userDefaults = UserDefaults(suiteName: "group.pro.GoalAchieverAI.widgets")
        
        // Store Eat the Frog task
        if let eatTheFrogTask = eatTheFrogTask {
            do {
                let data = try JSONSerialization.data(withJSONObject: eatTheFrogTask, options: [])
                userDefaults?.set(data, forKey: "eatTheFrogTask")
            } catch {
                print("Error serializing eat the frog task: \(error)")
            }
        } else {
            userDefaults?.removeObject(forKey: "eatTheFrogTask")
        }
        
        // Store today's tasks
        do {
            let data = try JSONSerialization.data(withJSONObject: todaysTasks, options: [])
            userDefaults?.set(data, forKey: "todaysTasks")
        } catch {
            print("Error serializing today's tasks: \(error)")
        }
        
        // Trigger widget refresh
        WidgetCenter.shared.reloadTimelines(ofKind: "TaskWidget")
    }
    
    @objc
    func getCompletedTaskId(_ callback: @escaping RCTResponseSenderBlock) {
        let userDefaults = UserDefaults(suiteName: "group.pro.GoalAchieverAI.widgets")
        
        if let taskId = userDefaults?.string(forKey: "completedTaskId"),
           let lastCompletionTime = userDefaults?.object(forKey: "lastCompletionTime") as? TimeInterval {
            
            // Clear the completed task data after reading
            userDefaults?.removeObject(forKey: "completedTaskId")
            userDefaults?.removeObject(forKey: "lastCompletionTime")
            
            callback([NSNull(), [
                "taskId": taskId,
                "completionTime": lastCompletionTime
            ]])
        } else {
            callback([NSNull(), NSNull()])
        }
    }
}
