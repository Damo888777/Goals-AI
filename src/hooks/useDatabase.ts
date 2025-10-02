import { useEffect, useState } from 'react'
import { Q } from '@nozbe/watermelondb'
import database from '../db'
import { authService, AuthUser } from '../services/authService'
import { syncService, getCurrentUserId } from '../services/syncService'
import Goal from '../db/models/Goal'
import Milestone from '../db/models/Milestone'
import Task from '../db/models/Task'
import Profile from '../db/models/Profile'

// Hook for authentication state
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth
    authService.initialize().then((user) => {
      setUser(user)
      setIsLoading(false)
    })

    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const signInAnonymously = async () => {
    setIsLoading(true)
    try {
      const user = await authService.signInAnonymously()
      setUser(user)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      await authService.signOut()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: authService.isAuthenticated(),
    isAnonymous: authService.isAnonymous(),
    signInAnonymously,
    signOut,
  }
}

// Hook for sync status
export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const sync = async () => {
    setIsSyncing(true)
    try {
      await syncService.sync()
      setLastSyncTime(new Date())
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    isSyncing,
    lastSyncTime,
    sync,
  }
}

// Hook for goals
export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGoals = async () => {
      const userId = await getCurrentUserId()
      if (!userId) return

      const goalsCollection = database.get<Goal>('goals')
      const userGoals = await goalsCollection
        .query(Q.where('user_id', userId))
        .observe()

      const subscription = userGoals.subscribe((goals) => {
        setGoals(goals)
        setIsLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    fetchGoals()
  }, [])

  const createGoal = async (goalData: {
    title: string
    feelings?: string[]
    visionImageUrl?: string
    notes?: string
    creationSource?: 'spark' | 'manual'
  }) => {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    await database.write(async () => {
      const goalsCollection = database.get<Goal>('goals')
      await goalsCollection.create((goal) => {
        goal.userId = userId
        goal.title = goalData.title
        goal.feelings = goalData.feelings || []
        goal.visionImageUrl = goalData.visionImageUrl
        goal.notes = goalData.notes
        goal.isCompleted = false
        goal.creationSource = goalData.creationSource || 'manual'
      })
    })
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    await database.write(async () => {
      const goal = await database.get<Goal>('goals').find(goalId)
      await goal.update(() => {
        Object.assign(goal, updates)
      })
    })
  }

  const deleteGoal = async (goalId: string) => {
    await database.write(async () => {
      const goal = await database.get<Goal>('goals').find(goalId)
      await goal.markAsDeleted()
    })
  }

  const completeGoal = async (goalId: string) => {
    await database.write(async () => {
      const goal = await database.get<Goal>('goals').find(goalId)
      await goal.markCompleted()
    })
  }

  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
  }
}

// Hook for milestones
export const useMilestones = (goalId?: string) => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMilestones = async () => {
      const userId = await getCurrentUserId()
      if (!userId) return

      const milestonesCollection = database.get<Milestone>('milestones')
      let query = milestonesCollection.query(Q.where('user_id', userId))
      
      if (goalId) {
        query = milestonesCollection.query(
          Q.where('user_id', userId),
          Q.where('goal_id', goalId)
        )
      }

      const subscription = query.observe().subscribe((milestones) => {
        setMilestones(milestones)
        setIsLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    fetchMilestones()
  }, [goalId])

  const createMilestone = async (milestoneData: {
    goalId: string
    title: string
    targetDate?: Date
    creationSource?: 'spark' | 'manual'
  }) => {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    await database.write(async () => {
      const milestonesCollection = database.get<Milestone>('milestones')
      await milestonesCollection.create((milestone) => {
        milestone.userId = userId
        milestone.goalId = milestoneData.goalId
        milestone.title = milestoneData.title
        milestone.setTargetDate(milestoneData.targetDate || null)
        milestone.isComplete = false
        milestone.creationSource = milestoneData.creationSource || 'manual'
      })
    })
  }

  const updateMilestone = async (milestoneId: string, updates: Partial<Milestone>) => {
    await database.write(async () => {
      const milestone = await database.get<Milestone>('milestones').find(milestoneId)
      await milestone.update(() => {
        Object.assign(milestone, updates)
      })
    })
  }

  const deleteMilestone = async (milestoneId: string) => {
    await database.write(async () => {
      const milestone = await database.get<Milestone>('milestones').find(milestoneId)
      await milestone.markAsDeleted()
    })
  }

  const completeMilestone = async (milestoneId: string) => {
    await database.write(async () => {
      const milestone = await database.get<Milestone>('milestones').find(milestoneId)
      await milestone.update(() => {
        milestone.isComplete = true
      })
    })
  }

  return {
    milestones,
    isLoading,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    completeMilestone,
  }
}

