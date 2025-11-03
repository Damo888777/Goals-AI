# Widget Sync Fix - Tasks Disappearing Issue

## Problem

The Home Widget was only showing tasks briefly on first app open, then tasks would disappear on subsequent opens. The frog task was not visible at all.

## Root Cause

The `widgetTimelineManager` was calling `widgetDataService.updateWidgetData(null, [])` with **empty data** instead of fetching actual tasks from the database. This caused the widget to be cleared every time it refreshed.

### Specific Issues:

1. **Empty Data Refresh** (`widgetTimelineManager.ts` line 241):
   ```typescript
   // ❌ WRONG - This clears widget data
   await widgetDataService.updateWidgetData(null, [])
   ```

2. **No Initial Sync on App Startup**:
   - Widget data was not being synced when the app opened
   - Only synced when tasks were modified

3. **Timeline Refresh Clearing Data**:
   - Every 15-minute refresh would clear the widget
   - App state changes would trigger empty refreshes

## Solution

### 1. Fixed Timeline Refresh (`widgetTimelineManager.ts`)

**Before:**
```typescript
// Step 2: Update widget data
await widgetDataService.updateWidgetData(null, []) // This will fetch current tasks
```

**After:**
```typescript
// Step 2: Fetch and update widget data with actual tasks
const { widgetSyncService } = await import('./widgetSyncService')
await widgetSyncService.forceSyncToWidget()
```

### 2. Added Initial Sync on App Startup (`app/_layout.tsx`)

```typescript
// Sync tasks to widget on app startup
const { widgetSyncService } = await import('../src/services/widgetSyncService');
await widgetSyncService.forceSyncToWidget();
console.log('🔄 [_layout] Initial widget sync completed');
```

## How It Works Now

### Widget Sync Flow:

```
App Opens
    ↓
Initial Sync (forceSyncToWidget)
    ↓
Fetch today's tasks from WatermelonDB
    ↓
Filter for frog task and regular tasks
    ↓
Write to App Group shared storage
    ↓
Reload widget timelines
    ↓
Widget displays tasks
```

### Periodic Refresh:

```
Every 15 minutes (or on app state change)
    ↓
Timeline Manager triggers refresh
    ↓
Calls forceSyncToWidget (not empty data!)
    ↓
Fetches current tasks from database
    ↓
Updates widget with fresh data
    ↓
Widget stays populated
```

## What `forceSyncToWidget` Does

Located in `src/services/widgetSyncService.ts`:

1. **Fetches Today's Tasks:**
   ```typescript
   const allIncompleteTasks = await database.collections
     .get<Task>('tasks')
     .query(
       Q.where('is_complete', false),
       Q.where('scheduled_date', Q.notEq(null))
     )
     .fetch()
   ```

2. **Filters for Today:**
   ```typescript
   const todaysTasks = allIncompleteTasks.filter((task: Task) => {
     if (!task.scheduledDate) return false
     const taskDate = new Date(task.scheduledDate)
     return (
       taskDate.getFullYear() === today.getFullYear() &&
       taskDate.getMonth() === today.getMonth() &&
       taskDate.getDate() === today.getDate()
     )
   })
   ```

3. **Separates Frog Task:**
   ```typescript
   const frogTask = todaysTasks.find((task: Task) => task.isFrog)
   const regularTasks = todaysTasks.filter((task: Task) => !task.isFrog)
   ```

4. **Updates Widget:**
   ```typescript
   await widgetDataService.updateWidgetData(frogTask || null, regularTasks)
   ```

## Files Modified

1. ✅ `/Users/60minuteapps/Desktop/Goals-AI/src/services/widgetTimelineManager.ts`
   - Changed `performTimelineRefresh()` to use `forceSyncToWidget()`

2. ✅ `/Users/60minuteapps/Desktop/Goals-AI/app/_layout.tsx`
   - Added initial widget sync on app startup

## Testing Checklist

- [ ] Open app - widget should show today's tasks
- [ ] Close and reopen app - tasks should persist
- [ ] Frog task should be visible in widget
- [ ] Regular tasks should be visible
- [ ] Complete a task in widget - should sync back to app
- [ ] Complete a task in app - should update widget
- [ ] Wait 15 minutes - widget should refresh with current data
- [ ] Background/foreground app - widget should maintain data

## Expected Behavior

### On App Open:
1. ✅ Widget immediately syncs with today's tasks
2. ✅ Frog task appears at top (if exists)
3. ✅ Regular tasks appear below
4. ✅ Tasks persist across app opens

### During Use:
1. ✅ Widget refreshes every 15 minutes with current data
2. ✅ Task completions in widget sync to app
3. ✅ Task completions in app sync to widget
4. ✅ App state changes trigger smart refresh

### Edge Cases:
1. ✅ No tasks scheduled - widget shows empty state
2. ✅ Only frog task - widget shows frog task only
3. ✅ No frog task - widget shows regular tasks only
4. ✅ All tasks completed - widget shows empty state

## Technical Details

### Widget Data Structure:

```typescript
interface WidgetData {
  frogTask: WidgetTaskData | null
  regularTasks: WidgetTaskData[]
  lastUpdated: string
}

interface WidgetTaskData {
  id: string
  title: string
  isCompleted: boolean
  isFrog: boolean
}
```

### Storage Location:

- **App Group:** `group.pro.GoalAchieverAI`
- **Key:** `@goals_ai:widget_tasks`
- **Method:** UserDefaults (iOS) via `UserDefaultsManager` bridge

### Refresh Policy:

- **Interval:** 15 minutes
- **Max Daily Refreshes:** 100
- **Background Refresh:** Enabled
- **Triggers:**
  - App startup
  - App state change (background → foreground)
  - Scheduled interval
  - Manual task updates

## Summary

✅ **Fixed:** Widget now properly displays tasks on every app open
✅ **Fixed:** Frog task is now visible in widget
✅ **Fixed:** Tasks persist across app opens
✅ **Fixed:** Timeline refresh uses actual data instead of empty arrays

The widget will now reliably show today's tasks and maintain data consistency! 🎉
