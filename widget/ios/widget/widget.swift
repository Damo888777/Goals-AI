//
//  widget.swift
//  widget
//

import WidgetKit
import SwiftUI
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
            frogTask: frogTask?.isCompleted == true ? nil : frogTask,
            regularTasks: regularTasks.filter { !$0.isCompleted }
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
    static let widgetCompleteInner = Color(red: 0.64, green: 0.69, blue: 0.54).opacity(0.5) // #A3B18A 50%
    static let widgetCompleteOuter = Color(red: 0.85, green: 0.85, blue: 0.85).opacity(0.5) // #D9D9D9 50%
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
                    Text(largeDateString(from: entry.date))
                        .font(.custom("Helvetica-Bold", size: 20))
                        .foregroundColor(.widgetTextColor)
                        .minimumScaleFactor(0.8)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.top, 12)
                .padding(.bottom, 8)
                
                // Bottom - Tasks container (Large widget)
                VStack(spacing: 8) {
                    if entry.frogTask == nil && entry.regularTasks.isEmpty {
                        // Empty state
                        LargeEmptyStateView()
                    } else {
                        // Eat the Frog Task container - ALWAYS VISIBLE
                        VStack(spacing: 0) {
                            if let frogTask = entry.frogTask {
                                LargeFrogTaskView(task: frogTask)
                            } else {
                                LargeFrogEmptyView()
                            }
                        }
                        .padding(8)
                        .background(Color.widgetFrogBackground) // Green background for frog task
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.widgetStrokeColor, lineWidth: 2)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        
                        // Regular Tasks (up to 8 for better memory usage) - Reduced spacing
                        VStack(spacing: 3) {
                            ForEach(Array(entry.regularTasks.prefix(8).enumerated()), id: \.element.id) { index, task in
                                LargeRegularTaskView(task: task)
                            }
                        }
                        
                        Spacer()
                    }
                }
                .padding(12)
                .background(Color.widgetSecondaryBackground) // Cream background
                .shadow(color: .widgetShadowColor, radius: 0, x: 0, y: 4)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.widgetStrokeColor, lineWidth: 3)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .background(Color.widgetMainBackground)
            .overlay(
                RoundedRectangle(cornerRadius: 0)
                    .stroke(Color.widgetStrokeColor, lineWidth: 3)
            )
            .containerBackground(Color.widgetMainBackground, for: .widget)
        } else { // Medium widget
            HStack(spacing: 0) {
                // Left side - Date section (Medium widget - CENTER ALIGNED)
                VStack(spacing: 0) {
                    Spacer()
                    
                    VStack(alignment: .center, spacing: 2) {
                        Text("Today")
                            .font(.custom("Helvetica", size: 14))
                            .foregroundColor(.widgetTextColor)
                        
                        Text("\(Calendar.current.component(.day, from: entry.date))")
                            .font(.custom("Helvetica-Bold", size: 32))
                            .foregroundColor(.widgetTextColor)
                            .lineLimit(1)
                        
                        Text(monthWeekdayString(from: entry.date))
                            .font(.custom("Helvetica-Light", size: 12))
                            .foregroundColor(.widgetTextColor)
                    }
                    .frame(maxWidth: .infinity)
                    
                    Spacer()
                }
                .frame(width: 80)
                .padding(.leading, 0)
                
                // Right side - Tasks container (Medium widget)
                VStack(spacing: 6) {
                    if entry.frogTask == nil && entry.regularTasks.isEmpty {
                        // Empty state
                        MediumEmptyStateView()
                    } else {
                        // Eat the Frog Task container - ALWAYS VISIBLE
                        VStack(spacing: 6) {
                            if let frogTask = entry.frogTask {
                                MediumFrogTaskView(task: frogTask)
                            } else {
                                MediumFrogEmptyView()
                            }
                        }
                        .padding(6)
                        .background(Color.widgetFrogBackground) // #E9EDC9 background
                        .shadow(color: .widgetShadowColor, radius: 0, x: 0, y: 4)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.widgetStrokeColor, lineWidth: 3)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        
                        // Regular Tasks (up to 3)
                        VStack(spacing: 4) {
                            ForEach(Array(entry.regularTasks.prefix(3).enumerated()), id: \.element.id) { index, task in
                                MediumRegularTaskView(task: task)
                            }
                        }
                        
                        Spacer()
                    }
                }
                .padding(12)
                .background(Color.widgetSecondaryBackground) // Cream background
                .shadow(color: .widgetShadowColor, radius: 0, x: 0, y: 4)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.widgetStrokeColor, lineWidth: 3)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.trailing, 0)
                .padding(.vertical, 0)
            }
            .background(Color.widgetMainBackground)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.widgetStrokeColor, lineWidth: 3)
            )
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

