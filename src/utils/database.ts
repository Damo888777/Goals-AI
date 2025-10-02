import { Q } from '@nozbe/watermelondb'
import database from '../db'
import { getCurrentUserId } from '../services/syncService'
import Goal from '../db/models/Goal'
import Milestone from '../db/models/Milestone'
import Task from '../db/models/Task'

// Database utility functions for common operations

// Goal utilities
export const goalUtils = {
  // Get all goals for current user
  async getAllGoals(): Promise<Goal[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const goalsCollection = database.get<Goal>('goals')
    return await goalsCollection
      .query(Q.where('user_id', userId))
      .fetch()
  },

  // Get completed goals
  async getCompletedGoals(): Promise<Goal[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const goalsCollection = database.get<Goal>('goals')
    return await goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('is_completed', true)
      )
      .fetch()
  },

  // Get active goals
  async getActiveGoals(): Promise<Goal[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const goalsCollection = database.get<Goal>('goals')
    return await goalsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('is_completed', false)
      )
      .fetch()
  },

  // Get goal with milestones and tasks
  async getGoalWithDetails(goalId: string): Promise<{
    goal: Goal
    milestones: Milestone[]
    tasks: Task[]
  } | null> {
    try {
      const goal = await database.get<Goal>('goals').find(goalId)
      const milestones = await goal.milestones.fetch()
      const tasks = await goal.tasks.fetch()

      return { goal, milestones, tasks }
    } catch {
      return null
    }
  },
}

// Milestone utilities
export const milestoneUtils = {
  // Get milestones for a goal
  async getMilestonesForGoal(goalId: string): Promise<Milestone[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const milestonesCollection = database.get<Milestone>('milestones')
    return await milestonesCollection
      .query(
        Q.where('user_id', userId),
        Q.where('goal_id', goalId)
      )
      .fetch()
  },

  // Get completed milestones for a goal
  async getCompletedMilestonesForGoal(goalId: string): Promise<Milestone[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const milestonesCollection = database.get<Milestone>('milestones')
    return await milestonesCollection
      .query(
        Q.where('user_id', userId),
        Q.where('goal_id', goalId),
        Q.where('is_complete', true)
      )
      .fetch()
  },

  // Get milestone progress percentage for a goal
  async getMilestoneProgress(goalId: string): Promise<number> {
    const allMilestones = await this.getMilestonesForGoal(goalId)
    const completedMilestones = await this.getCompletedMilestonesForGoal(goalId)

    if (allMilestones.length === 0) return 0
    return Math.round((completedMilestones.length / allMilestones.length) * 100)
  },
}

// Task utilities
export const taskUtils = {
  // Get all tasks for current user
  async getAllTasks(): Promise<Task[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const tasksCollection = database.get<Task>('tasks')
    return await tasksCollection
      .query(Q.where('user_id', userId))
      .fetch()
  },

  // Get tasks for today
  async getTodaysTasks(): Promise<Task[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const today = new Date().toISOString().split('T')[0]
    const tasksCollection = database.get<Task>('tasks')
    
    return await tasksCollection
      .query(
        Q.where('user_id', userId),
        Q.where('scheduled_date', Q.like(`${today}%`))
      )
      .fetch()
  },

  // Get today's frog task
  async getTodaysFrogTask(): Promise<Task | null> {
    const todaysTasks = await this.getTodaysTasks()
    return todaysTasks.find(task => task.isFrog) || null
  },

  // Get overdue tasks
  async getOverdueTasks(): Promise<Task[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const today = new Date().toISOString().split('T')[0]
    const tasksCollection = database.get<Task>('tasks')
    
    return await tasksCollection
      .query(
        Q.where('user_id', userId),
        Q.where('is_complete', false),
        Q.where('scheduled_date', Q.lt(today))
      )
      .fetch()
  },

  // Get upcoming tasks (next 7 days)
  async getUpcomingTasks(): Promise<Task[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const tasksCollection = database.get<Task>('tasks')
    
    return await tasksCollection
      .query(
        Q.where('user_id', userId),
        Q.where('is_complete', false),
        Q.where('scheduled_date', Q.gte(today.toISOString().split('T')[0])),
        Q.where('scheduled_date', Q.lte(nextWeek.toISOString().split('T')[0]))
      )
      .fetch()
  },

  // Get tasks for a specific goal
  async getTasksForGoal(goalId: string): Promise<Task[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const tasksCollection = database.get<Task>('tasks')
    return await tasksCollection
      .query(
        Q.where('user_id', userId),
        Q.where('goal_id', goalId)
      )
      .fetch()
  },

  // Get tasks for a specific milestone
  async getTasksForMilestone(milestoneId: string): Promise<Task[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const tasksCollection = database.get<Task>('tasks')
    return await tasksCollection
      .query(
        Q.where('user_id', userId),
        Q.where('milestone_id', milestoneId)
      )
      .fetch()
  },

  // Get task completion percentage for a goal
  async getTaskProgress(goalId: string): Promise<number> {
    const allTasks = await this.getTasksForGoal(goalId)
    const completedTasks = allTasks.filter(task => task.isComplete)

    if (allTasks.length === 0) return 0
    return Math.round((completedTasks.length / allTasks.length) * 100)
  },
}

