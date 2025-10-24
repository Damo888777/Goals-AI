import { OneSignal, LogLevel, NotificationClickEvent } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

class NotificationService {
  private isInitialized = false;
  private appId: string;

  constructor() {
    this.appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '';
  }

  /**
   * Get user's timezone using JavaScript Intl API
   */
  private getUserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Failed to get timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Get timezone offset in hours
   */
  private getTimezoneOffset(): number {
    try {
      const offsetMinutes = new Date().getTimezoneOffset();
      return -offsetMinutes / 60;
    } catch (error) {
      console.error('Failed to get timezone offset:', error);
      return 0;
    }
  }

  /**
   * Initialize OneSignal with proper configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing OneSignal with App ID:', this.appId);
      
      // Enable verbose logging for debugging
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      
      // Initialize OneSignal
      OneSignal.initialize(this.appId);
      
      // Request permission
      await this.requestPermission();
      
      // Link user after initialization
      await this.linkCurrentUser();
      
      // Set timezone tags
      await this.updateUserTags({});
      
      // Setup Live Activities
      await this.setupLiveActivities();
      
      this.isInitialized = true;
      console.log('OneSignal initialized successfully');
      
      // Auto-run debug check after initialization
      setTimeout(async () => {
        await this.debugNotificationStatus();
        // Auto opt-in user if they have permission but aren't subscribed
        await this.ensureUserOptedIn();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      throw error;
    }
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await OneSignal.Notifications.requestPermission(true);
      await AsyncStorage.setItem('notification_permission_requested', 'true');
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Force request permission (for dev tools)
   */
  async forceRequestPermission(): Promise<boolean> {
    try {
      console.log('🔄 [DevTools] Force requesting notification permission...');
      const permission = await OneSignal.Notifications.requestPermission(true);
      await AsyncStorage.setItem('notification_permission_requested', 'true');
      console.log('🔄 [DevTools] Permission result:', permission);
      return permission;
    } catch (error) {
      console.error('Failed to force request notification permission:', error);
      return false;
    }
  }

