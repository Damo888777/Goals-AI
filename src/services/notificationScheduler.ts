import { notificationService } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import database from '../db';
import { Q } from '@nozbe/watermelondb';
import Goal from '../db/models/Goal';
import Task from '../db/models/Task';
import i18n from './i18next';

export interface NotificationData {
  type: 'morning_kickstart' | 'vision_board_reminder' | 'evening_checkin' | 're_engagement';
  title: string;
  body: string;
  data?: {
    type?: string;
    scenario?: string;
    taskId?: string;
    taskTitle?: string;
    goalId?: string;
    mainGoalId?: string;
    mainGoalTitle?: string;
    streakCount?: number;
    daysSinceLastActivity?: number;
    date?: string;
  };
}

class NotificationScheduler {
  private readonly MORNING_HOUR = 7; // 7:00 AM
  private readonly VISION_BOARD_HOUR = 10; // 10:00 AM
  private readonly EVENING_HOUR = 18; // 6:00 PM
  private readonly INACTIVITY_3_DAYS = 3 * 24 * 60 * 60 * 1000; // 3 days in ms
  private readonly INACTIVITY_7_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  /**
   * Schedule daily notifications (called when app starts or user enables notifications)
   */
  async scheduleDailyNotifications(): Promise<void> {
    try {
      // Schedule morning kickstart notification
      await this.scheduleMorningKickstart();
      
      // Schedule vision board reminder notification
      await this.scheduleVisionBoardReminder();
      
      // Schedule evening check-in notification
      await this.scheduleEveningCheckin();
      
      console.log('Daily notifications scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule daily notifications:', error);
    }
  }

  /**
   * Schedule morning kickstart notification (7:00 AM daily)
   */
  private async scheduleMorningKickstart(): Promise<void> {
    const notification = await this.generateMorningNotification();
    
    // In a real implementation, you would use OneSignal's API to schedule recurring notifications
    // For now, we'll track this and send via server-side scheduling
    await this.saveScheduledNotification('morning_kickstart', this.MORNING_HOUR, notification);
  }

  /**
   * Schedule vision board reminder notification (10:00 AM daily)
   */
  private async scheduleVisionBoardReminder(): Promise<void> {
    const notification = await this.generateVisionBoardNotification();
    
    // In a real implementation, you would use OneSignal's API to schedule recurring notifications
    // For now, we'll track this and send via server-side scheduling
    await this.saveScheduledNotification('vision_board_reminder', this.VISION_BOARD_HOUR, notification);
  }

  /**
   * Schedule evening check-in notification (6:00 PM daily)
   */
  private async scheduleEveningCheckin(): Promise<void> {
    const notification = await this.generateEveningNotification();
    
    // In a real implementation, you would use OneSignal's API to schedule recurring notifications
    // For now, we'll track this and send via server-side scheduling
    await this.saveScheduledNotification('evening_checkin', this.EVENING_HOUR, notification);
  }

  /**
   * Generate morning kickstart notification based on frog task status
   */
  async generateMorningNotification(): Promise<NotificationData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysFrogTask = await this.getTodaysFrogTask();
      
