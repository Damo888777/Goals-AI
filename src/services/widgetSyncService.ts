import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform, NativeModules } from 'react-native'

// Use our custom UserDefaultsManager bridge
const UserDefaultsManager = Platform.OS === 'ios' ? NativeModules.UserDefaultsManager : null
if (Platform.OS === 'ios' && !UserDefaultsManager) {
  console.warn('UserDefaultsManager bridge not available in widgetSyncService')
}
import database from '../db'
import Task from '../db/models/Task'
import { Q } from '@nozbe/watermelondb'
import { widgetDataService } from './widgetDataService'

// App Group identifier - must match widget entitlements
const APP_GROUP_ID = 'group.pro.GoalAchieverAI'

// Key for widget completions from widget to app
const WIDGET_COMPLETIONS_KEY = '@goals_ai:widget_completions'

interface WidgetCompletion {
  taskId: string
  taskTitle: string
  completedAt: string
  source: 'widget'
  action: 'complete' | 'uncomplete'
}

class WidgetSyncService {
  private syncInterval: NodeJS.Timeout | null = null
  private isProcessingCompletions = false

  /**
   * Start monitoring for widget completions and sync them to database
   */
  startCompletionSync() {
    if (this.syncInterval) return

    // Check for completions every 1 second for more responsive sync
    this.syncInterval = setInterval(() => {
      this.processWidgetCompletions()
    }, 1000)

    console.log('📱 Widget completion sync started')
  }

