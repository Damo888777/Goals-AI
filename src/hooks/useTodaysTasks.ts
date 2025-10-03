import { useState, useEffect } from 'react'
import { DB_CONFIG } from '../db/config'
import { mockDatabase, MockTask } from '../db/mockDatabase'

export const useTodaysTasks = () => {
  const [todaysTasks, setTodaysTasks] = useState<MockTask[]>([])
  const [frogTask, setFrogTask] = useState<MockTask | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTodaysTasks = async () => {
    try {
      setIsLoading(true)
      
      if (!DB_CONFIG.USE_WATERMELON) {
        // Use mock database for Expo Go
        const tasks = await mockDatabase.getTodaysTasks()
        setTodaysTasks(tasks)
        setFrogTask(tasks.find(task => task.is_frog && !task.is_complete) || null)
      } else {
        // TODO: WatermelonDB implementation when enabled
        console.log('WatermelonDB not implemented yet')
      }
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTaskComplete = async (taskId: string) => {
    try {
      if (!DB_CONFIG.USE_WATERMELON) {
        const task = await mockDatabase.updateTask(taskId, { 
          is_complete: !todaysTasks.find(t => t.id === taskId)?.is_complete 
        })
        if (task) {
          setTodaysTasks(prev => prev.map(t => t.id === taskId ? task : t))
        }
      }
    } catch (error) {
      console.error('Error toggling task completion:', error)
      throw error
    }
  }

  const setFrogTaskById = async (taskId: string) => {
    try {
      if (!DB_CONFIG.USE_WATERMELON) {
        // First, remove frog status from all tasks
        const allTasks = await mockDatabase.getTasks()
        const today = new Date().toISOString().split('T')[0]
        
        for (const task of allTasks) {
          if (task.is_frog && task.scheduled_date?.startsWith(today)) {
            await mockDatabase.updateTask(task.id, { is_frog: false })
          }
        }
        
        // Then set the selected task as frog
        await mockDatabase.updateTask(taskId, { is_frog: true })
        
        await fetchTodaysTasks() // Refresh data
      }
    } catch (error) {
      console.error('Error setting frog task:', error)
      throw error
    }
  }

  const createTask = async (taskData: {
    title: string
    scheduledDate?: Date
    isFrog?: boolean
    goalId?: string
    milestoneId?: string
    notes?: string
    creationSource?: 'spark' | 'manual'
  }) => {
    try {
      if (!DB_CONFIG.USE_WATERMELON) {
        await mockDatabase.createTask({
          title: taskData.title,
          goal_id: taskData.goalId,
          milestone_id: taskData.milestoneId,
          notes: taskData.notes,
          scheduled_date: taskData.scheduledDate?.toISOString(),
          is_frog: taskData.isFrog || false,
          is_complete: false,
        })
        
        await fetchTodaysTasks() // Refresh data
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchTodaysTasks()
    
    // For mock database, we don't have real-time subscriptions
    // Just fetch once on mount
  }, [])

  return {
    todaysTasks,
    frogTask,
    isLoading,
    setFrogTask: setFrogTaskById,
    toggleTaskComplete,
    createTask,
    refreshTasks: fetchTodaysTasks
  }
}