      if (!todaysFrogTask) {
        // Scenario A: "Eat the Frog" for the current day is NOT set
        return {
          type: 'morning_kickstart',
          title: i18n.t('notifications.morningKickstart.noFrogTask.title'),
          body: i18n.t('notifications.morningKickstart.noFrogTask.body'),
          data: {
            type: 'morning_kickstart',
            scenario: 'no_frog_task',
            date: today
          }
        };
      } else {
        // Scenario B: "Eat the Frog" for the current day IS set
        return {
          type: 'morning_kickstart',
          title: i18n.t('notifications.morningKickstart.frogTaskSet.title'),
          body: i18n.t('notifications.morningKickstart.frogTaskSet.body', { taskTitle: todaysFrogTask.title }),
          data: {
            type: 'morning_kickstart',
            scenario: 'frog_task_set',
            taskId: todaysFrogTask.id,
            taskTitle: todaysFrogTask.title,
            date: today
          }
        };
      }
    } catch (error) {
      console.error('Failed to generate morning notification:', error);
      // Fallback notification
      return {
        type: 'morning_kickstart',
        title: i18n.t('notifications.morningKickstart.fallback.title'),
        body: i18n.t('notifications.morningKickstart.fallback.body'),
        data: { type: 'morning_kickstart', scenario: 'fallback' }
      };
    }
  }

  /**
   * Generate vision board reminder notification (10:00 AM)
   */
  async generateVisionBoardNotification(): Promise<NotificationData> {
    try {
      const mainGoal = await this.getMainGoal();
      
      if (mainGoal) {
        return {
          type: 'vision_board_reminder',
          title: i18n.t('notifications.visionBoardReminder.withMainGoal.title'),
          body: i18n.t('notifications.visionBoardReminder.withMainGoal.body', { mainGoalTitle: mainGoal.title }),
          data: {
            type: 'vision_board_reminder',
            scenario: 'with_main_goal',
            goalId: mainGoal.id,
            mainGoalTitle: mainGoal.title,
            date: new Date().toISOString().split('T')[0]
          }
        };
      } else {
        return {
          type: 'vision_board_reminder',
          title: i18n.t('notifications.visionBoardReminder.noMainGoal.title'),
          body: i18n.t('notifications.visionBoardReminder.noMainGoal.body'),
          data: {
            type: 'vision_board_reminder',
            scenario: 'no_main_goal',
            date: new Date().toISOString().split('T')[0]
          }
        };
      }
    } catch (error) {
      console.error('Failed to generate vision board notification:', error);
      // Fallback notification
      return {
        type: 'vision_board_reminder',
        title: i18n.t('notifications.visionBoardReminder.fallback.title'),
        body: i18n.t('notifications.visionBoardReminder.fallback.body'),
        data: { type: 'vision_board_reminder', scenario: 'fallback' }
      };
    }
  }

  /**
   * Generate evening check-in notification based on frog task completion
   */
  async generateEveningNotification(): Promise<NotificationData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysFrogTask = await this.getTodaysFrogTask();
      const streakCount = await this.getFrogStreakCount();
      
      if (todaysFrogTask?.isComplete) {
        // Scenario A: The "Eat the Frog" task for the day HAS been completed
        return {
          type: 'evening_checkin',
          title: i18n.t('notifications.eveningCheckin.frogCompleted.title'),
          body: i18n.t('notifications.eveningCheckin.frogCompleted.body', { streakCount }),
          data: {
            type: 'evening_checkin',
            scenario: 'frog_completed',
            streakCount,
            taskId: todaysFrogTask.id,
            date: today
          }
        };
      } else if (todaysFrogTask) {
        // Scenario B: The "Eat the Frog" task for the day HAS NOT been completed
        return {
          type: 'evening_checkin',
          title: i18n.t('notifications.eveningCheckin.frogNotCompleted.title'),
          body: i18n.t('notifications.eveningCheckin.frogNotCompleted.body', { 
            taskTitle: todaysFrogTask.title, 
            streakCount 
          }),
          data: {
            type: 'evening_checkin',
            scenario: 'frog_not_completed',
            streakCount,
            taskId: todaysFrogTask.id,
            taskTitle: todaysFrogTask.title,
            date: today
          }
        };
      } else {
        // No frog task set for today
        return {
          type: 'evening_checkin',
          title: i18n.t('notifications.eveningCheckin.noFrogTask.title'),
          body: i18n.t('notifications.eveningCheckin.noFrogTask.body'),
          data: {
            type: 'evening_checkin',
            scenario: 'no_frog_task',
            date: today
          }
        };
      }
    } catch (error) {
      console.error('Failed to generate evening notification:', error);
      // Fallback notification
      return {
        type: 'evening_checkin',
        title: i18n.t('notifications.eveningCheckin.fallback.title'),
        body: i18n.t('notifications.eveningCheckin.fallback.body'),
        data: { type: 'evening_checkin', scenario: 'fallback' }
      };
    }
  }

  /**
   * Generate re-engagement notification based on inactivity period
   */
  async generateReEngagementNotification(daysSinceLastActivity: number): Promise<NotificationData> {
    try {
      const userGoals = await this.getAllGoals();
      const mainGoal = userGoals.find((goal: Goal) => !goal.isCompleted) || userGoals[0];
      
      if (daysSinceLastActivity >= 7) {
        // Scenario B: 7 days of app inactivity
        const goalTitle = mainGoal?.title || 'your goals';
        return {
          type: 're_engagement',
          title: i18n.t('notifications.reEngagement.sevenDayInactivity.title'),
          body: i18n.t('notifications.reEngagement.sevenDayInactivity.body', { goalTitle }),
          data: {
            type: 're_engagement',
            scenario: '7_day_inactivity',
            daysSinceLastActivity,
            mainGoalId: mainGoal?.id,
            mainGoalTitle: goalTitle
          }
        };
      } else {
        // Scenario A: 3 days of app inactivity
        return {
          type: 're_engagement',
          title: i18n.t('notifications.reEngagement.threeDayInactivity.title'),
          body: i18n.t('notifications.reEngagement.threeDayInactivity.body'),
          data: {
            type: 're_engagement',
            scenario: '3_day_inactivity',
            daysSinceLastActivity
          }
        };
      }
    } catch (error) {
      console.error('Failed to generate re-engagement notification:', error);
      // Fallback notification
      return {
        type: 're_engagement',
        title: i18n.t('notifications.reEngagement.fallback.title'),
        body: i18n.t('notifications.reEngagement.fallback.body'),
        data: { type: 're_engagement', scenario: 'fallback' }
      };
    }
  }

  /**
   * Check if re-engagement notification should be sent
   */
  async checkReEngagementNotification(): Promise<void> {
    try {
      const lastActivity = await AsyncStorage.getItem('last_app_activity');
      if (!lastActivity) return;

      const lastActivityTime = parseInt(lastActivity);
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityTime;
      const daysSinceLastActivity = Math.floor(timeSinceLastActivity / (24 * 60 * 60 * 1000));

      // Check if we should send 3-day or 7-day re-engagement notification
      if (daysSinceLastActivity >= 7) {
        const lastSevenDayNotification = await AsyncStorage.getItem('last_7_day_notification');
        const shouldSend7Day = !lastSevenDayNotification || 
          (currentTime - parseInt(lastSevenDayNotification)) > this.INACTIVITY_7_DAYS;

        if (shouldSend7Day) {
          const notification = await this.generateReEngagementNotification(daysSinceLastActivity);
          await this.sendNotification(notification);
          await AsyncStorage.setItem('last_7_day_notification', currentTime.toString());
        }
      } else if (daysSinceLastActivity >= 3) {
        const lastThreeDayNotification = await AsyncStorage.getItem('last_3_day_notification');
        const shouldSend3Day = !lastThreeDayNotification || 
          (currentTime - parseInt(lastThreeDayNotification)) > this.INACTIVITY_3_DAYS;

        if (shouldSend3Day) {
          const notification = await this.generateReEngagementNotification(daysSinceLastActivity);
          await this.sendNotification(notification);
          await AsyncStorage.setItem('last_3_day_notification', currentTime.toString());
        }
      }
    } catch (error) {
      console.error('Failed to check re-engagement notification:', error);
    }
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity(): Promise<void> {
    try {
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem('last_app_activity', timestamp);
      await notificationService.updateLastActivity();
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Get current frog task streak count
   */
  private async getFrogStreakCount(): Promise<number> {
    try {
      const streakCount = await AsyncStorage.getItem('frog_streak_count');
      return streakCount ? parseInt(streakCount) : 0;
    } catch (error) {
      console.error('Failed to get frog streak count:', error);
      return 0;
    }
  }

  /**
   * Update frog task streak count
   */
  async updateFrogStreak(completed: boolean): Promise<number> {
    try {
      let currentStreak = await this.getFrogStreakCount();
      
      if (completed) {
        currentStreak += 1;
      } else {
        currentStreak = 0;
      }
      
      await AsyncStorage.setItem('frog_streak_count', currentStreak.toString());
      await notificationService.updateFrogTaskStatus(completed, currentStreak);
      
      return currentStreak;
    } catch (error) {
      console.error('Failed to update frog streak:', error);
      return 0;
    }
  }

  /**
   * Save scheduled notification configuration
   */
  private async saveScheduledNotification(
    type: string, 
    hour: number, 
    notification: NotificationData
  ): Promise<void> {
    try {
      const config = {
        type,
        hour,
        notification,
        enabled: true,
        lastScheduled: Date.now()
      };
      
      await AsyncStorage.setItem(`scheduled_notification_${type}`, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save scheduled notification:', error);
    }
  }

  /**
   * Send notification immediately (for testing or immediate notifications)
   */
  private async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // Get OneSignal subscription ID from notification service
      const subscriptionId = await notificationService.getSubscriptionId();
      
      if (!subscriptionId) {
        console.warn('No OneSignal subscription ID available, cannot send notification');
        return;
      }

      // Get OneSignal app ID from config
      const appId = await notificationService.getAppId();
      
      if (!appId) {
        console.error('OneSignal app ID not configured');
        return;
      }

      console.log('🔔 Sending notification via API endpoint:', notification);

      // Call our API endpoint to send the notification
      const { getApiUrl } = await import('../constants/config');
      const response = await fetch(getApiUrl('/api/send-notification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          include_subscription_ids: [subscriptionId],
          headings: { en: notification.title },
          contents: { en: notification.body },
          data: notification.data || {}
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Notification sent successfully:', result);
      } else {
        console.error('❌ Failed to send notification:', result.error);
      }
      
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Request notification permission and schedule notifications
   */
  async enableNotifications(): Promise<boolean> {
    try {
      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        await this.scheduleDailyNotifications();
        await AsyncStorage.setItem('notifications_enabled', 'true');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }

  /**
   * Disable notifications
   */
  async disableNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem('notifications_enabled', 'false');
      // Clear scheduled notifications
      await AsyncStorage.removeItem('scheduled_notification_morning_kickstart');
      await AsyncStorage.removeItem('scheduled_notification_vision_board_reminder');
      await AsyncStorage.removeItem('scheduled_notification_evening_checkin');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('notifications_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Send test notification immediately (for testing purposes)
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      const testNotification: NotificationData = {
        type: 'morning_kickstart',
        title: i18n.t('notifications.test.title'),
        body: i18n.t('notifications.test.body'),
        data: {
          type: 'test',
          scenario: 'test_notification',
          date: new Date().toISOString().split('T')[0]
        }
      };

      console.log('🧪 Sending test notification...');
      await this.sendNotification(testNotification);
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Get today's frog task
   */
  private async getTodaysFrogTask(): Promise<Task | null> {
    try {
      if (!database) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const tasks = await database.collections.get<Task>('tasks')
        .query(
          Q.where('is_frog', true),
          Q.where('scheduled_date', Q.like(`${today}%`))
        )
        .fetch();
      
      return tasks[0] || null;
    } catch (error) {
      console.error('Failed to get today\'s frog task:', error);
      return null;
    }
  }

  /**
   * Get main goal (first active goal)
   */
  private async getMainGoal(): Promise<Goal | null> {
    try {
      if (!database) return null;
      
      const goals = await database.collections.get<Goal>('goals')
        .query(Q.where('is_completed', false))
        .fetch();
      
      return goals[0] || null;
    } catch (error) {
      console.error('Failed to get main goal:', error);
      return null;
    }
  }

  /**
   * Get all user goals
   */
  private async getAllGoals(): Promise<Goal[]> {
    try {
      if (!database) return [];
      
      const goals = await database.collections.get<Goal>('goals').query().fetch();
      return goals;
    } catch (error) {
      console.error('Failed to get all goals:', error);
      return [];
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
