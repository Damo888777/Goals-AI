import { Model, Query, Relation } from '@nozbe/watermelondb'
import { field, relation, children, date } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import Goal from './Goal'

export default class Milestone extends Model {
  static table = 'milestones'
  static associations: Associations = {
    profile: { type: 'belongs_to', key: 'user_id' },
    goal: { type: 'belongs_to', key: 'goal_id' },
    tasks: { type: 'has_many', foreignKey: 'milestone_id' },
  }

  @field('user_id') userId!: string
  @field('goal_id') goalId!: string
  @field('title') title!: string
  @field('target_date') targetDate?: string // ISO 8601 string
  @field('is_complete') isComplete!: boolean
  @field('creation_source') creationSource!: 'spark' | 'manual'
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  @relation('profiles', 'user_id') profile!: any
  @relation('goals', 'goal_id') goal!: Relation<Goal>
  @children('tasks') tasks!: Query<any>

  // Helper method to get target date as Date object
  get targetDateAsDate(): Date | null {
    return this.targetDate ? new Date(this.targetDate) : null
  }

  // Helper method to set target date from Date object
  setTargetDate(date: Date | null): void {
    this.targetDate = date ? date.toISOString() : undefined
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
