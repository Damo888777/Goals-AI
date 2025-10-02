import { Model, Relation } from '@nozbe/watermelondb'
import { field, relation, date } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import Goal from './Goal'
import Milestone from './Milestone'

export default class Task extends Model {
  static table = 'tasks'
  static associations: Associations = {
    profile: { type: 'belongs_to', key: 'user_id' },
    goal: { type: 'belongs_to', key: 'goal_id' },
    milestone: { type: 'belongs_to', key: 'milestone_id' },
  }

  @field('user_id') userId!: string
  @field('goal_id') goalId?: string
  @field('milestone_id') milestoneId?: string
  @field('title') title!: string
  @field('notes') notes?: string
  @field('scheduled_date') scheduledDate?: string // ISO 8601 string
  @field('is_frog') isFrog!: boolean // "Eat the frog" - most important task
  @field('is_complete') isComplete!: boolean
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  @relation('profiles', 'user_id') profile!: any
  @relation('goals', 'goal_id') goal!: Relation<Goal>
  @relation('milestones', 'milestone_id') milestone!: Relation<Milestone>

  // Helper method to get scheduled date as Date object
  get scheduledDateAsDate(): Date | null {
    return this.scheduledDate ? new Date(this.scheduledDate) : null
  }

  // Helper method to set scheduled date from Date object
  setScheduledDate(date: Date | null): void {
    this.scheduledDate = date ? date.toISOString() : undefined
  }

  // Helper method to check if task is scheduled for today
  get isScheduledForToday(): boolean {
    if (!this.scheduledDate) return false
    const today = new Date()
    const scheduledDate = new Date(this.scheduledDate)
    return (
      today.getFullYear() === scheduledDate.getFullYear() &&
      today.getMonth() === scheduledDate.getMonth() &&
      today.getDate() === scheduledDate.getDate()
    )
  }
}
