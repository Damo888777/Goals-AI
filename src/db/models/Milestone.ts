import { Model, Query, Relation } from '@nozbe/watermelondb'
import { field, relation, children, date } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import Goal from './Goal'

export default class Milestone extends Model {
  static table = 'milestones'
  static associations: Associations = {
    goal: { type: 'belongs_to', key: 'goal_id' },
    tasks: { type: 'has_many', foreignKey: 'milestone_id' },
  }

  @field('title') title!: string
  @field('goal_id') goalId!: string
  @field('target_date') targetDate?: number // Unix timestamp
  @field('is_complete') isComplete!: boolean
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  @relation('goals', 'goal_id') goal!: Relation<Goal>
  @children('tasks') tasks!: Query<any>

  // Helper method to get target date as Date object
  get targetDateAsDate(): Date | null {
    return this.targetDate ? new Date(this.targetDate * 1000) : null
  }

  // Helper method to set target date from Date object
  setTargetDate(date: Date | null): void {
    this.targetDate = date ? Math.floor(date.getTime() / 1000) : undefined
  }
}
