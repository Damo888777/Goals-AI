import ActivityKit
import Foundation

// MARK: - Live Activity Attributes
struct TaskActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var eatTheFrogTask: TaskData?
        var todaysTasks: [TaskData]
        var lastUpdated: Date
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

// MARK: - Task Data for Live Activities
struct TaskData: Codable, Hashable, Identifiable {
    let id: String
    let title: String
    let isCompleted: Bool
    let isEatTheFrog: Bool
    
    init(id: String, title: String, isCompleted: Bool, isEatTheFrog: Bool = false) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
        self.isEatTheFrog = isEatTheFrog
    }
}
