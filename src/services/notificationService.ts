import { OneSignal, LogLevel } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

class NotificationService {
  private isInitialized = false;
  private appId: string;

  constructor() {
    this.appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '';
  }

  /**
   * Initialize OneSignal SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.appId) {
      return;
    }

    try {
      // Enable verbose logging for debugging (remove in production)
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);

      // Initialize with your OneSignal App ID
      OneSignal.initialize(this.appId);

      // Set up event listeners
      this.setupEventListeners();

      // Link user if authenticated
      await this.linkCurrentUser();

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
   * Update user tags for personalized notifications
   */
  async updateUserTags(tags: Record<string, string | number | boolean>): Promise<void> {
    try {
      OneSignal.User.addTags(tags);
      console.log('OneSignal tags updated:', tags);
    } catch (error) {
      console.error('Failed to update OneSignal tags:', error);
    }
  }

  /**
   * Set up event listeners for push notifications
   */
  private setupEventListeners(): void {
    // Listen for notification clicks
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('OneSignal: notification clicked', event);
      this.handleNotificationClick(event);
    });

    // Listen for notification received (when app is in foreground)
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('OneSignal: notification received in foreground', event);
      // Allow the notification to be displayed
      event.getNotification().display();
    });

    // Listen for permission changes
    OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
      console.log('OneSignal: permission changed', granted);
    });

    // Listen for subscription changes
    OneSignal.User.pushSubscription.addEventListener('change', (subscription) => {
      console.log('OneSignal: subscription changed', subscription);
    });
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(event: any): void {
    const notification = event.notification;
    const data = notification.additionalData;

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
      const subscription = OneSignal.User.pushSubscription.getPushSubscriptionId();
      return subscription;
    } catch (error) {
      console.error('Failed to get OneSignal player ID:', error);
      return null;
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
        last_activity: timestamp,
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
        frog_task_completed_today: completed,
        frog_streak_count: streakCount
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