// Hook for tasks
export const useTasks = (goalId?: string, milestoneId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      const userId = await getCurrentUserId()
      if (!userId) return

      const tasksCollection = database.get<Task>('tasks')
      let queryConditions = [Q.where('user_id', userId)]
      
      if (goalId) {
        queryConditions.push(Q.where('goal_id', goalId))
      }
      
      if (milestoneId) {
        queryConditions.push(Q.where('milestone_id', milestoneId))
      }

      const subscription = tasksCollection
        .query(...queryConditions)
        .observe()
        .subscribe((tasks) => {
          setTasks(tasks)
          setIsLoading(false)
        })

      return () => subscription.unsubscribe()
    }

    fetchTasks()
  }, [goalId, milestoneId])

  const createTask = async (taskData: {
    title: string
    goalId?: string
    milestoneId?: string
    notes?: string
    scheduledDate?: Date
    isFrog?: boolean
    creationSource?: 'spark' | 'manual'
  }) => {
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
        task.creationSource = taskData.creationSource || 'manual'
      })
    })
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    await database.write(async () => {
      const task = await database.get<Task>('tasks').find(taskId)
      await task.update(() => {
        Object.assign(task, updates)
      })
    })
  }

  const deleteTask = async (taskId: string) => {
    await database.write(async () => {
      const task = await database.get<Task>('tasks').find(taskId)
      await task.markAsDeleted()
    })
  }

  const completeTask = async (taskId: string) => {
    await database.write(async () => {
      const task = await database.get<Task>('tasks').find(taskId)
      await task.update(() => {
        task.isComplete = true
      })
    })
  }

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  }
}

// Hook for today's tasks
export const useTodaysTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [frogTask, setFrogTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTodaysTasks = async () => {
      const userId = await getCurrentUserId()
      if (!userId) return

      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const tasksCollection = database.get<Task>('tasks')
      
      const subscription = tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('scheduled_date', Q.like(`${today}%`))
        )
        .observe()
        .subscribe((todaysTasks) => {
          setTasks(todaysTasks)
          setFrogTask(todaysTasks.find(task => task.isFrog) || null)
          setIsLoading(false)
        })

      return () => subscription.unsubscribe()
    }

    fetchTodaysTasks()
  }, [])

  const setFrogTaskForToday = async (taskId: string) => {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    await database.write(async () => {
      const tasksCollection = database.get<Task>('tasks')
      const today = new Date().toISOString().split('T')[0]
      
      // Clear existing frog task for today
      const existingFrogTasks = await tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('scheduled_date', Q.like(`${today}%`)),
          Q.where('is_frog', true)
        )
        .fetch()

      for (const task of existingFrogTasks) {
        await task.update(() => {
          task.isFrog = false
        })
      }

      // Set new frog task
      const newFrogTask = await tasksCollection.find(taskId)
      await newFrogTask.update(() => {
        newFrogTask.isFrog = true
      })
    })
  }

  return {
    tasks,
    frogTask,
    isLoading,
    setFrogTaskForToday,
  }
}
