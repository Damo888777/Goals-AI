import WidgetKit
import SwiftUI
import Intents

// MARK: - Task Data Models
struct TaskEntry: TimelineEntry {
    let date: Date
    let eatTheFrogTask: TaskData?
    let todaysTasks: [TaskData]
}

struct TaskData: Identifiable {
    let id: String
    let title: String
    let isCompleted: Bool
    let isEatTheFrog: Bool
}

// MARK: - Widget Intent for Interactivity
struct CompleteTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Complete Task"
    static var description = IntentDescription("Mark a task as completed")
    
    @Parameter(title: "Task ID")
    var taskId: String
    
    init() {}
    
    init(taskId: String) {
        self.taskId = taskId
    }
    
    func perform() async throws -> some IntentResult {
        // This will communicate with the main app through App Groups
        let userDefaults = UserDefaults(suiteName: "group.pro.GoalAchieverAI.widgets")
        userDefaults?.set(taskId, forKey: "completedTaskId")
        userDefaults?.set(Date().timeIntervalSince1970, forKey: "lastCompletionTime")
        
        return .result()
    }
}

// MARK: - Timeline Provider
struct TaskWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> TaskEntry {
        TaskEntry(
            date: Date(),
            eatTheFrogTask: TaskData(id: "1", title: "Complete important project", isCompleted: false, isEatTheFrog: true),
            todaysTasks: [
                TaskData(id: "2", title: "Review quarterly goals", isCompleted: false, isEatTheFrog: false),
                TaskData(id: "3", title: "Plan next week", isCompleted: false, isEatTheFrog: false),
                TaskData(id: "4", title: "Update project status", isCompleted: false, isEatTheFrog: false)
            ]
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (TaskEntry) -> ()) {
        let entry = placeholder(in: context)
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> ()) {
        // Read data from App Groups shared container
        let userDefaults = UserDefaults(suiteName: "group.pro.GoalAchieverAI.widgets")
        
        // Parse tasks from shared data (this would be populated by the React Native app)
        let eatTheFrogTask = getEatTheFrogTask(from: userDefaults)
        let todaysTasks = getTodaysTasks(from: userDefaults)
        
        let entry = TaskEntry(
            date: Date(),
            eatTheFrogTask: eatTheFrogTask,
            todaysTasks: todaysTasks
        )
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getEatTheFrogTask(from userDefaults: UserDefaults?) -> TaskData? {
        guard let data = userDefaults?.data(forKey: "eatTheFrogTask"),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let id = json["id"] as? String,
              let title = json["title"] as? String,
              let isCompleted = json["isCompleted"] as? Bool else {
            return TaskData(id: "placeholder", title: "Eat the Frog Placeholder Title", isCompleted: false, isEatTheFrog: true)
        }
        
        return TaskData(id: id, title: title, isCompleted: isCompleted, isEatTheFrog: true)
    }
    
    private func getTodaysTasks(from userDefaults: UserDefaults?) -> [TaskData] {
        guard let data = userDefaults?.data(forKey: "todaysTasks"),
              let jsonArray = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return [
                TaskData(id: "placeholder1", title: "Task Title Placeholder", isCompleted: false, isEatTheFrog: false),
                TaskData(id: "placeholder2", title: "Task Title Placeholder", isCompleted: false, isEatTheFrog: false),
                TaskData(id: "placeholder3", title: "Task Title Placeholder", isCompleted: false, isEatTheFrog: false)
            ]
        }
        
        return jsonArray.compactMap { json in
            guard let id = json["id"] as? String,
                  let title = json["title"] as? String,
                  let isCompleted = json["isCompleted"] as? Bool else { return nil }
            
            return TaskData(id: id, title: title, isCompleted: isCompleted, isEatTheFrog: false)
        }
    }
}

// MARK: - Widget Views
struct TaskWidgetView: View {
    var entry: TaskWidgetProvider.Entry
    
    // Design colors from specifications
    private let mainBackground = Color(red: 0.914, green: 0.929, blue: 0.788) // #E9EDC9
    private let secondaryBackground = Color(red: 0.961, green: 0.922, blue: 0.878) // #F5EBE0
    private let eatTheFrogBackground = Color(red: 0.212, green: 0.286, blue: 0.345) // #364958
    private let textColor = Color(red: 0.212, green: 0.286, blue: 0.345) // #364958
    private let strokeColor = Color(red: 0.212, green: 0.286, blue: 0.345) // #364958
    private let completeButtonInner = Color(red: 0.639, green: 0.694, blue: 0.541).opacity(0.5) // #A3B18A 50%
    private let completeButtonOuter = Color(red: 0.851, green: 0.851, blue: 0.851).opacity(0.5) // #D9D9D9 50%
    