// Statistics utilities
export const statsUtils = {
  // Get overall progress statistics
  async getOverallStats(): Promise<{
    totalGoals: number
    completedGoals: number
    totalMilestones: number
    completedMilestones: number
    totalTasks: number
    completedTasks: number
    todaysTasks: number
    completedTodaysTasks: number
    overdueTasks: number
  }> {
    const userId = await getCurrentUserId()
    if (!userId) {
      return {
        totalGoals: 0,
        completedGoals: 0,
        totalMilestones: 0,
        completedMilestones: 0,
        totalTasks: 0,
        completedTasks: 0,
        todaysTasks: 0,
        completedTodaysTasks: 0,
        overdueTasks: 0,
      }
    }

    const [
      allGoals,
      completedGoals,
      allMilestones,
      completedMilestones,
      allTasks,
      completedTasks,
      todaysTasks,
      overdueTasks
    ] = await Promise.all([
      goalUtils.getAllGoals(),
      goalUtils.getCompletedGoals(),
      database.get<Milestone>('milestones').query(Q.where('user_id', userId)).fetch(),
      database.get<Milestone>('milestones').query(Q.where('user_id', userId), Q.where('is_complete', true)).fetch(),
      taskUtils.getAllTasks(),
      database.get<Task>('tasks').query(Q.where('user_id', userId), Q.where('is_complete', true)).fetch(),
      taskUtils.getTodaysTasks(),
      taskUtils.getOverdueTasks(),
    ])

    const completedTodaysTasks = todaysTasks.filter(task => task.isComplete)

    return {
      totalGoals: allGoals.length,
      completedGoals: completedGoals.length,
      totalMilestones: allMilestones.length,
      completedMilestones: completedMilestones.length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      todaysTasks: todaysTasks.length,
      completedTodaysTasks: completedTodaysTasks.length,
      overdueTasks: overdueTasks.length,
    }
  },

  // Get streak data (consecutive days with completed tasks)
  async getTaskStreak(): Promise<number> {
    const userId = await getCurrentUserId()
    if (!userId) return 0

    const tasksCollection = database.get<Task>('tasks')
    let streak = 0
    let currentDate = new Date()

    // Check each day going backwards
    for (let i = 0; i < 365; i++) { // Max 1 year streak
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const dayTasks = await tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('scheduled_date', Q.like(`${dateStr}%`))
        )
        .fetch()

      const completedDayTasks = dayTasks.filter(task => task.isComplete)

      if (dayTasks.length > 0 && completedDayTasks.length === dayTasks.length) {
        streak++
      } else if (dayTasks.length > 0) {
        // If there were tasks but not all completed, break streak
        break
      }
      // If no tasks for the day, continue checking previous days

      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  },
}

// Data validation utilities
export const validationUtils = {
  // Validate goal data
  validateGoalData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Goal title is required')
    }

    if (data.title && data.title.length > 200) {
      errors.push('Goal title must be less than 200 characters')
    }

    if (data.feelings && !Array.isArray(data.feelings)) {
      errors.push('Feelings must be an array')
    }

    if (data.visionImageUrl && typeof data.visionImageUrl !== 'string') {
      errors.push('Vision image URL must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // Validate milestone data
  validateMilestoneData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Milestone title is required')
    }

    if (!data.goalId || typeof data.goalId !== 'string') {
      errors.push('Goal ID is required')
    }

    if (data.targetDate && !(data.targetDate instanceof Date)) {
      errors.push('Target date must be a Date object')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // Validate task data
  validateTaskData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Task title is required')
    }

    if (data.goalId && typeof data.goalId !== 'string') {
      errors.push('Goal ID must be a string')
    }

    if (data.milestoneId && typeof data.milestoneId !== 'string') {
      errors.push('Milestone ID must be a string')
    }

    if (data.scheduledDate && !(data.scheduledDate instanceof Date)) {
      errors.push('Scheduled date must be a Date object')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },
}
