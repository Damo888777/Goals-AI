import { useEffect, useState } from 'react'
import { Q } from '@nozbe/watermelondb'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
    const initializeGoals = async () => {
      // 1. Load cached goals immediately for instant display
      try {
        const cachedGoals = await AsyncStorage.getItem('cached_goals')
        if (cachedGoals) {
          const parsedGoals = JSON.parse(cachedGoals)
          // Create mock Goal objects for compatibility with existing code
          const mockGoals = parsedGoals.map((goalData: any) => ({
            ...goalData,
            // Add any missing methods/properties that the UI might expect
            _raw: goalData, // WatermelonDB compatibility
            table: 'goals'
          }))
          setGoals(mockGoals as Goal[])
          console.log('Loaded cached goals:', parsedGoals.length)
        }
      } catch (error) {
        console.error('Error loading cached goals:', error)
      }

      // 2. Then fetch fresh data from database
      if (!database) {
        console.log('WatermelonDB not available, using cached goals only')
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

        const subscription = userGoals.subscribe(async (freshGoals) => {
          setGoals(freshGoals)
          setIsLoading(false)
          
          // 3. Cache the fresh data for next time (serialize only plain data)
          try {
            const serializedGoals = freshGoals.map(goal => ({
              id: goal.id,
              title: goal.title,
              notes: goal.notes,
              feelingsArray: goal.feelings,
              visionImageUrl: goal.visionImageUrl,
              isCompleted: goal.isCompleted,
              createdAt: goal.createdAt,
              updatedAt: goal.updatedAt,
              userId: goal.userId,
              creationSource: goal.creationSource
            }))
            await AsyncStorage.setItem('cached_goals', JSON.stringify(serializedGoals))
          } catch (error) {
            console.error('Error caching goals:', error)
          }
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching goals:', error)
        setIsLoading(false)
      }
    }

    initializeGoals()
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

    // Check if user can create more goals before proceeding
    try {
      const { usageTrackingService } = await import('../services/usageTrackingService');
      const canCreate = await usageTrackingService.canPerformAction('create_goal');
      if (!canCreate) {
        console.warn('⚠️ Goal creation limit reached');
        throw new Error('Goal creation limit reached for your subscription tier');
      }
    } catch (error) {
      console.error('❌ Failed to check goal creation limit:', error);
      throw error;
    }

    try {
      let newGoal: Goal;
      await database.write(async () => {
        const goalsCollection = database!.get<Goal>('goals')
        newGoal = await goalsCollection.create((goal) => {
          goal.userId = userId
          goal.title = goalData.title
          goal.setFeelings(goalData.feelings || [])
          goal.visionImageUrl = goalData.visionImageUrl
          goal.notes = goalData.notes
          goal.isCompleted = false
          goal.creationSource = goalData.creationSource || 'manual'
        })
        console.log('Goal created:', newGoal.id)
      })

      // Update active goals count in usage tracking (outside write transaction)
      try {
        const { usageTrackingService } = await import('../services/usageTrackingService');
        await usageTrackingService.updateActiveGoalsCount();
        console.log('📊 Active goals count updated after goal creation');
      } catch (error) {
        console.error('❌ Failed to update active goals count:', error);
      }
      
      // Update notification system with main goal for personalized notifications
      try {
        const { notificationService } = await import('../services/notificationService');
        await notificationService.updateMainGoal(goalData.title);
      } catch (error) {
        console.error('Failed to update main goal for notifications:', error);
      }
      
      // Schedule optimized sync after action
      setTimeout(() => {
        import('../services/syncService').then(({ syncService }) => {
          syncService.scheduleSync(1500) // Debounced sync
        })
      }, 100)
    } catch (error) {
      console.error('Error creating goal:', error)
      throw error
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
      
      // Update active goals count in usage tracking
      try {
        const { usageTrackingService } = await import('../services/usageTrackingService');
        await usageTrackingService.updateActiveGoalsCount();
        console.log('📊 Active goals count updated after goal deletion');
      } catch (error) {
        console.error('❌ Failed to update active goals count:', error);
      }
    })
  }

  const completeGoal = async (goalId: string) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    await database.write(async () => {
      const goal = await database!.get<Goal>('goals').find(goalId)
      await goal.markCompleted()
      
      // Update active goals count in usage tracking
      try {
        const { usageTrackingService } = await import('../services/usageTrackingService');
        await usageTrackingService.updateActiveGoalsCount();
        console.log('📊 Active goals count updated after goal completion');
      } catch (error) {
        console.error('❌ Failed to update active goals count:', error);
      }
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

  useEffect(() => {
    const fetchMilestones = async () => {
      if (!database) {
        console.log('WatermelonDB not available, using empty milestones array')
        setMilestones([])
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
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
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching milestones:', error)
        setMilestones([])
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
      const newMilestone = await milestonesCollection.create((milestone) => {
        milestone.userId = userId
        milestone.goalId = milestoneData.goalId
        milestone.title = milestoneData.title
        milestone.setTargetDate(milestoneData.targetDate || null)
        milestone.isComplete = false
        milestone.creationSource = milestoneData.creationSource || 'manual'
      })
      console.log('Milestone created:', newMilestone.id)
      
      // Trigger background sync after action
      setTimeout(() => {
        import('../services/syncService').then(({ syncService }) => {
          syncService.sync().catch(error => {
            console.log('Background sync after milestone creation failed (non-critical):', error.message)
          })
        })
      }, 500)
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
    createMilestone,
    updateMilestone,
    deleteMilestone,
    completeMilestone,
  }
}

// Hook for tasks
export const useTasks = (goalId?: string, milestoneId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const fetchTasks = async () => {
      if (!database) {
        console.log('WatermelonDB not available, using empty tasks array')
        setTasks([])
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
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
          })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching tasks:', error)
        setTasks([])
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
      
      // If creating a frog task, clear existing frog tasks
      if (taskData.isFrog) {
        const existingFrogTasks = await tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_frog', true),
            Q.where('is_complete', false)
          )
          .fetch()
        
        for (const existingFrogTask of existingFrogTasks) {
          await existingFrogTask.update(() => {
            existingFrogTask.isFrog = false
          })
        }
      }
      
      const newTask = await tasksCollection.create((task) => {
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
      console.log('Task created:', newTask.id)
      
      // Trigger background sync after action
      setTimeout(() => {
        import('../services/syncService').then(({ syncService }) => {
          syncService.scheduleSync(1500) // Debounced sync
        })
      }, 100)
    })
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!database) throw new Error('WatermelonDB not available')
    
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')
    
    await database.write(async () => {
      const task = await database!.get<Task>('tasks').find(taskId)
      
      // If trying to set this task as frog, check for existing frog tasks
      if (updates.isFrog === true) {
        const tasksCollection = database!.get<Task>('tasks')
        const existingFrogTasks = await tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_frog', true),
            Q.where('is_complete', false)
          )
          .fetch()
        
        // Clear all existing frog tasks (only one active frog allowed)
        for (const existingFrogTask of existingFrogTasks) {
          if (existingFrogTask.id !== taskId) {
            await existingFrogTask.update(() => {
              existingFrogTask.isFrog = false
            })
          }
        }
      }
      
      await task.update(() => {
        if (updates.title !== undefined) task.title = updates.title
        if (updates.notes !== undefined) task.notes = updates.notes
        if (updates.scheduledDate !== undefined) task.scheduledDate = updates.scheduledDate
        if (updates.isFrog !== undefined) task.isFrog = updates.isFrog
        if (updates.isComplete !== undefined) task.isComplete = updates.isComplete
        if (updates.goalId !== undefined) task.goalId = updates.goalId
        if (updates.milestoneId !== undefined) task.milestoneId = updates.milestoneId
        if (updates.updatedAt !== undefined) task.updatedAt = updates.updatedAt
      })
    })
    
    // If we updated the frog status, ensure widget data is refreshed
    if (updates.isFrog !== undefined) {
      try {
        const { widgetDataService } = await import('../services/widgetDataService')
        
        // Get the updated frog task and today's tasks
        const tasksCollection = database!.get<Task>('tasks')
        const [newFrogTask, todaysTasks] = await Promise.all([
          tasksCollection
            .query(
              Q.where('user_id', userId),
              Q.where('is_frog', true),
              Q.where('is_complete', false)
            )
            .fetch()
            .then(tasks => tasks[0] || null),
          tasksCollection
            .query(
              Q.where('user_id', userId),
              Q.where('is_complete', false),
              Q.where('scheduled_date', Q.gte(new Date().toISOString().split('T')[0])),
              Q.where('scheduled_date', Q.lte(new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]))
            )
            .fetch()
        ])
        
        await widgetDataService.updateWidgetData(newFrogTask, todaysTasks)
        console.log('✅ Widget data updated after frog task change')
      } catch (error) {
        console.error('❌ Failed to update widget data after task update:', error)
      }
    }
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
    
    let wasFrogTask = false
    
    await database.write(async () => {
      const task = await database!.get<Task>('tasks').find(taskId)
      wasFrogTask = task.isFrog
      
      await task.update(() => {
        task.isComplete = true
        task.completedAt = new Date()
        task.updatedAt = new Date()
        // When completing a frog task, clear the frog status so new frogs can be set
        if (task.isFrog) {
          task.isFrog = false
        }
      })
    })
    
    // Update notification system if this was a frog task
    if (wasFrogTask) {
      try {
        const { notificationScheduler } = await import('../services/notificationScheduler')
        await notificationScheduler.updateFrogStreak(true)
      } catch (error) {
        console.error('Failed to update frog streak:', error)
      }
    }
  }

  const checkExistingFrogTask = async (): Promise<Task | null> => {
    if (!database) return null
    
    const userId = await getCurrentUserId()
    if (!userId) return null
    
    try {
      const tasksCollection = database.get<Task>('tasks')
      const existingFrogTasks = await tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('is_frog', true),
          Q.where('is_complete', false)
        )
        .fetch()
      
      return existingFrogTasks[0] || null
    } catch (error) {
      console.error('Error checking existing frog task:', error)
      return null
    }
  }

  return {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    checkExistingFrogTask,
  }
}