    var body: some View {
        HStack(spacing: 0) {
            // Left side - Date section
            VStack(spacing: 4) {
                Text("Today")
                    .font(.custom("Helvetica-Light", size: 16))
                    .foregroundColor(textColor)
                
                Text(dayNumber)
                    .font(.custom("Helvetica-Bold", size: 48))
                    .foregroundColor(textColor)
                
                Text(monthAndDay)
                    .font(.custom("Helvetica-Light", size: 14))
                    .foregroundColor(textColor)
            }
            .frame(maxWidth: .infinity)
            .padding(.leading, 16)
            
            // Right side - Tasks section
            VStack(spacing: 8) {
                // Eat the Frog Task
                if let eatTheFrogTask = entry.eatTheFrogTask {
                    TaskRowView(
                        task: eatTheFrogTask,
                        backgroundColor: eatTheFrogBackground,
                        textColor: .white
                    )
                }
                
                // Today's Tasks
                ForEach(Array(entry.todaysTasks.prefix(3)), id: \.id) { task in
                    TaskRowView(
                        task: task,
                        backgroundColor: secondaryBackground,
                        textColor: textColor
                    )
                }
                
                Spacer()
            }
            .padding(.trailing, 16)
            .padding(.top, 16)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(mainBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(strokeColor, lineWidth: 3)
        )
    }
    
    private var dayNumber: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: entry.date)
    }
    
    private var monthAndDay: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM. E"
        return formatter.string(from: entry.date)
    }
}

struct TaskRowView: View {
    let task: TaskData
    let backgroundColor: Color
    let textColor: Color
    
    // Design colors
    private let strokeColor = Color(red: 0.212, green: 0.286, blue: 0.345) // #364958
    private let completeButtonInner = Color(red: 0.639, green: 0.694, blue: 0.541).opacity(0.5) // #A3B18A 50%
    private let completeButtonOuter = Color(red: 0.851, green: 0.851, blue: 0.851).opacity(0.5) // #D9D9D9 50%
    
    var body: some View {
        HStack(spacing: 12) {
            // Complete button
            Button(intent: CompleteTaskIntent(taskId: task.id)) {
                ZStack {
                    Circle()
                        .fill(completeButtonOuter)
                        .frame(width: 24, height: 24)
                        .overlay(
                            Circle()
                                .stroke(strokeColor, lineWidth: 1)
                        )
                    
                    if task.isCompleted {
                        Circle()
                            .fill(completeButtonInner)
                            .frame(width: 16, height: 16)
                            .overlay(
                                Circle()
                                    .stroke(strokeColor, lineWidth: 1)
                            )
                    }
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            // Task title
            Text(task.title)
                .font(.custom("Helvetica", size: 14))
                .foregroundColor(textColor)
                .lineLimit(1)
                .truncationMode(.tail)
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(backgroundColor)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(strokeColor, lineWidth: 3)
        )
    }
}

// MARK: - Widget Configuration
struct TaskWidget: Widget {
    let kind: String = "TaskWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TaskWidgetProvider()) { entry in
            TaskWidgetView(entry: entry)
        }
        .configurationDisplayName("Today's Tasks")
        .description("View and complete your Eat the Frog task and today's tasks")
        .supportedFamilies([.systemLarge])
    }
}

// MARK: - Widget Bundle
@main
struct TaskWidgetBundle: WidgetBundle {
    var body: some Widget {
        TaskWidget()
    }
}

// MARK: - Preview
struct TaskWidget_Previews: PreviewProvider {
    static var previews: some View {
        TaskWidgetView(entry: TaskEntry(
            date: Date(),
            eatTheFrogTask: TaskData(id: "1", title: "Eat the Frog Placeholder Title", isCompleted: false, isEatTheFrog: true),
            todaysTasks: [
                TaskData(id: "2", title: "Task Title Placeholder", isCompleted: false, isEatTheFrog: false),
                TaskData(id: "3", title: "Task Title Placeholder", isCompleted: false, isEatTheFrog: false),
                TaskData(id: "4", title: "Task Title Placeholder", isCompleted: false, isEatTheFrog: false)
            ]
        ))
        .previewContext(WidgetPreviewContext(family: .systemLarge))
    }
}
