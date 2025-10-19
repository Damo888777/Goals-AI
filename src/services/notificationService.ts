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
   * Initialize OneSignal SDK (v5 API)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.appId) {
      return;
    }

    try {
      // Enable verbose logging for debugging (remove in production)
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      
      // Initialize with OneSignal App ID
      OneSignal.initialize(this.appId);
      
      this.setupEventListeners();
      this.isInitialized = true;
      
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
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
   * Debug notification status and permissions
   */
  async debugNotificationStatus(): Promise<void> {
    try {
      console.log('🔍 [Notification Debug] Starting debug check...');
      
      // Check permission status
      const hasPermission = await OneSignal.Notifications.hasPermission();
      console.log('🔍 [Notification Debug] Has permission:', hasPermission);
      
      // Check if user is subscribed
      const subscriptionState = OneSignal.User.pushSubscription;
      console.log('🔍 [Notification Debug] Subscription state:', subscriptionState);
      
      // Get subscription ID
      const subscriptionId = await this.getSubscriptionId();
      console.log('🔍 [Notification Debug] Subscription ID:', subscriptionId ? 'EXISTS' : 'MISSING');
      
      // Check app ID
      const appId = await this.getAppId();
      console.log('🔍 [Notification Debug] App ID:', appId ? 'CONFIGURED' : 'MISSING');
      
      console.log('🔍 [Notification Debug] Debug complete');
    } catch (error) {
      console.error('🔍 [Notification Debug] Error:', error);
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
}

export const notificationService = new NotificationService();
