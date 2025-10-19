import database from '../db'
import { authService } from './authService'
import { subscriptionService } from './subscriptionService'
import { syncService } from './syncService'

interface UsageRecord {
  userId: string
  subscriptionTier: string
  sparkAiVoiceInputsUsed: number
  sparkAiVisionImagesUsed: number
  activeGoalsCount: number
  periodStart: Date
  periodEnd?: Date
}

class UsageTrackingService {
  private currentPeriodStart: Date | null = null

  // Get current billing period start (monthly reset)
  private getCurrentPeriodStart(): Date {
    if (this.currentPeriodStart) return this.currentPeriodStart

    const now = new Date()
    // Reset on the 1st of each month
    this.currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return this.currentPeriodStart
  }

  // Get or create usage record for current user and period
  private async getCurrentUsageRecord(): Promise<any | null> {
    if (!database) {
      console.warn('Database not available for usage tracking')
      return null
    }

    const userId = authService.getEffectiveUserId()
    if (!userId) {
      console.warn('No user ID available for usage tracking')
      return null
    }

    const currentTier = subscriptionService.getCurrentTier()
    if (!currentTier) {
      console.warn('No subscription tier available for usage tracking')
      return null
    }

    const periodStart = this.getCurrentPeriodStart()
    
    try {
      const usageCollection = database.get('subscription_usage')
      
      // Find existing usage record for current period
      const allUsage = await usageCollection
        .query()
        .fetch()

      // Filter for current user and period (WatermelonDB doesn't support complex where clauses)
      const existingUsage = allUsage.find(usage => 
        (usage as any).userId === userId && 
        (usage as any).periodStart?.getTime() === periodStart.getTime()
      )

      if (existingUsage) {
        return existingUsage
      }

      // Create new usage record for current period
      const newUsage = await database.write(async () => {
        return await usageCollection.create((usage: any) => {
          usage.userId = userId
          usage.subscriptionTier = currentTier.id.replace('tier_', '') // Remove 'tier_' prefix
          usage.sparkAiVoiceInputsUsed = 0
          usage.sparkAiVisionImagesUsed = 0
          usage.activeGoalsCount = 0
          usage.periodStart = periodStart
          usage.periodEnd = null // Open-ended until next period
        })
      })

      console.log('✅ Created new usage record for period:', periodStart.toISOString())
      
      // Schedule sync to push to Supabase
      syncService.scheduleSync(1000)
      
      return newUsage

    } catch (error) {
      console.error('❌ Failed to get/create usage record:', error)
      return null
    }
  }

  // Track Spark AI voice input usage
  async trackVoiceInputUsage(): Promise<boolean> {
    try {
      const usageRecord = await this.getCurrentUsageRecord()
      if (!usageRecord) return false

      // Check if user can use voice input before incrementing
      const currentUsage = (usageRecord as any).sparkAiVoiceInputsUsed
      if (!subscriptionService.canUseSparkAIVoice(currentUsage)) {
        console.warn('⚠️ Voice input usage limit reached')
        return false
      }

      // Increment usage counter
      await database!.write(async () => {
        await usageRecord.update((usage: any) => {
          usage.sparkAiVoiceInputsUsed = currentUsage + 1
        })
      })

      console.log('📊 Voice input usage tracked:', currentUsage + 1)
      
      // Schedule sync to push to Supabase
      syncService.scheduleSync(2000)
      
      return true

    } catch (error) {
      console.error('❌ Failed to track voice input usage:', error)
      return false
    }
  }

  // Track Spark AI vision image generation usage
  async trackVisionImageUsage(): Promise<boolean> {
    try {
      const usageRecord = await this.getCurrentUsageRecord()
      if (!usageRecord) return false

      // Check if user can generate vision image before incrementing
      const currentUsage = (usageRecord as any).sparkAiVisionImagesUsed
      if (!subscriptionService.canUseSparkAIVision(currentUsage)) {
        console.warn('⚠️ Vision image usage limit reached')
        return false
      }

      // Increment usage counter
      await database!.write(async () => {
        await usageRecord.update((usage: any) => {
          usage.sparkAiVisionImagesUsed = currentUsage + 1
        })
      })

      console.log('📊 Vision image usage tracked:', currentUsage + 1)
      
      // Schedule sync to push to Supabase
      syncService.scheduleSync(2000)
      
      return true

    } catch (error) {
      console.error('❌ Failed to track vision image usage:', error)
      return false
    }
  }

