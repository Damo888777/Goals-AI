import { useState, useEffect } from 'react'
import database from '../db'
import Task from '../db/models/Task'
import { getCurrentUserId } from '../services/syncService'

export const useTodaysTasks = () => {
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([])
  const [frogTask, setFrogTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTodaysTasks = async () => {
    try {
      setIsLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) return

      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      // Get all tasks scheduled for today
      const tasksCollection = database.get<Task>('tasks')
      const allTasks = await tasksCollection
        .query()
        .fetch()

      // Filter tasks for today
      const todaysTasksFiltered = allTasks.filter(task => {
        if (!task.scheduledDate) return false
        const taskDate = new Date(task.scheduledDate)
        return taskDate >= todayStart && taskDate < todayEnd
      })

      // Find the frog task (most important task for today)
      const frogTaskFound = todaysTasksFiltered.find(task => task.isFrog && !task.isComplete)

      setTodaysTasks(todaysTasksFiltered)
      setFrogTask(frogTaskFound || null)
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTaskComplete = async (taskId: string) => {
    try {
      await database.write(async () => {
        const task = await database.get<Task>('tasks').find(taskId)
        await task.update(() => {
          task.isComplete = !task.isComplete
        })
      })
    } catch (error) {
      console.error('Error toggling task completion:', error)
      throw error
    }
  }

  const setFrogTaskById = async (taskId: string) => {
    try {
      await database.write(async () => {
        // First, remove frog status from all tasks
        const allTasks = await database.get<Task>('tasks').query().fetch()
        await Promise.all(
          allTasks.map(task => 
            task.update(() => {
              task.isFrog = false
            })
          )
        )

        // Then set the selected task as frog
        const selectedTask = await database.get<Task>('tasks').find(taskId)
        await selectedTask.update(() => {
          selectedTask.isFrog = true
        })
      })

      await fetchTodaysTasks() // Refresh data
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
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('User not authenticated')

      await database.write(async () => {
        const tasksCollection = database.get<Task>('tasks')
        await tasksCollection.create((task) => {
          task.userId = userId
          task.title = taskData.title
          task.goalId = taskData.goalId
          task.milestoneId = taskData.milestoneId
          task.notes = taskData.notes
          task.setScheduledDate(taskData.scheduledDate || null)
          task.isFrog = taskData.isFrog || false
          task.isComplete = false
          ;(task as any).creationSource = taskData.creationSource || 'manual'
        })
      })

      await fetchTodaysTasks() // Refresh data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchTodaysTasks()

    // Set up real-time subscription for tasks
    const subscription = database.get<Task>('tasks')
      .query()
      .observe()
      .subscribe(() => {
        fetchTodaysTasks()
      })

    return () => subscription.unsubscribe()
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
