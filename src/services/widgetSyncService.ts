import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// Safe import for UserDefaults with fallback
let UserDefaults: any = null
try {
  if (Platform.OS === 'ios') {
    UserDefaults = require('react-native-userdefaults-ios').default
  }
} catch (error) {
  console.warn('UserDefaults iOS module not available in widgetSyncService, using fallback')
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

    // Check for completions every 2 seconds when app is active
    this.syncInterval = setInterval(() => {
      this.processWidgetCompletions()
    }, 2000)

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
      const completions = await this.getWidgetCompletions()
      if (completions.length === 0) {
        this.isProcessingCompletions = false
        return
      }

      console.log(`🔄 Processing ${completions.length} widget completions`)

      for (const completion of completions) {
        await this.syncCompletionToDatabase(completion)
      }

      // Clear processed completions
      await this.clearWidgetCompletions()
      
      console.log('✅ Widget completions processed successfully')
    } catch (error) {
      console.error('❌ Failed to process widget completions:', error)
    } finally {
      this.isProcessingCompletions = false
    }
  }

  /**
   * Get completions from App Group storage
   */
  private async getWidgetCompletions(): Promise<WidgetCompletion[]> {
    try {
      if (Platform.OS === 'ios' && UserDefaults && UserDefaults.getStringForAppGroup) {
        const completionsData = await UserDefaults.getStringForAppGroup(WIDGET_COMPLETIONS_KEY, APP_GROUP_ID)
        if (completionsData) {
          return JSON.parse(completionsData) as WidgetCompletion[]
        }
      } else {
        const completionsData = await AsyncStorage.getItem(WIDGET_COMPLETIONS_KEY)
        if (completionsData) {
          return JSON.parse(completionsData) as WidgetCompletion[]
        }
      }
    } catch (error) {
      console.error('Failed to get widget completions:', error)
    }
    
    return []
  }

  /**
   * Sync a single completion to the database
   */
  private async syncCompletionToDatabase(completion: WidgetCompletion) {
    try {
      if (!database) {
        console.error('Database not initialized')
        return
      }

      const task = await database.collections
        .get<Task>('tasks')
        .find(completion.taskId)

      if (!task) {
        console.warn(`Task ${completion.taskId} not found in database`)
        return
      }

      const isCompleted = completion.action === 'complete'
      
      if (task.isComplete !== isCompleted) {
        await database!.write(async () => {
          await task.update((updatedTask: Task) => {
            (updatedTask._raw as any).is_complete = isCompleted
            ;(updatedTask._raw as any).completed_at = isCompleted ? Date.now() : null
          })
        })

        console.log(`✅ Task "${completion.taskTitle}" ${completion.action}d via widget`)
      }
    } catch (error) {
      console.error(`Failed to sync completion for task ${completion.taskId}:`, error)
    }
  }

  /**
   * Clear processed completions from App Group storage
   */
  private async clearWidgetCompletions() {
    try {
      if (Platform.OS === 'ios' && UserDefaults && UserDefaults.removeItemForAppGroup) {
        await UserDefaults.removeItemForAppGroup(WIDGET_COMPLETIONS_KEY, APP_GROUP_ID)
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

      const todaysTasks = await database.collections
        .get<Task>('tasks')
        .query(
          Q.where('scheduled_date', Q.between(startOfDay.getTime(), endOfDay.getTime())),
          Q.where('is_complete', false)
        )
        .fetch()

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
