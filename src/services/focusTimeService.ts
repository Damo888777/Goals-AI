import AsyncStorage from '@react-native-async-storage/async-storage';
import database from '../db';
import { Q } from '@nozbe/watermelondb';
import { authService } from './authService';

const FOCUS_SESSIONS_KEY = 'focus_sessions';
const DAILY_FOCUS_KEY = 'daily_focus_time';

export interface FocusSession {
  id: string;
  taskId?: string;
  goalId?: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  durationSeconds: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  isCompleted: boolean;
  completedAt?: Date;
  date: string; // YYYY-MM-DD format for grouping
}

export interface DailyFocusStats {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  totalSeconds: number;
  sessions: FocusSession[];
  workSessions: number;
  breakSessions: number;
}

class FocusTimeService {
  /**
   * Save a completed focus session
   */
  async saveCompletedSession(
    sessionId: string,
    taskId: string | undefined,
    goalId: string | undefined,
    sessionType: 'work' | 'short_break' | 'long_break',
    startTime: Date,
    endTime: Date,
    actualDurationSeconds: number
  ): Promise<void> {
    try {
      // Calculate duration in minutes (rounded up for display)
      const durationMinutes = Math.ceil(actualDurationSeconds / 60);
      
      // Format date for grouping
      const dateStr = this.formatDateKey(endTime);
      
      // Create focus session object
      const focusSession: FocusSession = {
        id: sessionId,
        taskId,
        goalId,
        startTime,
        endTime,
        durationMinutes,
        durationSeconds: actualDurationSeconds,
        sessionType,
        isCompleted: true,
        completedAt: endTime,
        date: dateStr
      };
      
      // Save to AsyncStorage for quick access
      await this.addSessionToStorage(focusSession);
      
      // Update daily stats
      await this.updateDailyStats(focusSession);
      
      console.log('✅ Focus session saved:', {
        sessionId,
        duration: `${Math.floor(actualDurationSeconds / 60)}:${(actualDurationSeconds % 60).toString().padStart(2, '0')}`,
        type: sessionType
      });
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  }
  
  /**
   * Get all focus sessions for today
   */
  async getTodaysSessions(): Promise<FocusSession[]> {
    try {
      const today = this.formatDateKey(new Date());
      const sessionsJson = await AsyncStorage.getItem(`${FOCUS_SESSIONS_KEY}_${today}`);
      
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        return sessions.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          completedAt: s.completedAt ? new Date(s.completedAt) : undefined
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting today\'s sessions:', error);
      return [];
    }
  }
  
  /**
   * Get focus sessions for a specific date
   */
  async getSessionsByDate(date: Date): Promise<FocusSession[]> {
    try {
      const dateStr = this.formatDateKey(date);
      const sessionsJson = await AsyncStorage.getItem(`${FOCUS_SESSIONS_KEY}_${dateStr}`);
      
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        return sessions.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          completedAt: s.completedAt ? new Date(s.completedAt) : undefined
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting sessions by date:', error);
      return [];
    }
  }
  
  /**
   * Get all focus sessions from database (for profile stats)
   */
  async getAllFocusTime(): Promise<{ totalMinutes: number; totalSessions: number; sessions: FocusSession[] }> {
    if (!database) {
      // Fallback to AsyncStorage
      return this.getAllFocusTimeFromStorage();
    }
    
    try {
      const currentUser = await authService.getCurrentUser();
      const currentUserId = currentUser?.id;
      
      if (!currentUserId) {
        return { totalMinutes: 0, totalSessions: 0, sessions: [] };
      }
      
      // Get all completed pomodoro sessions from database
      const sessionsCollection = database.get('pomodoro_sessions');
      const allSessions = await sessionsCollection
        .query(
          Q.where('user_id', currentUserId),
          Q.where('is_completed', true),
          Q.sortBy('completed_at', Q.desc)
        )
        .fetch();
      
      let totalMinutes = 0;
      const sessions: FocusSession[] = [];
      
      for (const session of allSessions) {
        const sessionData = session as any;
        
        // Use actual duration if available, otherwise planned duration
        let durationSeconds = sessionData.actualDurationSeconds || (sessionData.durationMinutes * 60);
        let durationMinutes = Math.ceil(durationSeconds / 60);
        
        totalMinutes += durationMinutes;
        
        // Create focus session object
        const focusSession: FocusSession = {
          id: sessionData.id,
          taskId: sessionData.taskId,
          goalId: sessionData.goalId,
          startTime: sessionData.createdAt,
          endTime: sessionData.completedAt || sessionData.updatedAt,
          durationMinutes,
          durationSeconds,
          sessionType: sessionData.sessionType,
          isCompleted: true,
          completedAt: sessionData.completedAt,
          date: this.formatDateKey(sessionData.completedAt || sessionData.updatedAt)
        };
        
        sessions.push(focusSession);
      }
      
      return {
        totalMinutes,
        totalSessions: sessions.length,
        sessions
      };
    } catch (error) {
      console.error('Error getting all focus time from database:', error);
      // Fallback to AsyncStorage
      return this.getAllFocusTimeFromStorage();
    }
  }
  
