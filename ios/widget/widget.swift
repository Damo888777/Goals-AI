//
//  widget.swift
//  widget
//

import WidgetKit
import SwiftUI
import AppIntents
import Intents
import ActivityKit

// MARK: - Data Models
struct Task {
    let id: String
    let title: String
    let isCompleted: Bool
    let isFrog: Bool
    
    init(from widgetTaskData: WidgetTaskData) {
        self.id = widgetTaskData.id
        self.title = widgetTaskData.title
        self.isCompleted = widgetTaskData.isCompleted
        self.isFrog = widgetTaskData.isFrog
    }
    
    init(id: String, title: String, isCompleted: Bool, isFrog: Bool) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
        self.isFrog = isFrog
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let frogTask: Task?
    let regularTasks: [Task]
}

// MARK: - Timeline Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            frogTask: nil,
            regularTasks: []
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        // For snapshot, use real data if available, otherwise placeholder
        if let widgetData = SharedDataManager.shared.getWidgetData() {
            let entry = createEntry(from: widgetData)
            completion(entry)
        } else {
            let entry = placeholder(in: context)
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        
        // Fetch real data from shared container
        let entry: SimpleEntry
        if let widgetData = SharedDataManager.shared.getWidgetData() {
            entry = createEntry(from: widgetData)
        } else {
            // Fallback to empty state
            entry = SimpleEntry(
                date: currentDate,
                frogTask: nil,
                regularTasks: []
            )
        }
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func createEntry(from widgetData: WidgetData) -> SimpleEntry {
        let frogTask = widgetData.frogTask.map { Task(from: $0) }
        let regularTasks = widgetData.regularTasks.map { Task(from: $0) }
        
        return SimpleEntry(
            date: Date(),
            frogTask: frogTask, // Show frog task regardless of completion (removal handled in TaskCompletionIntent)
            regularTasks: regularTasks // Show all tasks (removal handled in TaskCompletionIntent)
        )
    }
}

// MARK: - Color Extensions
extension Color {
    static let widgetMainBackground = Color(red: 0.91, green: 0.93, blue: 0.79) // #E9EDC9
    static let widgetSecondaryBackground = Color(red: 0.96, green: 0.92, blue: 0.88) // #F5EBE0
    static let widgetFrogBackground = Color(red: 0.91, green: 0.93, blue: 0.79) // #E9EDC9 (changed from dark blue)
    static let widgetFrogTextColor = Color(red: 0.21, green: 0.29, blue: 0.35) // #364958 (dark blue for frog text)
    static let widgetTextColor = Color(red: 0.21, green: 0.29, blue: 0.35) // #364958
    static let widgetStrokeColor = Color(red: 0.21, green: 0.29, blue: 0.35) // #364958
    static let widgetCompleteInner = Color(red: 0.21, green: 0.29, blue: 0.35).opacity(0.8) // #364958 dark blue
    static let widgetCompleteOuter = Color(red: 0.21, green: 0.29, blue: 0.35).opacity(0.6) // #364958 dark blue
    static let widgetShadowColor = Color(red: 0.49, green: 0.49, blue: 0.49).opacity(0.75) // #7c7c7c 75%
}

// MARK: - Widget Entry View
struct widgetEntryView: View {
    var entry: SimpleEntry
    @Environment(\.widgetFamily) var widgetFamily
    
    var body: some View {
        if widgetFamily == .systemLarge { // Large widget
            VStack(spacing: 0) {
                // Top - Date section (Large widget) - Single line format
                VStack(alignment: .leading, spacing: 2) {
                    largeDateText(from: entry.date)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.top, 12)
                .padding(.bottom, 8)
                
                // Layer 2: Container Layer (cream background with drop shadow)
                VStack(spacing: 8) {
                    // Layer 3: Eat the Frog Container - ALWAYS VISIBLE
                    VStack(spacing: 0) {
                        if let frogTask = entry.frogTask {
                            LargeFrogTaskView(task: frogTask)
                        } else {
                            LargeFrogEmptyView()
                        }
                    }
                    .padding(8)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.widgetFrogBackground)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.widgetStrokeColor.opacity(0.3), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    
                    // Regular Tasks (up to 8 for better memory usage) - Reduced spacing
                    if !entry.regularTasks.isEmpty {
                        VStack(spacing: 3) {
                            ForEach(Array(entry.regularTasks.prefix(8).enumerated()), id: \.element.id) { index, task in
                                LargeRegularTaskView(task: task)
                            }
                        }
                    }
                    
                    if entry.frogTask == nil && entry.regularTasks.isEmpty {
                        // Empty state for regular tasks
                        LargeEmptyStateView()
                    }
                    
                    Spacer()
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.widgetSecondaryBackground)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.widgetStrokeColor.opacity(0.3), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .background(Color.widgetMainBackground)
            .containerBackground(Color.widgetMainBackground, for: .widget)
        } else { // Medium widget
            HStack {
                // Date section
                VStack(spacing: 2) {
                    Text("Today")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.widgetTextColor)
                    
                    Text("\(Calendar.current.component(.day, from: entry.date))")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.widgetTextColor)
                    
                    Text(monthWeekdayString(from: entry.date))
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.widgetTextColor)
                }
                .frame(width: 80)
                
                // Tasks container
                VStack(spacing: 6) {
                    // Frog task
                    Group {
                        if let frogTask = entry.frogTask {
                            MediumFrogTaskView(task: frogTask)
                        } else {
                            MediumFrogEmptyView()
                        }
                    }
                    .padding(8)
                    .background(Color.widgetFrogBackground, in: RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.widgetStrokeColor.opacity(0.3), lineWidth: 1))
                    