  // Update active goals count
  async updateActiveGoalsCount(): Promise<void> {
    try {
      if (!database) return

      const userId = authService.getEffectiveUserId()
      if (!userId) return

      const usageRecord = await this.getCurrentUsageRecord()
      if (!usageRecord) return

      // Count active (non-completed) goals for user
      const goalsCollection = database.get('goals')
      const allGoals = await goalsCollection
        .query()
        .fetch()
      
      // Filter for current user's active goals
      const activeGoals = allGoals.filter(goal => 
        (goal as any).userId === userId && 
        !(goal as any).isCompleted
      )

      const activeGoalsCount = activeGoals.length

      // Update usage record with current active goals count
      await database.write(async () => {
        await usageRecord.update((usage: any) => {
          usage.activeGoalsCount = activeGoalsCount
        })
      })

      console.log('📊 Active goals count updated:', activeGoalsCount)
      
      // Schedule sync to push to Supabase
      syncService.scheduleSync(2000)

    } catch (error) {
      console.error('❌ Failed to update active goals count:', error)
    }
  }

  // Get current usage statistics
  async getCurrentUsage(): Promise<{
    voiceInputsUsed: number
    visionImagesUsed: number
    activeGoalsCount: number
    voiceInputsRemaining: number
    visionImagesRemaining: number
    goalsRemaining: number
  } | null> {
    try {
      const usageRecord = await this.getCurrentUsageRecord()
      if (!usageRecord) return null

      const currentTier = subscriptionService.getCurrentTier()
      if (!currentTier) return null

      const voiceInputsUsed = (usageRecord as any).sparkAiVoiceInputsUsed
      const visionImagesUsed = (usageRecord as any).sparkAiVisionImagesUsed
      const activeGoalsCount = (usageRecord as any).activeGoalsCount

      return {
        voiceInputsUsed,
        visionImagesUsed,
        activeGoalsCount,
        voiceInputsRemaining: Math.max(0, currentTier.sparkAIVoiceInputs - voiceInputsUsed),
        visionImagesRemaining: Math.max(0, currentTier.sparkAIVisionImages - visionImagesUsed),
        goalsRemaining: currentTier.maxGoals === null ? -1 : Math.max(0, currentTier.maxGoals - activeGoalsCount)
      }

    } catch (error) {
      console.error('❌ Failed to get current usage:', error)
      return null
    }
  }

  // Check if user can perform specific action
  async canPerformAction(action: 'voice_input' | 'vision_image' | 'create_goal'): Promise<boolean> {
    try {
      const usageRecord = await this.getCurrentUsageRecord()
      if (!usageRecord) return false

      const voiceInputsUsed = (usageRecord as any).sparkAiVoiceInputsUsed
      const visionImagesUsed = (usageRecord as any).sparkAiVisionImagesUsed
      const activeGoalsCount = (usageRecord as any).activeGoalsCount

      switch (action) {
        case 'voice_input':
          return subscriptionService.canUseSparkAIVoice(voiceInputsUsed)
        case 'vision_image':
          return subscriptionService.canUseSparkAIVision(visionImagesUsed)
        case 'create_goal':
          return subscriptionService.canCreateGoal(activeGoalsCount)
        default:
          return false
      }

    } catch (error) {
      console.error('❌ Failed to check action permission:', error)
      return false
    }
  }

  // Reset usage for new billing period (called monthly)
  async resetUsageForNewPeriod(): Promise<void> {
    try {
      if (!database) return

      const userId = authService.getEffectiveUserId()
      if (!userId) return

      // Close current period
      const usageCollection = database.get('subscription_usage')
      const allUsage = await usageCollection
        .query()
        .fetch()
      
      // Filter for current user's open period
      const currentUsage = allUsage.filter(usage => 
        (usage as any).userId === userId && 
        !(usage as any).periodEnd // Open period (null/undefined)
      )

      if (currentUsage.length > 0) {
        const now = new Date()
        await database.write(async () => {
          await currentUsage[0].update((usage: any) => {
            usage.periodEnd = now
          })
        })
      }

      // Reset period start for new period
      this.currentPeriodStart = null

      console.log('🔄 Usage reset for new billing period')
      
      // Schedule sync to push to Supabase
      syncService.scheduleSync(1000)

    } catch (error) {
      console.error('❌ Failed to reset usage for new period:', error)
    }
  }
}

export const usageTrackingService = new UsageTrackingService()