  /**
   * Get all focus time from AsyncStorage (fallback)
   */
  private async getAllFocusTimeFromStorage(): Promise<{ totalMinutes: number; totalSessions: number; sessions: FocusSession[] }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sessionKeys = allKeys.filter(key => key.startsWith(FOCUS_SESSIONS_KEY + '_'));
      
      let totalMinutes = 0;
      let allSessions: FocusSession[] = [];
      
      for (const key of sessionKeys) {
        const sessionsJson = await AsyncStorage.getItem(key);
        if (sessionsJson) {
          const sessions = JSON.parse(sessionsJson);
          const parsedSessions = sessions.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            completedAt: s.completedAt ? new Date(s.completedAt) : undefined
          }));
          
          allSessions = allSessions.concat(parsedSessions);
          
          for (const session of parsedSessions) {
            totalMinutes += session.durationMinutes;
          }
        }
      }
      
      // Sort by date descending
      allSessions.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
      
      return {
        totalMinutes,
        totalSessions: allSessions.length,
        sessions: allSessions
      };
    } catch (error) {
      console.error('Error getting all focus time from storage:', error);
      return { totalMinutes: 0, totalSessions: 0, sessions: [] };
    }
  }
  
  /**
   * Get focus sessions for a specific task
   */
  async getTaskFocusSessions(taskId: string): Promise<FocusSession[]> {
    try {
      const { sessions } = await this.getAllFocusTime();
      return sessions.filter(s => s.taskId === taskId);
    } catch (error) {
      console.error('Error getting task focus sessions:', error);
      return [];
    }
  }
  
  /**
   * Format focus time for display
   */
  formatFocusTime(totalMinutes: number): string {
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  }
  
  /**
   * Format session duration for display
   */
  formatSessionDuration(durationSeconds: number): string {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    
    if (seconds === 0) {
      return `${minutes} Minutes`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')} Minutes`;
  }
  
  /**
   * Private helper methods
   */
  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  private async addSessionToStorage(session: FocusSession): Promise<void> {
    const key = `${FOCUS_SESSIONS_KEY}_${session.date}`;
    const existingJson = await AsyncStorage.getItem(key);
    
    let sessions: FocusSession[] = [];
    if (existingJson) {
      sessions = JSON.parse(existingJson);
    }
    
    // Add new session
    sessions.push(session);
    
    // Sort by end time descending
    sessions.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
    
    await AsyncStorage.setItem(key, JSON.stringify(sessions));
  }
  
  private async updateDailyStats(session: FocusSession): Promise<void> {
    const key = `${DAILY_FOCUS_KEY}_${session.date}`;
    const existingJson = await AsyncStorage.getItem(key);
    
    let stats: DailyFocusStats;
    
    if (existingJson) {
      stats = JSON.parse(existingJson);
      stats.totalMinutes += session.durationMinutes;
      stats.totalSeconds += session.durationSeconds;
      
      if (session.sessionType === 'work') {
        stats.workSessions++;
      } else {
        stats.breakSessions++;
      }
    } else {
      stats = {
        date: session.date,
        totalMinutes: session.durationMinutes,
        totalSeconds: session.durationSeconds,
        sessions: [],
        workSessions: session.sessionType === 'work' ? 1 : 0,
        breakSessions: session.sessionType !== 'work' ? 1 : 0
      };
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(stats));
  }
}

export const focusTimeService = new FocusTimeService();
