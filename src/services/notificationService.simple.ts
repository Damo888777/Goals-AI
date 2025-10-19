import AsyncStorage from '@react-native-async-storage/async-storage';

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
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // For now, just mark as initialized
      // OneSignal integration will be added when API is fixed
      this.isInitialized = true;
      console.log('Notification service initialized (OneSignal integration pending)');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Store permission request
      await AsyncStorage.setItem('notification_permission_requested', 'true');
      await AsyncStorage.setItem('notifications_enabled', 'true');
      
      // Initialize timezone
      await this.initializeTimezone();
      
      console.log('Notification permission granted (mock)');
      return true;
    } catch (error) {
      console.error('Failed to request permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async hasPermission(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('notifications_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize user timezone tags
   */
  async initializeTimezone(): Promise<void> {
    try {
      const timezone = this.getUserTimezone();
      const timezoneOffset = this.getTimezoneOffset();
      
      // Store timezone locally
      await AsyncStorage.setItem('user_timezone', timezone);
      await AsyncStorage.setItem('user_timezone_offset', timezoneOffset.toString());
      
      console.log(`User timezone initialized: ${timezone} (UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})`);
    } catch (error) {
      console.error('Failed to initialize timezone:', error);
    }
  }

  /**
   * Update frog task completion status
   */
  async updateFrogTaskCompletion(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('last_frog_task_completed', completed.toString());
      console.log('Frog task completion updated:', completed);
    } catch (error) {
      console.error('Failed to update frog task completion:', error);
    }
  }

  /**
   * Update main goal for personalization
   */
  async updateMainGoal(goalTitle: string): Promise<void> {
    try {
      await AsyncStorage.setItem('main_goal_title', goalTitle);
      console.log('Main goal updated:', goalTitle);
    } catch (error) {
      console.error('Failed to update main goal:', error);
    }
  }

  /**
   * Update user activity timestamp
   */
  async updateActivity(): Promise<void> {
    try {
      await AsyncStorage.setItem('last_activity', Date.now().toString());
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  /**
   * Get player ID (mock for now)
   */
  async getPlayerId(): Promise<string | null> {
    try {
      let playerId = await AsyncStorage.getItem('mock_player_id');
      if (!playerId) {
        playerId = 'mock_' + Math.random().toString(36).substring(2, 15);
        await AsyncStorage.setItem('mock_player_id', playerId);
      }
      return playerId;
    } catch (error) {
      return null;
    }
  }
}

export const notificationService = new NotificationService();
