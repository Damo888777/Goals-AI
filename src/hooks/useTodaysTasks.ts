import { useState, useEffect } from 'react'
import { DB_CONFIG } from '../db/config'
import { mockDatabase, MockTask } from '../db/mockDatabase'
import type { Task } from '../types'

export const useTodaysTasks = () => {
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([])
  const [frogTask, setFrogTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTodaysTasks = async () => {
    try {
      setIsLoading(true)
      
      if (!DB_CONFIG.USE_WATERMELON) {
        // Use mock database for Expo Go
        const mockTasks = await mockDatabase.getTodaysTasks()
        
        // Convert MockTask to Task
        const convertedTasks: Task[] = mockTasks.map((task: MockTask) => ({
          id: task.id,
          title: task.title,
          isFrog: task.is_frog,
          isComplete: task.is_complete,
          goalId: task.goal_id,
          milestoneId: task.milestone_id,
          scheduledDate: task.scheduled_date,
          notes: task.notes,
          creationSource: 'manual' as const,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
        }))
        
        setTodaysTasks(convertedTasks)
        setFrogTask(convertedTasks.find(task => task.isFrog && !task.isComplete) || null)
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
        const currentTask = todaysTasks.find(t => t.id === taskId)
        if (currentTask) {
          const updatedMockTask = await mockDatabase.updateTask(taskId, { 
            is_complete: !currentTask.isComplete 
          })
          if (updatedMockTask) {
            // Convert MockTask back to Task
            const convertedTask: Task = {
              id: updatedMockTask.id,
              title: updatedMockTask.title,
              isFrog: updatedMockTask.is_frog,
              isComplete: updatedMockTask.is_complete,
              goalId: updatedMockTask.goal_id,
              milestoneId: updatedMockTask.milestone_id,
              scheduledDate: updatedMockTask.scheduled_date,
              notes: updatedMockTask.notes,
              creationSource: 'manual' as const,
              createdAt: new Date(updatedMockTask.created_at),
              updatedAt: new Date(updatedMockTask.updated_at),
            }
            setTodaysTasks(prev => prev.map(t => t.id === taskId ? convertedTask : t))
          }
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
