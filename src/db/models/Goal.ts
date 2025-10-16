import { Model, Query } from '@nozbe/watermelondb'
import { field, json, children, date, relation } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import { soundService } from '../../services/soundService'

export default class Goal extends Model {
  static table = 'goals'
  static associations: Associations = {
    profile: { type: 'belongs_to', key: 'user_id' },
    milestones: { type: 'has_many', foreignKey: 'goal_id' },
    tasks: { type: 'has_many', foreignKey: 'goal_id' },
  }

  @field('user_id') userId!: string
  @field('title') title!: string
  @json('feelings', (json) => json) feelings?: string[] // Array of feeling strings
  @field('vision_image_url') visionImageUrl?: string
  @field('notes') notes?: string
  @field('is_completed') isCompleted!: boolean
  @field('completed_at') completedAt?: number // Unix timestamp
  @json('reflection_answers', (json) => json) reflectionAnswers?: {
    takeaways?: string;
    challengeConquered?: string;
    futureImprovement?: string;
  }
  @field('creation_source') creationSource!: 'spark' | 'manual'
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  @relation('profiles', 'user_id') profile!: any
  @children('milestones') milestones!: Query<any>
  @children('tasks') tasks!: Query<any>

  // Helper method to get parsed feelings
  get feelingsArray(): string[] {
    return this.feelings || []
  }

  // Helper method to set feelings
  setFeelings(feelings: string[]): void {
    this.feelings = feelings
  }

  // Helper method to get completion date
  get completionDate(): Date | null {
    return this.completedAt ? new Date(this.completedAt) : null
  }

  // Helper method to mark as completed
  async markCompleted(reflectionData?: string): Promise<void> {
    await this.update(() => {
      this.isCompleted = true
      this.completedAt = Date.now()
      // Store reflection data in notes field if provided
      if (reflectionData) {
        this.notes = this.notes ? `${this.notes}\n\n--- REFLECTION ---\n${reflectionData}` : `--- REFLECTION ---\n${reflectionData}`
      }
    })
    // Play success sound when goal is completed
    soundService.playSuccessSound()
  }

  // Helper method to check if created by Spark AI
  get isCreatedBySpark(): boolean {
    return this.creationSource === 'spark'
  }

  // Helper method to check if created manually
  get isCreatedManually(): boolean {
    return this.creationSource === 'manual'
  }
}
