import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import database from '../db';
import { authService } from '../services/authService';

export interface PomodoroSessionData {
  id: string;
  taskId: string;
  goalId?: string;
  sessionType: 'work' | 'short_break' | 'long_break';
  durationMinutes: number; // Planned duration
  actualDurationSeconds?: number; // Actual time spent in seconds
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTimeStats {
  taskId: string;
  totalSessions: number;
  totalMinutes: number;
  lastSessionAt?: Date;
}

export const usePomodoroSessions = (taskId?: string) => {
  const [sessions, setSessions] = useState<PomodoroSessionData[]>([]);
  const [timeStats, setTimeStats] = useState<TaskTimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch sessions for a specific task
  const fetchTaskSessions = async (targetTaskId: string) => {
    if (!database) {
      console.log('Database not available, using empty sessions');
      setSessions([]);
      setTimeStats({
        taskId: targetTaskId,
        totalSessions: 0,
        totalMinutes: 0
      });
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      const currentUserId = currentUser?.id;
      if (!currentUserId) {
        setSessions([]);
        setTimeStats({
          taskId: targetTaskId,
          totalSessions: 0,
          totalMinutes: 0
        });
        setLoading(false);
        return;
      }

      // Fetch pomodoro sessions for this task
      const sessionsCollection = database.get('pomodoro_sessions');
      const taskSessions = await sessionsCollection
        .query(
          Q.where('user_id', currentUserId),
          Q.where('task_id', targetTaskId),
          Q.where('is_completed', true), // Only completed sessions
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();

      const sessionData: PomodoroSessionData[] = taskSessions.map((session: any) => ({
        id: session.id,
        taskId: session.taskId,
        goalId: session.goalId,
        sessionType: session.sessionType,
        durationMinutes: session.durationMinutes,
        actualDurationSeconds: session.actualDurationSeconds,
        isCompleted: session.isCompleted,
        completedAt: session.completedAt,
        notes: session.notes,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }));

      setSessions(sessionData);

      // Calculate time statistics
      const totalSessions = sessionData.length;
      const totalMinutes = sessionData.reduce((sum, session) => sum + session.durationMinutes, 0);
      const lastSession = sessionData.length > 0 ? sessionData[0] : null;

      setTimeStats({
        taskId: targetTaskId,
        totalSessions,
        totalMinutes,
        lastSessionAt: lastSession?.completedAt
      });

    } catch (error) {
      console.error('Error fetching pomodoro sessions:', error);
      setSessions([]);
      setTimeStats({
        taskId: targetTaskId,
        totalSessions: 0,
        totalMinutes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new pomodoro session
  const createSession = async (
    taskId: string,
    sessionType: 'work' | 'short_break' | 'long_break' = 'work',
    goalId?: string
  ): Promise<string | null> => {
    if (!database) {
      console.log('Database not available');
      return null;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      const currentUserId = currentUser?.id;
      if (!currentUserId) {
        console.log('No user ID available');
        return null;
      }

      const durationMinutes = getSessionDuration(sessionType);
      let sessionId: string | null = null;

      await database.write(async () => {
        const sessionsCollection = database!.get('pomodoro_sessions');
        const newSession = await sessionsCollection.create((session: any) => {
          session.userId = currentUserId;
          session.taskId = taskId;
          session.goalId = goalId;
          session.sessionType = sessionType;
          session.durationMinutes = durationMinutes;
          session.isCompleted = false;
        });
        sessionId = newSession.id;
      });

      return sessionId;
    } catch (error) {
      console.error('Error creating pomodoro session:', error);
      return null;
    }
  };

  // Complete a pomodoro session
  const completeSession = async (sessionId: string, actualDurationSeconds?: number, notes?: string): Promise<void> => {
    if (!database) {
      console.log('Database not available');
      return;
    }

    try {
      await database.write(async () => {
        const session = await database!.get('pomodoro_sessions').find(sessionId);
        await session.update((s: any) => {
          s.isCompleted = true;
          s.completedAt = new Date();
          s.actualDurationSeconds = actualDurationSeconds;
          s.notes = notes;
        });
      });

      // Update task time tracking
      await updateTaskTimeTracking(sessionId);

      // Refresh sessions if we're tracking this task
      if (taskId) {
        await fetchTaskSessions(taskId);
      }
    } catch (error) {
      console.error('Error completing pomodoro session:', error);
    }
  };

  // Update task time tracking
  const updateTaskTimeTracking = async (sessionId: string): Promise<void> => {
    if (!database) return;

    try {
      const session = await database.get('pomodoro_sessions').find(sessionId);
      const sessionData = session as any;
      const currentUser = await authService.getCurrentUser();
      const currentUserId = currentUser?.id;
      
      if (!currentUserId) return;

      await database.write(async () => {
        const trackingCollection = database!.get('task_time_tracking');
        const existingTracking = await trackingCollection
          .query(
            Q.where('user_id', currentUserId),
            Q.where('task_id', sessionData.taskId)
          )
          .fetch();

        if (existingTracking.length > 0) {
          // Update existing record
          const tracking = existingTracking[0];
          await tracking.update((t: any) => {
            t.totalPomodoroSessions += 1;
            t.totalMinutesFocused += sessionData.durationMinutes;
            t.lastSessionAt = new Date();
          });
        } else {
          // Create new tracking record
          await trackingCollection.create((tracking: any) => {
            tracking.userId = currentUserId;
            tracking.taskId = sessionData.taskId;
            tracking.totalPomodoroSessions = 1;
            tracking.totalMinutesFocused = sessionData.durationMinutes;
            tracking.lastSessionAt = new Date();
          });
        }
      });
    } catch (error) {
      console.error('Error updating task time tracking:', error);
    }
  };

  // Helper function to get session duration
  const getSessionDuration = (sessionType: 'work' | 'short_break' | 'long_break'): number => {
    switch (sessionType) {
      case 'work': return 25;
      case 'short_break': return 5;
      case 'long_break': return 30;
      default: return 25;
    }
  };

  // Effect to fetch sessions when taskId changes
  useEffect(() => {
    if (taskId) {
      fetchTaskSessions(taskId);
    } else {
      setSessions([]);
      setTimeStats(null);
      setLoading(false);
    }
  }, [taskId]);

  return {
    sessions,
    timeStats,
    loading,
    createSession,
    completeSession,
    refetch: taskId ? () => fetchTaskSessions(taskId) : () => {}
  };
};
