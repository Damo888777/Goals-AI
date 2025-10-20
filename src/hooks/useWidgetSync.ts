import { useEffect } from 'react'
import { useTodaysTasks } from './useDatabase'
import { widgetDataService } from '../services/widgetDataService'

/**
 * Hook to keep widget data in sync with today's tasks
 * Call this hook in your main app component to ensure widgets always have current data
 */
export const useWidgetSync = () => {
  const { tasks, frogTask } = useTodaysTasks()

  useEffect(() => {
    const updateWidget = async () => {
      try {
        // Filter out completed tasks for widget display
        const incompleteTasks = tasks.filter(task => !task.isComplete)
        const incompleteFrogTask = frogTask && !frogTask.isComplete ? frogTask : null
        
        await widgetDataService.updateWidgetData(incompleteFrogTask, incompleteTasks)
        console.log('Widget data synced with current tasks')
      } catch (error) {
        console.error('Failed to sync widget data:', error)
      }
    }

    // Update widget data whenever tasks change
    updateWidget()
  }, [tasks, frogTask])

  // Return a manual sync function for when tasks are completed
  const syncWidget = async () => {
    try {
      const incompleteTasks = tasks.filter(task => !task.isComplete)
      const incompleteFrogTask = frogTask && !frogTask.isComplete ? frogTask : null
      
      await widgetDataService.updateWidgetData(incompleteFrogTask, incompleteTasks)
      console.log('Widget data manually synced')
    } catch (error) {
      console.error('Failed to manually sync widget data:', error)
    }
  }

  return { syncWidget }
}