// MARK: - Frog Task View
struct FrogTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 12) {
            // Completion button
            CompleteButton(task: task)
            
            // Task title
            Text(task.title)
                .font(.custom("Helvetica", size: 14))
                .foregroundColor(.white)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.widgetFrogBackground)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.widgetStrokeColor, lineWidth: 3)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

// MARK: - Regular Task View
struct RegularTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 12) {
            // Completion button
            CompleteButton(task: task)
            
            // Task title
            Text(task.title)
                .font(.custom("Helvetica", size: 14))
                .foregroundColor(.widgetTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
                .strikethrough(task.isCompleted, color: .widgetTextColor)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.widgetSecondaryBackground)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.widgetStrokeColor, lineWidth: 3)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

// MARK: - Compact Frog Task View (Medium Widget)
struct CompactFrogTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 8) {
            // Completion button (smaller)
            CompactCompleteButton(task: task)
            
            // Task title
            Text(task.title)
                .font(.custom("Helvetica", size: 12))
                .foregroundColor(.white)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.widgetFrogBackground)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.widgetStrokeColor, lineWidth: 2)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Compact Regular Task View (Medium Widget)
struct CompactRegularTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 8) {
            // Completion button (smaller)
            CompactCompleteButton(task: task)
            
            // Task title
            Text(task.title)
                .font(.custom("Helvetica", size: 12))
                .foregroundColor(.widgetTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
                .strikethrough(task.isCompleted, color: .widgetTextColor)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.widgetSecondaryBackground)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.widgetStrokeColor, lineWidth: 2)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Compact Complete Button (Medium Widget)
struct CompactCompleteButton: View {
    let task: Task
    
    var body: some View {
        Button(intent: CompleteTaskIntent(taskId: task.id)) {
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

// MARK: - Complete Button
struct CompleteButton: View {
    let task: Task
    
    var body: some View {
        Button(intent: CompleteTaskIntent(taskId: task.id)) {
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

// MARK: - Widget Configuration
@main
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

// MARK: - Medium Widget Task Views
struct MediumFrogTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 8) {
            CompactCompleteButton(task: task)
            
            Text(task.title)
                .font(.custom("Helvetica-Bold", size: 12))
                .foregroundColor(.widgetFrogTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.clear)
    }
}

struct MediumRegularTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 8) {
            CompactCompleteButton(task: task)
            
            Text(task.title)
                .font(.custom("Helvetica", size: 12))
                .foregroundColor(.widgetTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
                .strikethrough(task.isCompleted, color: .widgetTextColor)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.clear)
    }
}

// MARK: - Empty State Views
struct MediumEmptyStateView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 24, weight: .light))
                .foregroundColor(.widgetTextColor.opacity(0.6))
            
            Text("All tasks completed!")
                .font(.custom("Helvetica", size: 12))
                .foregroundColor(.widgetTextColor.opacity(0.8))
                .multilineTextAlignment(.center)
            
            Text("Great job today")
                .font(.custom("Helvetica-Light", size: 10))
                .foregroundColor(.widgetTextColor.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct LargeEmptyStateView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 32, weight: .light))
                .foregroundColor(.widgetTextColor.opacity(0.6))
            
            Text("All tasks completed!")
                .font(.custom("Helvetica", size: 16))
                .foregroundColor(.widgetTextColor.opacity(0.8))
                .multilineTextAlignment(.center)
            
            Text("You've finished all your tasks for today. Great job!")
                .font(.custom("Helvetica-Light", size: 14))
                .foregroundColor(.widgetTextColor.opacity(0.6))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
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
                .font(.custom("Helvetica-Bold", size: 14))
                .foregroundColor(.widgetFrogTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.clear)
    }
}

struct LargeRegularTaskView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 12) {
            CompleteButton(task: task)
            
            Text(task.title)
                .font(.custom("Helvetica", size: 14))
                .foregroundColor(.widgetTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
                .strikethrough(task.isCompleted, color: .widgetTextColor)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.clear)
    }
}

