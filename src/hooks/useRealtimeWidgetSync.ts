import { useEffect } from 'react'
import database from '../db'
import Task from '../db/models/Task'
import { Q } from '@nozbe/watermelondb'
import { widgetDataService } from '../services/widgetDataService'
import { widgetSyncService } from '../services/widgetSyncService'

/**
 * Real-time database observer hook for instant widget updates
 * Uses WatermelonDB observers to detect changes and immediately sync to widget
 */
export const useRealtimeWidgetSync = () => {
  useEffect(() => {
    let taskSubscription: (() => void) | undefined

    const setupRealtimeSync = async () => {
      try {
        if (!database) {
          console.error('Database not initialized')
          return
        }

        // Start widget completion sync service
        widgetSyncService.startCompletionSync()

        // Get today's date range as ISO strings (since database stores ISO strings)
        const today = new Date()
        const startOfDay = new Date(today)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)
        
        const startOfDayISO = startOfDay.toISOString()
        const endOfDayISO = endOfDay.toISOString()

        // Subscribe to real-time changes for today's tasks
        const tasksCollection = database.collections.get<Task>('tasks')
        
        console.log('📅 [Widget Sync] Looking for tasks between:', {
          startOfDay: startOfDayISO,
          endOfDay: endOfDayISO
        })
        
        const subscription = tasksCollection
          .query(
            Q.where('scheduled_date', Q.gte(startOfDayISO)),
            Q.where('scheduled_date', Q.lte(endOfDayISO))
          )
          .observeWithColumns(['title', 'is_complete', 'is_frog', 'scheduled_date'])
          .subscribe(async (tasks: Task[]) => {
            try {
              console.log('🔄 Real-time task change detected, updating widget...')
              console.log('📋 [Widget Sync] Found tasks:', tasks.length)
              
              // Log all tasks for debugging
              tasks.forEach((task, index) => {
                console.log(`📋 [Task ${index}] "${task.title}" - Complete: ${task.isComplete}, Frog: ${task.isFrog}, Date: ${task.scheduledDate ? new Date(task.scheduledDate).toISOString() : 'No date'}`)
              })
              
              // Filter incomplete tasks for widget display
              const incompleteTasks = tasks.filter((task: Task) => !task.isComplete)
              const frogTask = incompleteTasks.find((task: Task) => task.isFrog)
              const regularTasks = incompleteTasks.filter((task: Task) => !task.isFrog)
              
              console.log('📋 [Widget Sync] Filtered - Incomplete:', incompleteTasks.length, 'Frog:', !!frogTask, 'Regular:', regularTasks.length)

              // Update widget data immediately
              await widgetDataService.updateWidgetData(frogTask || null, regularTasks)
              
              console.log('✅ Widget updated via real-time observer')
            } catch (error) {
              console.error('❌ Failed to update widget via real-time observer:', error)
            }
          })

        taskSubscription = subscription.unsubscribe
        console.log('🔴 Real-time widget sync activated')
        
      } catch (error) {
        console.error('Failed to setup real-time widget sync:', error)
      }
    }

    setupRealtimeSync()

    // Cleanup function
    return () => {
      if (taskSubscription) {
        taskSubscription()
        console.log('🔴 Real-time widget sync deactivated')
      }
      widgetSyncService.stopCompletionSync()
    }
  }, [])

  // Return manual force sync function
  const forceSync = async () => {
    try {
      await widgetSyncService.forceSyncToWidget()
      console.log('🔄 Manual widget sync completed')
    } catch (error) {
      console.error('❌ Manual widget sync failed:', error)
    }
  }

  return { forceSync }
}
