import { Model } from '@nozbe/watermelondb'
import { field, date, children } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'

export default class Profile extends Model {
  static table = 'profiles'
  static associations: Associations = {
    goals: { type: 'has_many', foreignKey: 'user_id' },
    milestones: { type: 'has_many', foreignKey: 'user_id' },
    tasks: { type: 'has_many', foreignKey: 'user_id' },
  }

  @field('email') email?: string
  @field('name') name?: string
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  @children('goals') goals!: any
  @children('milestones') milestones!: any
  @children('tasks') tasks!: any

  // Helper method to check if user is anonymous
  get isAnonymous(): boolean {
    return !this.email
  }
}
