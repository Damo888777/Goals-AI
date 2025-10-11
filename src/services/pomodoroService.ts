import { supabase, isSupabaseConfigured } from '../lib/supabase';
import database from '../db';
import { Q } from '@nozbe/watermelondb';

export interface PomodoroSession {
  id: string;
  taskId: string;
  goalId?: string;
  sessionType: 'work' | 'short_break' | 'long_break';
  durationMinutes: number;
  completedAt?: Date;
  isCompleted: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTimeStats {
  taskId: string;
  totalPomodoroSessions: number;
  totalMinutesFocused: number;
  lastSessionAt?: Date;
}

class PomodoroService {
  // Start a new pomodoro session
  async startSession(taskId: string, goalId?: string, sessionType: 'work' | 'short_break' | 'long_break' = 'work'): Promise<PomodoroSession | null> {
    const durationMinutes = this.getSessionDuration(sessionType);
    
    try {
      // Create session in local database first
      if (database) {
        await database.write(async () => {
          const sessionsCollection = database!.get('pomodoro_sessions');
          await sessionsCollection.create((session: any) => {
            session.taskId = taskId;
            session.goalId = goalId;
            session.sessionType = sessionType;
            session.durationMinutes = durationMinutes;
            session.isCompleted = false;
          });
        });
      }

      // Sync to cloud in background
      this.syncSessionToCloud(taskId, goalId, sessionType, durationMinutes);

      return {
        id: `session-${Date.now()}`,
        taskId,
        goalId,
        sessionType,
        durationMinutes,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error starting pomodoro session:', error);
      return null;
    }
  }

  // Complete a pomodoro session
  async completeSession(sessionId: string, notes?: string): Promise<void> {
    try {
      const completedAt = new Date();

      // Update local database
      if (database) {
        await database.write(async () => {
          const session = await database!.get('pomodoro_sessions').find(sessionId);
          await session.update((s: any) => {
            s.isCompleted = true;
            s.completedAt = completedAt;
            s.notes = notes;
          });
        });
      }

      // Update task time tracking
      await this.updateTaskTimeTracking(sessionId);

      // Sync to cloud in background
      this.syncCompletionToCloud(sessionId, completedAt, notes);
    } catch (error) {
      console.error('Error completing pomodoro session:', error);
    }
  }

  // Get session duration based on type
  private getSessionDuration(sessionType: 'work' | 'short_break' | 'long_break'): number {
    switch (sessionType) {
      case 'work': return 25;
      case 'short_break': return 5;
      case 'long_break': return 30;
      default: return 25;
    }
  }

  // Update task time tracking statistics
  private async updateTaskTimeTracking(sessionId: string): Promise<void> {
    if (!database) return;

    try {
      await database.write(async () => {
        const session = await database!.get('pomodoro_sessions').find(sessionId);
        const taskId = (session as any).taskId;
        
        // Get or create time tracking record
        const trackingCollection = database!.get('task_time_tracking');
        const existingTracking = await trackingCollection
          .query(Q.where('task_id', taskId))
          .fetch();

        if (existingTracking.length > 0) {
          // Update existing record
          const tracking = existingTracking[0];
          await tracking.update((t: any) => {
            t.totalPomodoroSessions += 1;
            t.totalMinutesFocused += (session as any).durationMinutes;
            t.lastSessionAt = new Date();
          });
        } else {
          // Create new tracking record
          await trackingCollection.create((tracking: any) => {
            tracking.taskId = taskId;
            tracking.totalPomodoroSessions = 1;
            tracking.totalMinutesFocused = (session as any).durationMinutes;
            tracking.lastSessionAt = new Date();
          });
        }
      });
    } catch (error) {
      console.error('Error updating task time tracking:', error);
    }
  }

  // Get task time statistics
  async getTaskTimeStats(taskId: string): Promise<TaskTimeStats | null> {
    if (!database) return null;

    try {
      const trackingCollection = database.get('task_time_tracking');
      const tracking = await trackingCollection
        .query(Q.where('task_id', taskId))
        .fetch();

      if (tracking.length === 0) {
        return {
          taskId,
          totalPomodoroSessions: 0,
          totalMinutesFocused: 0
        };
      }

      const record = tracking[0] as any;
      return {
        taskId,
        totalPomodoroSessions: record.totalPomodoroSessions,
        totalMinutesFocused: record.totalMinutesFocused,
        lastSessionAt: record.lastSessionAt
      };
    } catch (error) {
      console.error('Error getting task time stats:', error);
      return null;
    }
  }

  // Get pomodoro sessions for a task
  async getTaskSessions(taskId: string): Promise<PomodoroSession[]> {
    if (!database) return [];

    try {
      const sessionsCollection = database.get('pomodoro_sessions');
      const sessions = await sessionsCollection
        .query(Q.where('task_id', taskId))
        .fetch();

      return sessions.map((session: any) => ({
        id: session.id,
        taskId: session.taskId,
        goalId: session.goalId,
        sessionType: session.sessionType,
        durationMinutes: session.durationMinutes,
        completedAt: session.completedAt,
        isCompleted: session.isCompleted,
        notes: session.notes,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }));
    } catch (error) {
      console.error('Error getting task sessions:', error);
      return [];
    }
  }

  // Background sync to cloud
  private async syncSessionToCloud(taskId: string, goalId: string | undefined, sessionType: string, durationMinutes: number): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    setTimeout(async () => {
      try {
        const { error } = await supabase!.from('pomodoro_sessions').insert({
          task_id: taskId,
          goal_id: goalId,
          session_type: sessionType,
          duration_minutes: durationMinutes,
          is_completed: false
        });
        
        if (error) {
          console.log('Background sync of pomodoro session failed (non-critical):', error);
        }
      } catch (error) {
        console.log('Background sync of pomodoro session failed (non-critical):', error);
      }
    }, 500);
  }

  private async syncCompletionToCloud(sessionId: string, completedAt: Date, notes?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    setTimeout(async () => {
      try {
        const { error } = await supabase!
          .from('pomodoro_sessions')
          .update({
            is_completed: true,
            completed_at: completedAt.toISOString(),
            notes
          })
          .eq('id', sessionId);
          
        if (error) {
          console.log('Background sync of pomodoro completion failed (non-critical):', error);
        }
      } catch (error) {
        console.log('Background sync of pomodoro completion failed (non-critical):', error);
      }
    }, 500);
  }
}

export const pomodoroService = new PomodoroService();
