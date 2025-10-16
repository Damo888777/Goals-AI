import database from '../db'
import { getCurrentUserId } from './syncService'
import Goal from '../db/models/Goal'
import Milestone from '../db/models/Milestone'
import Task from '../db/models/Task'

interface SparkAIResult {
  type: 'task' | 'goal' | 'milestone'
  title: string
  timestamp: string | null
}

class SparkIntegrationService {
  // Create items from Spark AI output with proper source tracking
  async createFromSparkAI(sparkResult: SparkAIResult): Promise<{
    success: boolean
    itemId?: string
    error?: string
  }> {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('User not authenticated')
      }

      if (!database) {
        throw new Error('Database not initialized')
      }

      let itemId: string

      await database.write(async () => {
        switch (sparkResult.type) {
          case 'goal':
            const goalsCollection = database!.get<Goal>('goals')
            const goal = await goalsCollection.create((goal) => {
              goal.userId = userId
              goal.title = sparkResult.title
              goal.feelings = []
              goal.isCompleted = false
              goal.creationSource = 'spark'
            })
            itemId = goal.id
            break

          case 'milestone':
            const milestonesCollection = database!.get<Milestone>('milestones')
            // For milestones, we need to associate with the most recent goal
            const recentGoal = await this.getMostRecentGoal(userId)
            if (!recentGoal) {
              throw new Error('No goal found to associate milestone with')
            }
            
            const milestone = await milestonesCollection.create((milestone) => {
              milestone.userId = userId
              milestone.goalId = recentGoal.id
              milestone.title = sparkResult.title
              milestone.isComplete = false
              milestone.creationSource = 'spark'
              if (sparkResult.timestamp) {
                milestone.targetDate = sparkResult.timestamp
              }
            })
            itemId = milestone.id
            break

          case 'task':
            const tasksCollection = database!.get<Task>('tasks')
            const task = await tasksCollection.create((task) => {
              task.userId = userId
              task.title = sparkResult.title
              task.isComplete = false
              task.isFrog = false
              task.creationSource = 'spark'
              if (sparkResult.timestamp) {
                task.scheduledDate = sparkResult.timestamp
              }
            })
            itemId = task.id
            break

          default:
            throw new Error(`Unknown item type: ${sparkResult.type}`)
        }
      })

      return {
        success: true,
        itemId: itemId!
      }
    } catch (error) {
      console.error('Error creating item from Spark AI:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get the most recent goal for milestone association
  private async getMostRecentGoal(userId: string): Promise<Goal | null> {
    try {
      if (!database) {
        throw new Error('Database not initialized')
      }
      
      const goalsCollection = database.get<Goal>('goals')
      const goals = await goalsCollection
        .query()
        .fetch()
      
      // Sort by creation date and get the most recent
      const sortedGoals = goals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return sortedGoals.length > 0 ? sortedGoals[0] : null
    } catch (error) {
      console.error('Error getting most recent goal:', error)
      return null
    }
  }

  // Get items created by Spark AI for analytics
  async getSparkCreatedItems(): Promise<{
    goals: Goal[]
    milestones: Milestone[]
    tasks: Task[]
  }> {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { goals: [], milestones: [], tasks: [] }
    }

    try {
      if (!database) {
        throw new Error('Database not initialized')
      }

      const [goals, milestones, tasks] = await Promise.all([
        database.get<Goal>('goals')
          .query()
          .fetch()
          .then(items => items.filter(item => (item as any).creationSource === 'spark')),
        database.get<Milestone>('milestones')
          .query()
          .fetch()
          .then(items => items.filter(item => (item as any).creationSource === 'spark')),
        database.get<Task>('tasks')
          .query()
          .fetch()
          .then(items => items.filter(item => (item as any).creationSource === 'spark'))
      ])

      return { goals, milestones, tasks }
    } catch (error) {
      console.error('Error getting Spark created items:', error)
      return { goals: [], milestones: [], tasks: [] }
    }
  }

  // Get statistics about Spark AI usage
  async getSparkStats(): Promise<{
    totalSparkItems: number
    totalManualItems: number
    sparkGoals: number
    sparkMilestones: number
    sparkTasks: number
    sparkUsagePercentage: number
  }> {
    const userId = await getCurrentUserId()
    if (!userId) {
      return {
        totalSparkItems: 0,
        totalManualItems: 0,
        sparkGoals: 0,
        sparkMilestones: 0,
        sparkTasks: 0,
        sparkUsagePercentage: 0
      }
    }

    try {
      if (!database) {
        throw new Error('Database not initialized')
      }

      const [allGoals, allMilestones, allTasks] = await Promise.all([
        database.get<Goal>('goals').query().fetch(),
        database.get<Milestone>('milestones').query().fetch(),
        database.get<Task>('tasks').query().fetch()
      ])

      const sparkGoals = allGoals.filter(item => (item as any).creationSource === 'spark').length
      const sparkMilestones = allMilestones.filter(item => (item as any).creationSource === 'spark').length
      const sparkTasks = allTasks.filter(item => (item as any).creationSource === 'spark').length

      const totalSparkItems = sparkGoals + sparkMilestones + sparkTasks
      const totalItems = allGoals.length + allMilestones.length + allTasks.length
      const totalManualItems = totalItems - totalSparkItems

      const sparkUsagePercentage = totalItems > 0 ? Math.round((totalSparkItems / totalItems) * 100) : 0

      return {
        totalSparkItems,
        totalManualItems,
        sparkGoals,
        sparkMilestones,
        sparkTasks,
        sparkUsagePercentage
      }
    } catch (error) {
      console.error('Error getting Spark stats:', error)
      return {
        totalSparkItems: 0,
        totalManualItems: 0,
        sparkGoals: 0,
        sparkMilestones: 0,
        sparkTasks: 0,
        sparkUsagePercentage: 0
      }
    }
  }
}

// Export singleton instance
export const sparkIntegrationService = new SparkIntegrationService()

// Hook for React components
import { useState, useEffect } from 'react'

export const useSparkStats = () => {
  const [stats, setStats] = useState({
    totalSparkItems: 0,
    totalManualItems: 0,
    sparkGoals: 0,
    sparkMilestones: 0,
    sparkTasks: 0,
    sparkUsagePercentage: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const refreshStats = async () => {
    setIsLoading(true)
    try {
      const newStats = await sparkIntegrationService.getSparkStats()
      setStats(newStats)
    } catch (error) {
      console.error('Error refreshing Spark stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshStats()
  }, [])

  return {
    stats,
    isLoading,
    refreshStats
  }
}