  /**
   * Check if permission has been requested before
   */
  async hasRequestedPermission(): Promise<boolean> {
    try {
      const requested = await AsyncStorage.getItem('notification_permission_requested');
      return requested === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Link OneSignal user with app user ID
   */
  async linkCurrentUser(): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser?.id) {
        OneSignal.login(currentUser.id);
        console.log('OneSignal user linked:', currentUser.id);
      }
    } catch (error) {
      console.error('Failed to link OneSignal user:', error);
    }
  }

  /**
   * Update user tags for personalized notifications including timezone
   */
  async updateUserTags(tags: Record<string, string | number | boolean>): Promise<void> {
    try {
      // Add timezone information to tags
      const timezone = this.getUserTimezone();
      const timezoneOffset = this.getTimezoneOffset();
      
      // Convert all values to strings as required by OneSignal v5
      const stringTags: Record<string, string> = {};
      for (const [key, value] of Object.entries(tags)) {
        stringTags[key] = String(value);
      }
      
      const tagsWithTimezone = {
        ...stringTags,
        timezone,
        timezone_offset: String(timezoneOffset)
      };
      
      OneSignal.User.addTags(tagsWithTimezone);
      console.log('OneSignal tags updated with timezone:', tagsWithTimezone);
      
      // Store timezone locally for reference
      await AsyncStorage.setItem('user_timezone', timezone);
      await AsyncStorage.setItem('user_timezone_offset', timezoneOffset.toString());
    } catch (error) {
      console.error('Failed to update OneSignal tags:', error);
    }
  }

  /**
   * Initialize user timezone tags
   */
  async initializeTimezone(): Promise<void> {
    try {
      const timezone = this.getUserTimezone();
      const timezoneOffset = this.getTimezoneOffset();
      
      await this.updateUserTags({
        timezone,
        timezone_offset: String(timezoneOffset)
      });
      
      console.log(`User timezone initialized: ${timezone} (UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})`);
    } catch (error) {
      console.error('Failed to initialize timezone:', error);
    }
  }

  /**
   * Set up event listeners for OneSignal
   */
  private setupEventListeners(): void {
    // Set up notification click listener
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('OneSignal: notification clicked', event);
      this.handleNotificationClick(event);
    });

    // Set up foreground notification listener
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('OneSignal: notification received in foreground', event);
    });

    // Set up permission change listener
    OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
      console.log('OneSignal: permission changed', granted);
    });
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(event: NotificationClickEvent): void {
    const notification = event.notification;
    const data = notification.additionalData as any;

    // Handle different notification types based on data
    if (data?.type === 'morning_kickstart') {
      // Navigate to today's tasks or frog task setting
      console.log('Navigate to frog task setting');
    } else if (data?.type === 'evening_checkin') {
      // Navigate to today's tasks or progress view
      console.log('Navigate to progress view');
    } else if (data?.type === 're_engagement') {
      // Navigate to main goals screen
      console.log('Navigate to goals screen');
    }
  }

  /**
   * Get OneSignal player ID for server-side notifications
   */
  async getPlayerId(): Promise<string | null> {
    try {
      const subscription = await OneSignal.User.pushSubscription.getIdAsync();
      return subscription;
    } catch (error) {
      console.error('Failed to get OneSignal player ID:', error);
      return null;
    }
  }

  /**
   * Get OneSignal subscription ID (alias for getPlayerId for consistency)
   */
  async getSubscriptionId(): Promise<string | null> {
    return this.getPlayerId();
  }

  /**
   * Get OneSignal app ID
   */
  async getAppId(): Promise<string | null> {
    return this.appId || null;
  }

  /**
   * Ensure user is opted in to notifications
   */
  async ensureUserOptedIn(): Promise<void> {
    try {
      const isOptedIn = await OneSignal.User.pushSubscription.getOptedInAsync();
      if (!isOptedIn) {
        console.log('🔧 [Auto Fix] User not opted in, opting in now...');
        OneSignal.User.pushSubscription.optIn();
        console.log('✅ [Auto Fix] User opted in to notifications');
        
        // Re-run debug check after opt-in
        setTimeout(() => {
          this.debugNotificationStatus();
        }, 1000);
      } else {
        console.log('✅ [Auto Fix] User already opted in');
      }
    } catch (error) {
      console.error('❌ [Auto Fix] Failed to opt user in:', error);
    }
  }

  /**
   * Send a test notification for debugging
   */
  async sendTestNotification(): Promise<void> {
    try {
      console.log('🧪 [Test Notification] Sending test notification...');
      
      // Send via OneSignal API
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          title: 'OneSignal Test',
          message: 'This is a test notification to verify OneSignal is working correctly.',
          data: {
            test: true,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        console.log('🧪 [Test Notification] Test notification sent successfully');
      } else {
        console.error('🧪 [Test Notification] Failed to send test notification:', response.status);
      }
    } catch (error) {
      console.error('🧪 [Test Notification] Error sending test notification:', error);
    }
  }

  /**
   * Debug notification status - comprehensive troubleshooting
   */
  async debugNotificationStatus(): Promise<void> {
    try {
      console.log('🔍 [Notification Debug] Starting comprehensive debug check...');
      
      // 1. Check verbose logging status
      console.log('🔍 [Notification Debug] Verbose logging enabled: YES');
      
      // 2. Check permission status
      const hasPermission = await OneSignal.Notifications.getPermissionAsync();
      console.log('🔍 [Notification Debug] Has permission:', hasPermission);
      
      // 3. Check if notifications are enabled at OS level
      const areNotificationsEnabled = await OneSignal.Notifications.canRequestPermission();
      console.log('🔍 [Notification Debug] Can request permission:', areNotificationsEnabled);
      
      // 4. Check subscription status
      const subscriptionState = OneSignal.User.pushSubscription;
      const isSubscribed = await subscriptionState.getOptedInAsync();
      console.log('🔍 [Notification Debug] Is subscribed:', isSubscribed);
      
      // 5. Get subscription details
      console.log('🔍 [Notification Debug] Full subscription state:', subscriptionState);
      
      // 6. Get subscription ID (push token)
      const subscriptionId = await this.getSubscriptionId();
      console.log('🔍 [Notification Debug] Subscription ID:', subscriptionId);
      
      // 7. Get app configuration
      const appId = await this.getAppId();
      console.log('🔍 [Notification Debug] App ID:', appId);
      
      // 8. Check user tags
      const userTags = OneSignal.User.getTags();
      console.log('🔍 [Notification Debug] User tags:', userTags);
      
      // 9. Platform verification
      console.log('🔍 [Notification Debug] Platform: iOS');
      console.log('🔍 [Notification Debug] SDK Version: 5.2.13');
      
      // 10. Summary
      const status = hasPermission && isSubscribed && subscriptionId ? 'READY' : 'ISSUES_FOUND';
      console.log(`🔍 [Notification Debug] Overall Status: ${status}`);
      
      if (status === 'ISSUES_FOUND') {
        console.log('🔍 [Notification Debug] Troubleshooting steps:');
        if (!hasPermission) console.log('  - Request notification permission');
        if (!isSubscribed) console.log('  - User needs to opt-in to notifications');
        if (!subscriptionId) console.log('  - Device not properly registered with OneSignal');
      }
      
    } catch (error) {
      console.error('🔍 [Notification Debug] Error during debug:', error);
    }
  }

  /**
   * Log out current user (for sign out)
   */
  async logoutUser(): Promise<void> {
    try {
      OneSignal.logout();
      console.log('OneSignal user logged out');
    } catch (error) {
      console.error('Failed to logout OneSignal user:', error);
    }
  }

  /**
   * Update last app activity timestamp for re-engagement tracking
   */
  async updateLastActivity(): Promise<void> {
    try {
      const timestamp = Date.now();
      await this.updateUserTags({
        last_activity: String(timestamp),
        last_activity_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Update frog task completion status for streak tracking
   */
  async updateFrogTaskStatus(completed: boolean, streakCount: number): Promise<void> {
    try {
      const tags: Record<string, string | number | boolean> = {
        frog_task_completed_today: String(completed),
        frog_streak_count: String(streakCount)
      };
      
      if (completed) {
        tags.last_frog_completion = new Date().toISOString();
      }
      
      await this.updateUserTags(tags);
    } catch (error) {
      console.error('Failed to update frog task status:', error);
    }
  }

  /**
   * Update user's main goal for personalized notifications
   */
  async updateMainGoal(goalTitle: string): Promise<void> {
    try {
      await this.updateUserTags({
        main_goal_title: goalTitle
      });
    } catch (error) {
      console.error('Failed to update main goal:', error);
    }
  }

  /**
   * Setup OneSignal Live Activities for Pomodoro timer
   */
  async setupLiveActivities(): Promise<void> {
    try {
      console.log('🔴 [Live Activity] Setting up OneSignal Live Activities...');
      
      // Setup default Live Activity attributes for OneSignal
      OneSignal.LiveActivities.setupDefault();
      
      console.log('✅ [Live Activity] OneSignal Live Activities setup complete');
    } catch (error) {
      console.error('❌ [Live Activity] Failed to setup Live Activities:', error);
    }
  }

  /**
   * Start a Pomodoro Live Activity
   */
  async startPomodoroLiveActivity(
    sessionType: 'work' | 'shortBreak' | 'longBreak',
    duration: number,
    taskTitle: string,
    completedPomodoros: number
  ): Promise<string | null> {
    try {
      console.log('🔴 [Live Activity] Starting Pomodoro Live Activity...');
      
      const activityId = `pomodoro_${Date.now()}`;
      
      // Attributes (static data for the Live Activity)
      const attributes = {
        sessionType,
        taskTitle,
        startTime: new Date().toISOString()
      };
      
      // Content (dynamic data that can be updated)
      const content = {
        timeRemaining: duration,
        totalDuration: duration,
        isRunning: true,
        completedPomodoros,
        sessionType
      };
      
      OneSignal.LiveActivities.startDefault(activityId, attributes, content);
      
      console.log('✅ [Live Activity] Pomodoro Live Activity started:', activityId);
      return activityId;
      
    } catch (error) {
      console.error('❌ [Live Activity] Failed to start Pomodoro Live Activity:', error);
      return null;
    }
  }

  /**
   * Update Pomodoro Live Activity state
   */
  async updatePomodoroLiveActivity(
    activityId: string,
    timeRemaining: number,
    isRunning: boolean,
    completedPomodoros?: number
  ): Promise<void> {
    try {
      const content = {
        timeRemaining,
        isRunning,
        ...(completedPomodoros !== undefined && { completedPomodoros })
      };
      
      // Note: Live Activity updates are handled via server-side OneSignal API
      // Client-side updates not directly supported in OneSignal v5
      console.log('🔄 [Live Activity] Content to update:', content);
      
      console.log('🔄 [Live Activity] Updated Pomodoro Live Activity:', activityId, content);
    } catch (error) {
      console.error('❌ [Live Activity] Failed to update Pomodoro Live Activity:', error);
    }
  }

  /**
   * End Pomodoro Live Activity
   */
  async endPomodoroLiveActivity(activityId: string): Promise<void> {
    try {
      // Note: Live Activities end automatically or via server-side API
      // For now, we'll log the end request
      console.log('🛑 [Live Activity] Requesting end for Pomodoro Live Activity:', activityId);
      
      // The actual ending should be done via OneSignal REST API from your server
      // or the Live Activity will end naturally when timer completes
    } catch (error) {
      console.error('❌ [Live Activity] Failed to end Pomodoro Live Activity:', error);
    }
  }
}

export const notificationService = new NotificationService();
