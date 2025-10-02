import { Model, Query } from '@nozbe/watermelondb'
import { field, json, children, date } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'

export default class Goal extends Model {
  static table = 'goals'
  static associations: Associations = {
    milestones: { type: 'has_many', foreignKey: 'goal_id' },
    tasks: { type: 'has_many', foreignKey: 'goal_id' },
  }

  @field('title') title!: string
  @json('feelings', (json) => json) feelings?: string[] // Array of feeling strings
  @field('vision_image_url') visionImageUrl?: string
  @field('notes') notes?: string
  @field('is_completed') isCompleted!: boolean
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

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
}