  /**
   * Stop monitoring widget completions
   */
  stopCompletionSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('📱 Widget completion sync stopped')
    }
  }

  /**
   * Process completions from widget and sync to database
   */
  private async processWidgetCompletions() {
    if (this.isProcessingCompletions) return
    this.isProcessingCompletions = true

    try {
      console.log('🔍 [Widget Sync] Checking for widget completions...')
      const completions = await this.getWidgetCompletions()
      
      if (completions.length === 0) {
        console.log('🔍 [Widget Sync] No completions found')
        this.isProcessingCompletions = false
        return
      }

      console.log(`🔄 [Widget Sync] Processing ${completions.length} widget completions:`, completions)

      for (const completion of completions) {
        console.log(`🔄 [Widget Sync] Processing completion for task: ${completion.taskId} (${completion.action})`)
        await this.syncCompletionToDatabase(completion)
      }

      // Clear processed completions
      await this.clearWidgetCompletions()
      
      console.log('✅ [Widget Sync] Widget completions processed and cleared successfully')
    } catch (error) {
      console.error('❌ [Widget Sync] Failed to process widget completions:', error)
    } finally {
      this.isProcessingCompletions = false
    }
  }

  /**
   * Get completions from App Group storage
   */
  private async getWidgetCompletions(): Promise<WidgetCompletion[]> {
    try {
      if (Platform.OS === 'ios' && UserDefaultsManager && UserDefaultsManager.getStringForAppGroup) {
        const completionsData = await UserDefaultsManager.getStringForAppGroup(WIDGET_COMPLETIONS_KEY, APP_GROUP_ID)
        if (completionsData) {
          console.log('📱 Raw completions data from widget:', completionsData)
          
          // Handle both string and already-parsed data
          let parsed: WidgetCompletion[]
          if (typeof completionsData === 'string') {
            try {
              parsed = JSON.parse(completionsData) as WidgetCompletion[]
            } catch (parseError) {
              console.error('❌ Failed to parse completions JSON:', parseError)
              return []
            }
          } else {
            // Data is already parsed (shouldn't happen but defensive)
            parsed = completionsData as WidgetCompletion[]
          }
          
          console.log('📱 Parsed completions:', parsed)
          
          // Validate the data structure
          if (!Array.isArray(parsed)) {
            console.error('❌ Completions data is not an array:', parsed)
            return []
          }
          
          return parsed.filter(completion => 
            completion && 
            completion.taskId && 
            completion.action && 
            ['complete', 'uncomplete'].includes(completion.action)
          )
        }
      } else {
        const completionsData = await AsyncStorage.getItem(WIDGET_COMPLETIONS_KEY)
        if (completionsData) {
          return JSON.parse(completionsData) as WidgetCompletion[]
        }
      }
    } catch (error) {
      console.error('❌ Failed to get widget completions:', error)
    }
    
    return []
  }

  /**
   * Sync a single completion to the database
   */
  private async syncCompletionToDatabase(completion: WidgetCompletion) {
    try {
      if (!database) {
        console.error('❌ Database not initialized')
        return
      }

      console.log(`🔄 [Widget Sync] Looking for task: ${completion.taskId}`)
      
      let task: Task | null = null
      try {
        task = await database.collections
          .get<Task>('tasks')
          .find(completion.taskId)
      } catch (findError) {
        console.warn(`❌ Task ${completion.taskId} not found in database:`, findError)
        return
      }

      if (!task) {
        console.warn(`❌ Task ${completion.taskId} not found in database`)
        return
      }

      const isCompleted = completion.action === 'complete'
      console.log(`🔄 [Widget Sync] Task current state: ${task.isComplete}, target state: ${isCompleted}`)
      
      if (task.isComplete !== isCompleted) {
        await database!.write(async () => {
          await task!.update((updatedTask: Task) => {
            (updatedTask._raw as any).is_complete = isCompleted
            ;(updatedTask._raw as any).completed_at = isCompleted ? Date.now() : null
          })
        })

        console.log(`✅ [Widget Sync] Task "${completion.taskTitle}" ${completion.action}d via widget`)
        
        // Force sync updated data back to widget immediately
        await this.forceSyncToWidget()
      } else {
        console.log(`ℹ️ [Widget Sync] Task "${completion.taskTitle}" already in target state`)
      }
    } catch (error) {
      console.error(`❌ [Widget Sync] Failed to sync completion for task ${completion.taskId}:`, error)
    }
  }

  /**
   * Clear processed completions from App Group storage
   */
  private async clearWidgetCompletions() {
    try {
      if (Platform.OS === 'ios' && UserDefaultsManager && UserDefaultsManager.removeKeyForAppGroup) {
        await UserDefaultsManager.removeKeyForAppGroup(WIDGET_COMPLETIONS_KEY, APP_GROUP_ID)
      } else {
        await AsyncStorage.removeItem(WIDGET_COMPLETIONS_KEY)
      }
    } catch (error) {
      console.error('Failed to clear widget completions:', error)
    }
  }

  /**
   * Force sync current tasks to widget immediately
   */
  async forceSyncToWidget() {
    try {
      if (!database) {
        console.error('Database not initialized')
        return
      }

      // Get today's tasks
      const today = new Date()
      const startOfDay = new Date(today)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      // Get all incomplete tasks and filter for today in JavaScript
      // (WatermelonDB stores scheduledDate as ISO string, not timestamp)
      const allIncompleteTasks = await database.collections
        .get<Task>('tasks')
        .query(
          Q.where('is_complete', false),
          Q.where('scheduled_date', Q.notEq(null))
        )
        .fetch()

      // Filter for today's tasks
      const todaysTasks = allIncompleteTasks.filter((task: Task) => {
        if (!task.scheduledDate) return false
        const taskDate = new Date(task.scheduledDate)
        return (
          taskDate.getFullYear() === today.getFullYear() &&
          taskDate.getMonth() === today.getMonth() &&
          taskDate.getDate() === today.getDate()
        )
      })

      const frogTask = todaysTasks.find((task: Task) => task.isFrog)
      const regularTasks = todaysTasks.filter((task: Task) => !task.isFrog)

      await widgetDataService.updateWidgetData(frogTask || null, regularTasks)
      console.log('🔄 Force synced tasks to widget')
    } catch (error) {
      console.error('Failed to force sync to widget:', error)
    }
  }
}

export const widgetSyncService = new WidgetSyncService()