                    // Regular tasks
                    if !entry.regularTasks.isEmpty {
                        VStack(spacing: 4) {
                            ForEach(Array(entry.regularTasks.prefix(3).enumerated()), id: \.element.id) { _, task in
                                MediumRegularTaskView(task: task)
                            }
                        }
                        
                        if entry.regularTasks.count > 3 {
                            Text("+ \(entry.regularTasks.count - 3) more")
                                .font(.system(size: 10, weight: .light))
                                .foregroundColor(.widgetTextColor.opacity(0.6))
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, 5)
                        }
                    } else if entry.frogTask == nil {
                        Text("No tasks scheduled")
                            .font(.system(size: 12))
                            .foregroundColor(.widgetTextColor.opacity(0.8))
                            .frame(maxHeight: .infinity)
                    }
                    
                    Spacer()
                }
                .padding(12)
                .background(Color.widgetSecondaryBackground, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.widgetStrokeColor.opacity(0.3), lineWidth: 1))
            }
            .background(Color.widgetMainBackground)
            .containerBackground(Color.widgetMainBackground, for: .widget)
        }
    }
    
    private func monthWeekdayString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM, EEE"
        return formatter.string(from: date)
    }
    
    private func currentDateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d.MMM"
        return formatter.string(from: date)
    }
    
    private func weekdayString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }
    
    private func largeDateText(from date: Date) -> some View {
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "d"
        let day = dayFormatter.string(from: date)
        
        let monthFormatter = DateFormatter()
        monthFormatter.dateFormat = "MMMM"
        let month = monthFormatter.string(from: date)
        
        let weekdayFormatter = DateFormatter()
        weekdayFormatter.dateFormat = "EEEE"
        let weekday = weekdayFormatter.string(from: date)
        
        return HStack(spacing: 4) {
            Text("Today")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.widgetTextColor)
            
            Text("\(day).\(month),")
                .font(.system(size: 18, weight: .light))
                .foregroundColor(.widgetTextColor)
            
            Text(weekday)
                .font(.system(size: 18, weight: .light))
                .foregroundColor(.widgetTextColor)
        }
        .minimumScaleFactor(0.8)
        .lineLimit(1)
    }
    
    private func largeDateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        let weekday = formatter.string(from: date)
        
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "d"
        let day = dayFormatter.string(from: date)
        
        let monthFormatter = DateFormatter()
        monthFormatter.dateFormat = "MMMM"
        let month = monthFormatter.string(from: date)
        
        return "Today \(day). \(month), \(weekday)"
    }
}

// MARK: - Complete Button
struct CompleteButton: View {
    let task: Task
    
    var body: some View {
        Button(intent: CompleteTaskIntent(taskId: task.id, taskTitle: task.title)) {
            ZStack {
                Circle()
                    .stroke(Color.widgetCompleteOuter, lineWidth: 1)
                    .frame(width: 24, height: 24)
                
                if task.isCompleted {
                    Circle()
                        .fill(Color.widgetCompleteInner)
                        .frame(width: 22, height: 22)
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.widgetTextColor)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Compact Complete Button (Medium Widget)
struct CompactCompleteButton: View {
    let task: Task
    
    var body: some View {
        Button(intent: CompleteTaskIntent(taskId: task.id, taskTitle: task.title)) {
            ZStack {
                Circle()
                    .stroke(Color.widgetCompleteOuter, lineWidth: 1)
                    .frame(width: 18, height: 18)
                
                if task.isCompleted {
                    Circle()
                        .fill(Color.widgetCompleteInner)
                        .frame(width: 16, height: 16)
                    
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.widgetTextColor)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Empty State Views
struct LargeEmptyStateView: View {
    var body: some View {
        Text("All done for today")
            .font(.system(size: 16, weight: .regular))
            .foregroundColor(.widgetTextColor.opacity(0.8))
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Large Widget Task Views
struct LargeFrogTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 12) {
            CompleteButton(task: task)
            
            Text(task.title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.widgetFrogTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct LargeRegularTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 12) {
            CompleteButton(task: task)
            
            Text(task.title)
                .font(.system(size: 14))
                .foregroundColor(.widgetTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
                .strikethrough(task.isCompleted, color: .widgetTextColor)
        }
    }
}

struct LargeFrogEmptyView: View {
    var body: some View {
        Text("No frog task set")
            .font(.system(size: 14))
            .foregroundColor(.widgetFrogTextColor.opacity(0.7))
            .lineLimit(1)
            .frame(maxWidth: .infinity, alignment: .center)
    }
}

// MARK: - Medium Widget Task Views
struct MediumFrogTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 8) {
            CompactCompleteButton(task: task)
            
            Text(task.title)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.widgetFrogTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct MediumRegularTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 8) {
            CompactCompleteButton(task: task)
            
            Text(task.title)
                .font(.system(size: 12, weight: .regular))
                .foregroundColor(.widgetTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
                .strikethrough(task.isCompleted, color: .widgetTextColor)
        }
    }
}

struct MediumFrogEmptyView: View {
    var body: some View {
        Text("No frog task set")
            .font(.system(size: 12, weight: .regular))
            .foregroundColor(.widgetFrogTextColor.opacity(0.7))
            .lineLimit(1)
            .frame(maxWidth: .infinity, alignment: .center)
    }
}

// MARK: - Widget Configuration
struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
        }
        .configurationDisplayName("Goals AI Tasks")
        .description("View today's Eat the Frog task and regular tasks.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Widget Bundle
@main
struct GoalsAIWidgetBundle: WidgetBundle {
    var body: some Widget {
        widget()
    }
}

// MARK: - Previews
struct widget_Previews: PreviewProvider {
    static var previews: some View {
        widgetEntryView(entry: SimpleEntry(
            date: Date(),
            frogTask: nil,
            regularTasks: []
        ))
        .previewContext(WidgetPreviewContext(family: .systemLarge))
    }
}
