import AsyncStorage from '@react-native-async-storage/async-storage'
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
    // On iOS, this will use App Group shared container
    // On development/testing, falls back to AsyncStorage
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
      console.log('Widget data updated successfully:', widgetData)
    } catch (error) {
      console.error('Failed to update widget data:', error)
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
}

export const widgetDataService = new WidgetDataService()