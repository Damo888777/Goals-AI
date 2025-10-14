import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class PomodoroSession extends Model {
  static table = 'pomodoro_sessions';

  @field('user_id') userId!: string;
  @field('task_id') taskId!: string;
  @field('goal_id') goalId?: string;
  @field('session_type') sessionType!: string; // 'work', 'short_break', 'long_break'
  @field('duration_minutes') durationMinutes!: number;
  @field('is_completed') isCompleted!: boolean;
  @date('completed_at') completedAt?: Date;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
