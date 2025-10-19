import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '../services/notificationService';
import { notificationScheduler } from '../services/notificationScheduler';
import { useAuth } from './useDatabase';

interface NotificationState {
  isEnabled: boolean;
  hasPermission: boolean;
  isLoading: boolean;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    isEnabled: false,
    hasPermission: false,
    isLoading: true
  });
  const { user } = useAuth();

  // Check notification status on mount
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  // Link user when authentication changes
  useEffect(() => {
    if (user) {
      notificationService.linkCurrentUser();
    }
  }, [user]);

  // Handle app state changes for activity tracking
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active - update last activity
        notificationScheduler.updateLastActivity();
      } else if (nextAppState === 'background') {
        // App went to background - check for re-engagement notifications
        notificationScheduler.checkReEngagementNotification();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  /**
   * Check current notification status
   */
  const checkNotificationStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [isEnabled, hasRequestedBefore] = await Promise.all([
        notificationScheduler.areNotificationsEnabled(),
        notificationService.hasRequestedPermission()
      ]);

      setState({
        isEnabled,
        hasPermission: hasRequestedBefore,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to check notification status:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Enable notifications and request permission
   */
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const success = await notificationScheduler.enableNotifications();
      
      if (success) {
        setState({
          isEnabled: true,
          hasPermission: true,
          isLoading: false
        });
        
        // Update user tags for personalization
        await notificationService.updateUserTags({
          notifications_enabled: true,
          notification_enabled_date: new Date().toISOString()
        });
        
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          hasPermission: false 
        }));
        return false;
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  /**
   * Disable notifications
   */
  const disableNotifications = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await notificationScheduler.disableNotifications();
      
      setState(prev => ({
        ...prev,
        isEnabled: false,
        isLoading: false
      }));
      
      // Update user tags
      await notificationService.updateUserTags({
        notifications_enabled: false,
        notification_disabled_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Update frog task completion and trigger streak update
   */
  const updateFrogTaskCompletion = useCallback(async (completed: boolean): Promise<number> => {
    try {
      const newStreakCount = await notificationScheduler.updateFrogStreak(completed);
      
      // Update user tags for personalized notifications
      await notificationService.updateUserTags({
        frog_task_completed_today: completed,
        frog_streak_count: newStreakCount,
        last_frog_update: new Date().toISOString()
      });
      
      return newStreakCount;
    } catch (error) {
      console.error('Failed to update frog task completion:', error);
      return 0;
    }
  }, []);

  /**
   * Update main goal for personalized notifications
   */
  const updateMainGoal = useCallback(async (goalTitle: string): Promise<void> => {
    try {
      await notificationService.updateMainGoal(goalTitle);
    } catch (error) {
      console.error('Failed to update main goal:', error);
    }
  }, []);

  /**
   * Manually trigger activity update (for user interactions)
   */
  const updateActivity = useCallback(async (): Promise<void> => {
    try {
      await notificationScheduler.updateLastActivity();
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }, []);

  /**
   * Get OneSignal player ID for server-side notifications
   */
  const getPlayerId = useCallback(async (): Promise<string | null> => {
    try {
      return await notificationService.getPlayerId();
    } catch (error) {
      console.error('Failed to get player ID:', error);
      return null;
    }
  }, []);

  return {
    // State
    isEnabled: state.isEnabled,
    hasPermission: state.hasPermission,
    isLoading: state.isLoading,
    
    // Actions
    enableNotifications,
    disableNotifications,
    updateFrogTaskCompletion,
    updateMainGoal,
    updateActivity,
    getPlayerId,
    refreshStatus: checkNotificationStatus
  };
};
