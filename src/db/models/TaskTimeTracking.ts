import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class TaskTimeTracking extends Model {
  static table = 'task_time_tracking';

  @field('user_id') userId!: string;
  @field('task_id') taskId!: string;
  @field('total_pomodoro_sessions') totalPomodoroSessions!: number;
  @field('total_minutes_focused') totalMinutesFocused!: number;
  @date('last_session_at') lastSessionAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
