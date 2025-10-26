import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform, NativeModules } from 'react-native'
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
  constructor() {
    // Verify native module is available at startup
    if (Platform.OS === 'ios') {
      const moduleAvailable = !!NativeModules.UserDefaultsManager
      console.log('🔍 [Widget Data Service] UserDefaultsManager module available:', moduleAvailable)
      if (moduleAvailable) {
        console.log('🔍 [Widget Data Service] Available methods:', Object.keys(NativeModules.UserDefaultsManager))
      }
    }
  }

  private async getSharedStorage() {
    // Use our custom UserDefaults bridge for App Group sharing on iOS
    if (Platform.OS === 'ios') {
      return {
        setItem: async (key: string, value: string) => {
          try {
            // Use our custom native UserDefaults bridge
            if (NativeModules.UserDefaultsManager?.setStringForAppGroup) {
              await NativeModules.UserDefaultsManager.setStringForAppGroup(key, value, APP_GROUP_ID)
              console.log('✅ [Widget Data] Written via custom UserDefaults bridge')
            } else {
              // Fallback to AsyncStorage if bridge not available
              await AsyncStorage.setItem(key, value)
              console.log('⚠️ [Widget Data] Written to AsyncStorage (bridge not available)')
            }
          } catch (error) {
            console.warn('❌ [Widget Data] Failed to write via bridge, using AsyncStorage fallback:', error)
            await AsyncStorage.setItem(key, value)
          }
        },
        getItem: async (key: string) => {
          try {
            if (NativeModules.UserDefaultsManager?.getStringForAppGroup) {
              const data = await NativeModules.UserDefaultsManager.getStringForAppGroup(key, APP_GROUP_ID)
              console.log('✅ [Widget Data] Read via custom UserDefaults bridge:', data ? 'found' : 'not found')
              return data
            } else {
              const data = await AsyncStorage.getItem(key)
              console.log('⚠️ [Widget Data] Read from AsyncStorage (bridge not available)')
              return data
            }
          } catch (error) {
            console.warn('❌ [Widget Data] Failed to read via bridge, using AsyncStorage fallback:', error)
            return await AsyncStorage.getItem(key)
          }
        },
        removeItem: async (key: string) => {
          try {
            if (NativeModules.UserDefaultsManager?.removeKeyForAppGroup) {
              await NativeModules.UserDefaultsManager.removeKeyForAppGroup(key, APP_GROUP_ID)
              console.log('✅ [Widget Data] Removed via custom UserDefaults bridge')
            } else {
              await AsyncStorage.removeItem(key)
              console.log('⚠️ [Widget Data] Removed from AsyncStorage (bridge not available)')
            }
          } catch (error) {
            console.warn('❌ [Widget Data] Failed to remove via bridge, using AsyncStorage fallback:', error)
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
      console.log('🔄 [Widget Data] Starting widget data update...')
      console.log('🔄 [Widget Data] Platform:', Platform.OS)
      console.log('🔄 [Widget Data] Frog task:', frogTask?.title || 'None')
      console.log('🔄 [Widget Data] Regular tasks count:', regularTasks.length)
      
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

      console.log('🔄 [Widget Data] Widget data to save:', JSON.stringify(widgetData, null, 2))
      
      await storage.setItem(SHARED_TASKS_KEY, JSON.stringify(widgetData))
      console.log('✅ [Widget Data] Data saved successfully to shared storage')
      
      // Verify data was written by reading it back
      const verifyData = await storage.getItem(SHARED_TASKS_KEY)
      console.log('🔍 [Widget Data] Verification read:', verifyData ? 'Data found' : 'No data found')
      
      // Trigger widget reload on iOS
      if (Platform.OS === 'ios') {
        this.reloadWidgets()
      }
      
      console.log('✅ [Widget Data] Widget data updated successfully')
    } catch (error) {
      console.error('❌ [Widget Data] Failed to update widget data:', error)
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