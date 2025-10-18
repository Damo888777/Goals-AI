import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class SubscriptionUsage extends Model {
  static table = 'subscription_usage'

  @field('user_id') userId!: string
  @field('subscription_tier') subscriptionTier!: string // 'starter', 'achiever', 'visionary'
  @field('spark_ai_voice_inputs_used') sparkAiVoiceInputsUsed!: number
  @field('spark_ai_vision_images_used') sparkAiVisionImagesUsed!: number
  @field('active_goals_count') activeGoalsCount!: number
  @date('period_start') periodStart!: Date
  @date('period_end') periodEnd?: Date

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  // Helper methods for subscription limits
  get voiceInputLimit(): number {
    switch (this.subscriptionTier) {
      case 'starter': return 40
      case 'achiever': return 150
      case 'visionary': return 500
      default: return 0
    }
  }

  get visionImageLimit(): number {
    switch (this.subscriptionTier) {
      case 'starter': return 10
      case 'achiever': return 20
      case 'visionary': return 60
      default: return 0
    }
  }

  get goalLimit(): number {
    switch (this.subscriptionTier) {
      case 'starter': return 3
      case 'achiever': return 10
      case 'visionary': return -1 // Unlimited
      default: return 0
    }
  }

  get hasWidgetAccess(): boolean {
    return ['achiever', 'visionary'].includes(this.subscriptionTier)
  }

  // Usage check methods
  get canCreateMoreGoals(): boolean {
    if (this.goalLimit === -1) return true // Unlimited
    return this.activeGoalsCount < this.goalLimit
  }

  get canUseVoiceInput(): boolean {
    return this.sparkAiVoiceInputsUsed < this.voiceInputLimit
  }

  get canGenerateVisionImage(): boolean {
    return this.sparkAiVisionImagesUsed < this.visionImageLimit
  }

  get voiceInputsRemaining(): number {
    return Math.max(0, this.voiceInputLimit - this.sparkAiVoiceInputsUsed)
  }

  get visionImagesRemaining(): number {
    return Math.max(0, this.visionImageLimit - this.sparkAiVisionImagesUsed)
  }

  get goalsRemaining(): number {
    if (this.goalLimit === -1) return -1 // Unlimited
    return Math.max(0, this.goalLimit - this.activeGoalsCount)
  }

  // Usage percentage methods
  get voiceInputUsagePercentage(): number {
    if (this.voiceInputLimit === 0) return 0
    return Math.min(100, (this.sparkAiVoiceInputsUsed / this.voiceInputLimit) * 100)
  }

  get visionImageUsagePercentage(): number {
    if (this.visionImageLimit === 0) return 0
    return Math.min(100, (this.sparkAiVisionImagesUsed / this.visionImageLimit) * 100)
  }

  get goalUsagePercentage(): number {
    if (this.goalLimit === -1) return 0 // Unlimited
    if (this.goalLimit === 0) return 0
    return Math.min(100, (this.activeGoalsCount / this.goalLimit) * 100)
  }
}