// MARK: - Frog Empty State Views
struct LargeFrogEmptyView: View {
    var body: some View {
        HStack(spacing: 12) {
            // Empty circle (no completion button)
            Circle()
                .stroke(Color.widgetCompleteOuter, lineWidth: 1)
                .frame(width: 24, height: 24)
            
            Text("Set your most important task!")
                .font(.custom("Helvetica", size: 14))
                .foregroundColor(.widgetFrogTextColor.opacity(0.7))
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.clear)
    }
}

struct MediumFrogEmptyView: View {
    var body: some View {
        HStack(spacing: 8) {
            // Empty circle (smaller)
            Circle()
                .stroke(Color.widgetCompleteOuter, lineWidth: 1)
                .frame(width: 18, height: 18)
            
            Text("Set your frog task!")
                .font(.custom("Helvetica", size: 12))
                .foregroundColor(.widgetFrogTextColor.opacity(0.7))
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.clear)
    }
}

// MARK: - Live Activity Attributes
@available(iOS 16.1, *)
struct PomodoroActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        let timeRemaining: Int // seconds
        let totalDuration: Int // seconds  
        let sessionType: String // "work", "shortBreak", "longBreak"
        let isRunning: Bool
        let completedPomodoros: Int
        let taskTitle: String
    }
    
    let startTime: Date
}

// MARK: - Live Activity Widget
@available(iOS 16.1, *)
struct PomodoroLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PomodoroActivityAttributes.self) { context in
            // Lock screen and notification center view
            VStack(spacing: 8) {
                HStack {
                    Text(context.state.sessionType == "work" ? "🍅 Focus Time" : "☕ Break Time")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35))
                    
                    Spacer()
                    
                    Text(formatTime(context.state.timeRemaining))
                        .font(.system(size: 20, weight: .bold, design: .monospaced))
                        .foregroundColor(Color(red: 0.74, green: 0.29, blue: 0.32))
                }
                
                ProgressView(value: Double(context.state.totalDuration - context.state.timeRemaining), 
                           total: Double(context.state.totalDuration))
                    .progressViewStyle(LinearProgressViewStyle(tint: Color(red: 0.74, green: 0.29, blue: 0.32)))
                
                HStack {
                    Text(context.state.taskTitle)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35))
                        .lineLimit(1)
                    
                    Spacer()
                    
                    Text("🍅 \(context.state.completedPomodoros)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35))
                }
            }
            .padding(16)
            .background(Color(red: 0.96, green: 0.92, blue: 0.88))
            .activityBackgroundTint(Color(red: 0.96, green: 0.92, blue: 0.88))
            .activitySystemActionForegroundColor(Color(red: 0.21, green: 0.29, blue: 0.35))
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.sessionType == "work" ? "Focus" : "Break")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35))
                        
                        Text("🍅 \(context.state.completedPomodoros)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color(red: 0.74, green: 0.29, blue: 0.32))
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formatTime(context.state.timeRemaining))
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(Color(red: 0.74, green: 0.29, blue: 0.32))
                        
                        Text(context.state.isRunning ? "Running" : "Paused")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35))
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 4) {
                        ProgressView(value: Double(context.state.totalDuration - context.state.timeRemaining), 
                                   total: Double(context.state.totalDuration))
                            .progressViewStyle(LinearProgressViewStyle(tint: Color(red: 0.74, green: 0.29, blue: 0.32)))
                        
                        Text(context.state.taskTitle)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color(red: 0.21, green: 0.29, blue: 0.35))
                            .lineLimit(1)
                    }
                }
            } compactLeading: {
                Text("🍅")
                    .font(.system(size: 16))
            } compactTrailing: {
                Text(formatTime(context.state.timeRemaining))
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(red: 0.74, green: 0.29, blue: 0.32))
            } minimal: {
                Text("🍅")
                    .font(.system(size: 16))
            }
            .keylineTint(Color(red: 0.74, green: 0.29, blue: 0.32))
        }
    }
    
    private func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", mins, secs)
    }
}

// MARK: - Widget Bundle
@main
struct GoalsAIWidgetBundle: WidgetBundle {
    var body: some Widget {
        widget()
        if #available(iOS 16.1, *) {
            PomodoroLiveActivityWidget()
        }
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
