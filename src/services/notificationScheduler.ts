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
      console.log('📅 Starting to schedule daily notifications...');
      
      // Schedule morning kickstart notification
      await this.scheduleMorningKickstart();
      
      // Schedule vision board reminder notification
      await this.scheduleVisionBoardReminder();
      
      // Schedule evening check-in notification
      await this.scheduleEveningCheckin();
      
      console.log('✅ Daily notifications scheduled successfully');
    } catch (error) {
      console.error('❌ Failed to schedule daily notifications:', error);
    }
  }

  /**
   * Schedule morning kickstart notification (7:00 AM daily)
   */
  private async scheduleMorningKickstart(): Promise<void> {
    const notification = await this.generateMorningNotification();
    
    // Schedule with OneSignal using delivery time
    await this.scheduleNotificationWithOneSignal('morning_kickstart', this.MORNING_HOUR, notification);
    
    // Also save locally for tracking
    await this.saveScheduledNotification('morning_kickstart', this.MORNING_HOUR, notification);
  }

  /**
   * Schedule vision board reminder notification (10:00 AM daily)
   */
  private async scheduleVisionBoardReminder(): Promise<void> {
    const notification = await this.generateVisionBoardNotification();
    
    // Schedule with OneSignal using delivery time
    await this.scheduleNotificationWithOneSignal('vision_board_reminder', this.VISION_BOARD_HOUR, notification);
    
    // Also save locally for tracking
    await this.saveScheduledNotification('vision_board_reminder', this.VISION_BOARD_HOUR, notification);
  }

  /**
   * Schedule evening check-in notification (6:00 PM daily)
   */
  private async scheduleEveningCheckin(): Promise<void> {
    const notification = await this.generateEveningNotification();
    
    // Schedule with OneSignal using delivery time
    await this.scheduleNotificationWithOneSignal('evening_checkin', this.EVENING_HOUR, notification);
    
    // Also save locally for tracking
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
   * Schedule notification with OneSignal using send_after for daily delivery
   */
  private async scheduleNotificationWithOneSignal(
    type: string,
    hour: number,
    notification: NotificationData
  ): Promise<void> {
    try {
      const appId = await notificationService.getAppId();
      
      if (!appId) {
        console.error(`❌ Failed to schedule ${type} notification: OneSignal App ID not configured`);
        return;
      }
      
      // Get subscription ID with retry logic
      let subscriptionId = await notificationService.getSubscriptionId();
      
      // If no subscription ID, user might not be subscribed yet
      if (!subscriptionId) {
        console.warn(`⚠️ No subscription ID available for ${type} notification. User may not have accepted push permissions yet.`);
        // For now, we'll skip scheduling but not treat it as an error
        // The notifications will be scheduled once the user accepts permissions
        return;
      }

      // Calculate next delivery time (today or tomorrow at specified hour)
      const now = new Date();
      const deliveryTime = new Date();
      deliveryTime.setHours(hour, 0, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (deliveryTime <= now) {
        deliveryTime.setDate(deliveryTime.getDate() + 1);
      }

      console.log(`🔔 Scheduling ${type} notification for ${deliveryTime.toISOString()}`);

      // Call Supabase Edge Function to schedule notification
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ptkrjzqjpjcsphisipti.supabase.co';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/api-send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          include_subscription_ids: [subscriptionId],
          headings: { en: notification.title },
          contents: { en: notification.body },
          data: {
            ...notification.data,
            scheduled_type: type,
            scheduled_hour: hour
          },
          send_after: deliveryTime.toISOString(), // OneSignal will deliver at this time
          // For recurring daily notifications, we'll need to reschedule after each delivery
          // This is handled by checking and rescheduling when app opens
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${type} notification scheduled successfully for ${deliveryTime.toISOString()}`);
        
        // Save the scheduled notification ID for potential cancellation
        await AsyncStorage.setItem(`scheduled_notification_id_${type}`, result.id);
      } else {
        console.error(`❌ Failed to schedule ${type} notification:`, result.error);
      }
      
    } catch (error) {
      console.error(`Failed to schedule ${type} notification with OneSignal:`, error);
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

      console.log('🔔 Sending notification via Supabase Edge Function:', notification);

      // Call Supabase Edge Function to send the notification
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ptkrjzqjpjcsphisipti.supabase.co';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/api-send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
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
      // Initialize OneSignal first (if not already initialized)
      await notificationService.initialize();
      
      // Request permission
      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        // Ensure user is opted in to receive notifications
        await notificationService.ensureUserOptedIn();
        
        // Wait a bit for OneSignal to register the subscription
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now schedule the daily notifications
        await this.scheduleDailyNotifications();
        await AsyncStorage.setItem('notifications_enabled', 'true');
        
        console.log('✅ Notifications enabled successfully');
        return true;
      }
      
      console.log('❌ User denied notification permission');
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
   * Check and reschedule notifications if needed (call this on app startup)
   * This ensures notifications are always scheduled for the next delivery time
   */
  async checkAndRescheduleNotifications(): Promise<void> {
    try {
      const enabled = await this.areNotificationsEnabled();
      if (!enabled) {
        console.log('Notifications disabled, skipping reschedule check');
        return;
      }

      console.log('🔔 Checking if notifications need rescheduling...');

      // Check each notification type
      const types = ['morning_kickstart', 'vision_board_reminder', 'evening_checkin'];
      
      for (const type of types) {
        const lastScheduledStr = await AsyncStorage.getItem(`scheduled_notification_${type}`);
        
        if (!lastScheduledStr) {
          console.log(`No schedule found for ${type}, scheduling now...`);
          await this.scheduleDailyNotifications();
          return;
        }

        const config = JSON.parse(lastScheduledStr);
        const lastScheduled = config.lastScheduled;
        const hoursSinceScheduled = (Date.now() - lastScheduled) / (1000 * 60 * 60);

        // If it's been more than 12 hours since last schedule, reschedule
        // This ensures we always have upcoming notifications scheduled
        if (hoursSinceScheduled > 12) {
          console.log(`${type} needs rescheduling (${hoursSinceScheduled.toFixed(1)} hours since last schedule)`);
          await this.scheduleDailyNotifications();
          return;
        }
      }

      console.log('✅ All notifications are properly scheduled');
    } catch (error) {
      console.error('Failed to check and reschedule notifications:', error);
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
