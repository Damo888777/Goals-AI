import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform, NativeModules } from 'react-native'
import UserDefaults from 'react-native-userdefaults-ios'
import Task from '../db/models/Task'

// App Group identifier - must match widget entitlements
const APP_GROUP_ID = 'group.pro.GoalAchieverAI'

// Key for shared data
const SHARED_TASKS_KEY = '@goals_ai:widget_tasks'

export interface WidgetTaskData {
  id: string
  title: string
  isCompleted: boolean
  isFrog: boolean
}

export interface WidgetData {
  frogTask: WidgetTaskData | null
  regularTasks: WidgetTaskData[]
  lastUpdated: string
}

class WidgetDataService {
  private async getSharedStorage() {
    // Use App Group UserDefaults on iOS for proper widget data sharing
    if (Platform.OS === 'ios') {
      return {
        setItem: async (key: string, value: string) => {
          try {
            await UserDefaults.setStringForAppGroup(key, value, APP_GROUP_ID)
          } catch (error) {
            console.warn('Failed to write to App Group, falling back to AsyncStorage:', error)
            await AsyncStorage.setItem(key, value)
          }
        },
        getItem: async (key: string) => {
          try {
            return await UserDefaults.getStringForAppGroup(key, APP_GROUP_ID)
          } catch (error) {
            console.warn('Failed to read from App Group, falling back to AsyncStorage:', error)
            return await AsyncStorage.getItem(key)
          }
        },
        removeItem: async (key: string) => {
          try {
            await UserDefaults.removeItemForAppGroup(key, APP_GROUP_ID)
          } catch (error) {
            console.warn('Failed to remove from App Group, falling back to AsyncStorage:', error)
            await AsyncStorage.removeItem(key)
          }
        }
      }
    }
    
    // Fallback to AsyncStorage for Android/development
    return AsyncStorage
  }

  async updateWidgetData(frogTask: Task | null, regularTasks: Task[]): Promise<void> {
    try {
      const storage = await this.getSharedStorage()
      
      const widgetData: WidgetData = {
        frogTask: frogTask ? {
          id: frogTask.id,
          title: frogTask.title,
          isCompleted: frogTask.isComplete,
          isFrog: frogTask.isFrog
        } : null,
        regularTasks: regularTasks.map(task => ({
          id: task.id,
          title: task.title,
          isCompleted: task.isComplete,
          isFrog: task.isFrog
        })),
        lastUpdated: new Date().toISOString()
      }

      await storage.setItem(SHARED_TASKS_KEY, JSON.stringify(widgetData))
      
      // Trigger widget reload on iOS
      if (Platform.OS === 'ios') {
        this.reloadWidgets()
      }
      
      console.log('Widget data updated successfully:', widgetData)
    } catch (error) {
      console.error('Failed to update widget data:', error)
    }
  }

  private async reloadWidgets(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        const { WidgetKitReloader } = NativeModules
        
        if (WidgetKitReloader?.reloadAllTimelines) {
          await WidgetKitReloader.reloadAllTimelines()
          console.log('✅ Widget timelines reloaded successfully')
        } else {
          // Suppress warning in development builds where widgets aren't available
          if (__DEV__) {
            console.log('WidgetKitReloader not available in development build')
          } else {
            console.warn('WidgetKitReloader not available, widgets may not update immediately')
          }
        }
      }
    } catch (error) {
      if (!__DEV__) {
        console.error('Failed to reload widgets:', error)
      }
    }
  }

  async getWidgetData(): Promise<WidgetData | null> {
    try {
      const storage = await this.getSharedStorage()
      const data = await storage.getItem(SHARED_TASKS_KEY)
      
      if (!data) {
        return null
      }

      return JSON.parse(data) as WidgetData
    } catch (error) {
      console.error('Failed to get widget data:', error)
      return null
    }
  }

  async clearWidgetData(): Promise<void> {
    try {
      const storage = await this.getSharedStorage()
      await storage.removeItem(SHARED_TASKS_KEY)
      console.log('Widget data cleared')
    } catch (error) {
      console.error('Failed to clear widget data:', error)
    }
  }

  // Method to mark task as completed - called from app
  async markTaskCompleted(taskId: string): Promise<void> {
    try {
      const currentData = await this.getWidgetData()
      if (!currentData) return

      // Update frog task if it matches
      if (currentData.frogTask?.id === taskId) {
        currentData.frogTask.isCompleted = true
      }

      // Update regular task if it matches
      const regularTask = currentData.regularTasks.find(task => task.id === taskId)
      if (regularTask) {
        regularTask.isCompleted = true
      }

      currentData.lastUpdated = new Date().toISOString()

      const storage = await this.getSharedStorage()
      await storage.setItem(SHARED_TASKS_KEY, JSON.stringify(currentData))
      console.log('Task marked as completed in widget data:', taskId)
    } catch (error) {
      console.error('Failed to mark task as completed in widget data:', error)
    }
  }

  // Method to sync widget changes back to WatermelonDB
  async syncWidgetChangesToDatabase(): Promise<string[]> {
    try {
      const currentData = await this.getWidgetData()
      if (!currentData) return []

      const completedTaskIds: string[] = []

      // Check frog task completion
      if (currentData.frogTask?.isCompleted) {
        completedTaskIds.push(currentData.frogTask.id)
      }

      // Check regular task completions
      currentData.regularTasks.forEach(task => {
        if (task.isCompleted) {
          completedTaskIds.push(task.id)
        }
      })

      return completedTaskIds
    } catch (error) {
      console.error('Failed to sync widget changes to database:', error)
      return []
    }
  }
}

export const widgetDataService = new WidgetDataService()