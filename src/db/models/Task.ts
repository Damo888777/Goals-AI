import { Model, Relation } from '@nozbe/watermelondb'
import { field, relation, date } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import Goal from './Goal'
import Milestone from './Milestone'

export default class Task extends Model {
  static table = 'tasks'
  static associations: Associations = {
    goal: { type: 'belongs_to', key: 'goal_id' },
    milestone: { type: 'belongs_to', key: 'milestone_id' },
  }

  @field('title') title!: string
  @field('is_complete') isComplete!: boolean
  @field('goal_id') goalId?: string
  @field('milestone_id') milestoneId?: string
  @field('scheduled_date') scheduledDate?: number // Unix timestamp
  @field('is_frog') isFrog!: boolean // "Eat the frog" - most important task
  @field('notes') notes?: string
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  @relation('goals', 'goal_id') goal!: Relation<Goal>
  @relation('milestones', 'milestone_id') milestone!: Relation<Milestone>

  // Helper method to get scheduled date as Date object
  get scheduledDateAsDate(): Date | null {
    return this.scheduledDate ? new Date(this.scheduledDate * 1000) : null
  }

  // Helper method to set scheduled date from Date object
  setScheduledDate(date: Date | null): void {
    this.scheduledDate = date ? Math.floor(date.getTime() / 1000) : undefined
  }

  // Helper method to check if task is scheduled for today
  get isScheduledForToday(): boolean {
    if (!this.scheduledDate) return false
    const today = new Date()
    const scheduledDate = new Date(this.scheduledDate * 1000)
    return (
      today.getFullYear() === scheduledDate.getFullYear() &&
      today.getMonth() === scheduledDate.getMonth() &&
      today.getDate() === scheduledDate.getDate()
    )
  }
}