// Hook for today's tasks

// Hook for completed tasks that were completed today AND scheduled for today
export const useTodaysCompletedTasks = () => {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])

  useEffect(() => {
    const fetchTodaysCompletedTasks = async () => {
      if (!database) {
        setCompletedTasks([])
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
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
          })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching today\'s completed tasks:', error)
        setCompletedTasks([])
      }
    }

    fetchTodaysCompletedTasks()
  }, [])

  return {
    completedTasks,
  }
}

export const useTodaysTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [frogTask, setFrogTask] = useState<Task | null>(null)

  useEffect(() => {
    const fetchTodaysTasks = async () => {
      if (!database) {
        console.log('WatermelonDB not available, using empty tasks array')
        setTasks([])
        setFrogTask(null)
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        return
      }

      try {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        
        const tasksCollection = database.get<Task>('tasks')
        
        // Separate queries for frog tasks and regular tasks
        const frogSubscription = tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_complete', false),
            Q.where('is_frog', true)
          )
          .observe()
          .subscribe(async (frogTasks) => {
            const newFrogTask = frogTasks[0] || null
            setFrogTask(newFrogTask)
            
            // Update widget data when frog task changes
            try {
              const { widgetDataService } = await import('../services/widgetDataService')
              await widgetDataService.updateWidgetData(newFrogTask, tasks)
            } catch (error) {
              console.error('Failed to update widget data:', error)
            }
          })

        const regularTasksSubscription = tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_complete', false),
            Q.where('is_frog', false), // Exclude frog tasks from regular tasks
            Q.where('scheduled_date', Q.gte(todayStart.toISOString())),
            Q.where('scheduled_date', Q.lte(todayEnd.toISOString()))
          )
          .observe()
          .subscribe(async (todaysTasks) => {
            setTasks(todaysTasks)
            
            // Update widget data whenever tasks change
            try {
              const { widgetDataService } = await import('../services/widgetDataService')
              await widgetDataService.updateWidgetData(frogTask, todaysTasks)
            } catch (error) {
              console.error('Failed to update widget data:', error)
            }
          })

        return () => {
          frogSubscription.unsubscribe()
          regularTasksSubscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error fetching today\'s tasks:', error)
        setTasks([])
        setFrogTask(null)
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
    setFrogTaskForToday,
  }
}

// Hook for vision images
export const useVisionImages = () => {
  const [visionImages, setVisionImages] = useState<VisionImage[]>([])

  useEffect(() => {
    if (!database) {
      return
    }

    let subscription: any = null

    const loadVisionImages = async () => {
      if (!database) {
        return
      }

      const visionImagesCollection = database.get<VisionImage>('vision_images')
      const currentUserId = await getCurrentUserId()

      if (!currentUserId) {
        return
      }

      subscription = visionImagesCollection
        .query(Q.where('user_id', currentUserId))
        .observe()
        .subscribe((images) => {
          setVisionImages(images)
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
    addVisionImage,
    deleteVisionImage,
  }
}
