import { useEffect, useState } from 'react'
import { Q } from '@nozbe/watermelondb'
import database from '../db'
import { authService, AuthUser } from '../services/authService'
import { syncService, getCurrentUserId } from '../services/syncService'
import Goal from '../db/models/Goal'
import Milestone from '../db/models/Milestone'
import Task from '../db/models/Task'
import Profile from '../db/models/Profile'
import VisionImage from '../db/models/VisionImage'

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
      if (!database) {
        console.log('WatermelonDB not available, using empty goals array')
        setGoals([])
        setIsLoading(false)
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const goalsCollection = database.get<Goal>('goals')
        const userGoals = await goalsCollection
          .query(Q.where('user_id', userId))
          .observe()

        const subscription = userGoals.subscribe((goals) => {
          setGoals(goals)
          setIsLoading(false)
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching goals:', error)
        setGoals([])
        setIsLoading(false)
      }
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
    if (!database) {
      console.error('Database not available')
      return
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      console.error('No user ID available')
      return
    }

    try {
      await database.write(async () => {
        const goalsCollection = database!.get<Goal>('goals')
        const newGoal = await goalsCollection.create((goal) => {
          goal.userId = userId
          goal.title = goalData.title
          goal.setFeelings(goalData.feelings || [])
          goal.visionImageUrl = goalData.visionImageUrl
          goal.notes = goalData.notes
          goal.isCompleted = false
          goal.creationSource = goalData.creationSource || 'manual'
        })
        console.log('Goal created:', newGoal.id)
        
        // Trigger background sync after action
        setTimeout(() => {
          import('../services/syncService').then(({ syncService }) => {
            syncService.sync().catch(error => {
              console.log('Background sync after goal creation failed (non-critical):', error.message)
            })
          })
        }, 500)
      })
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!database) {
      console.error('Database not available')
      return
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      console.error('No user ID available')
      return
    }

    try {
      await database.write(async () => {
        const goal = await database!.get<Goal>('goals').find(goalId)
        await goal.update(() => {
          Object.assign(goal, updates)
        })
      })
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const goal = await database!.get<Goal>('goals').find(goalId)
      await goal.markAsDeleted()
    })
  }

  const completeGoal = async (goalId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const goal = await database!.get<Goal>('goals').find(goalId)
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
      if (!database) {
        console.log('WatermelonDB not available, using empty milestones array')
        setMilestones([])
        setIsLoading(false)
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
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
      } catch (error) {
        console.error('Error fetching milestones:', error)
        setMilestones([])
        setIsLoading(false)
      }
    }

    fetchMilestones()
  }, [goalId])

  const createMilestone = async (milestoneData: {
    goalId: string
    title: string
    targetDate?: Date
    creationSource?: 'spark' | 'manual'
  }) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    await database.write(async () => {
      const milestonesCollection = database!.get<Milestone>('milestones')
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
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const milestone = await database!.get<Milestone>('milestones').find(milestoneId)
      await milestone.update(() => {
        Object.assign(milestone, updates)
      })
    })
  }

  const deleteMilestone = async (milestoneId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const milestone = await database!.get<Milestone>('milestones').find(milestoneId)
      await milestone.markAsDeleted()
    })
  }

  const completeMilestone = async (milestoneId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const milestone = await database!.get<Milestone>('milestones').find(milestoneId)
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
      if (!database) {
        console.log('WatermelonDB not available, using empty tasks array')
        setTasks([])
        setIsLoading(false)
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
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
      } catch (error) {
        console.error('Error fetching tasks:', error)
        setTasks([])
        setIsLoading(false)
      }
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
    if (!database) throw new Error('WatermelonDB not available')
    
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    await database.write(async () => {
      const tasksCollection = database!.get<Task>('tasks')
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
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const task = await database!.get<Task>('tasks').find(taskId)
      await task.update(() => {
        Object.assign(task, updates)
      })
    })
  }

  const deleteTask = async (taskId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const task = await database!.get<Task>('tasks').find(taskId)
      await task.markAsDeleted()
    })
  }

  const completeTask = async (taskId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const task = await database!.get<Task>('tasks').find(taskId)
      await task.update(() => {
        task.isComplete = true
        task.completedAt = new Date()
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

// Hook for completed tasks that were completed today AND scheduled for today
export const useTodaysCompletedTasks = () => {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTodaysCompletedTasks = async () => {
      if (!database) {
        setCompletedTasks([])
        setIsLoading(false)
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        
        const tasksCollection = database.get<Task>('tasks')
        
        const subscription = tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_complete', true),
            Q.where('completed_at', Q.gte(todayStart.getTime())),
            Q.where('completed_at', Q.lte(todayEnd.getTime()))
          )
          .observe()
          .subscribe((tasks) => {
            setCompletedTasks(tasks)
            setIsLoading(false)
          })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching today\'s completed tasks:', error)
        setCompletedTasks([])
        setIsLoading(false)
      }
    }

    fetchTodaysCompletedTasks()
  }, [])

  return {
    completedTasks,
    isLoading
  }
}

export const useTodaysTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [frogTask, setFrogTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTodaysTasks = async () => {
      if (!database) {
        console.log('WatermelonDB not available, using empty tasks array')
        setTasks([])
        setFrogTask(null)
        setIsLoading(false)
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        
        const tasksCollection = database.get<Task>('tasks')
        
        const subscription = tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_complete', false),
            Q.where('scheduled_date', Q.gte(todayStart.toISOString())),
            Q.where('scheduled_date', Q.lte(todayEnd.toISOString()))
          )
          .observe()
          .subscribe((todaysTasks) => {
            setTasks(todaysTasks)
            setFrogTask(todaysTasks.find(task => task.isFrog) || null)
            setIsLoading(false)
          })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching today\'s tasks:', error)
        setTasks([])
        setFrogTask(null)
        setIsLoading(false)
      }
    }

    fetchTodaysTasks()
  }, [])

  const setFrogTaskForToday = async (taskId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    await database.write(async () => {
      const tasksCollection = database!.get<Task>('tasks')
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

// Hook for vision images
export const useVisionImages = () => {
  const [visionImages, setVisionImages] = useState<VisionImage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!database) {
      setIsLoading(false)
      return
    }

    let subscription: any = null

    const loadVisionImages = async () => {
      if (!database) {
        setIsLoading(false)
        return
      }

      const visionImagesCollection = database.get<VisionImage>('vision_images')
      const currentUserId = await getCurrentUserId()

      if (!currentUserId) {
        setIsLoading(false)
        return
      }

      subscription = visionImagesCollection
        .query(Q.where('user_id', currentUserId))
        .observe()
        .subscribe((images) => {
          setVisionImages(images)
          setIsLoading(false)
        })
    }

    loadVisionImages()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const addVisionImage = async (imageUri: string, aspectRatio: number, source: 'generated' | 'uploaded') => {
    if (!database) return

    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return

    const visionImagesCollection = database.get<VisionImage>('vision_images')

    await database.write(async () => {
      await visionImagesCollection.create((visionImage) => {
        visionImage.userId = currentUserId
        visionImage.imageUri = imageUri
        visionImage.aspectRatio = aspectRatio
        visionImage.source = source
      })
    })
  }

  const deleteVisionImage = async (imageId: string) => {
    if (!database) return

    const visionImagesCollection = database.get<VisionImage>('vision_images')

    await database.write(async () => {
      const visionImage = await visionImagesCollection.find(imageId)
      await visionImage.destroyPermanently()
    })
  }

  return {
    visionImages,
    isLoading,
    addVisionImage,
    deleteVisionImage,
  }
}
