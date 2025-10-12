import Foundation
import React

@objc(GoalsWidgetModule)
class GoalsWidgetModule: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func updateWidget() {
        // This method can be called from React Native to trigger widget updates
        DispatchQueue.main.async {
            // Update widget timeline if needed
        }
    }
}
