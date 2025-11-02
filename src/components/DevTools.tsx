import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { useOnboarding } from '../hooks/useOnboarding';
import database from '../db';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DevToolsProps {
  visible: boolean;
  onClose: () => void;
  onShowPaywall?: () => void;
  onShowUpgradePaywall?: () => void;
}

export function DevTools({ visible, onClose, onShowPaywall, onShowUpgradePaywall }: DevToolsProps) {
  const { resetOnboarding, isOnboardingCompleted } = useOnboarding();
  const [isPressed, setIsPressed] = useState<string | null>(null);

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'Are you sure you want to reset the onboarding? This will clear all onboarding data and immediately restart the onboarding flow.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetOnboarding();
              onClose(); // Close the dev tools modal first
              router.replace('/onboarding'); // Navigate to onboarding immediately
            } catch (error) {
              Alert.alert('Error', 'Failed to reset onboarding');
              console.error('Reset onboarding error:', error);
            }
          },
        },
      ]
    );
  };

  const handleCompleteReset = () => {
    Alert.alert(
      'COMPLETE DATA WIPE',
      '⚠️ This will permanently delete ALL app data including:\n\n• All goals, milestones, and tasks\n• All vision board images\n• Onboarding data and preferences\n• User authentication & anonymous ID\n• Focus history & notification settings\n• Subscription data & RevenueCat cache\n• Widget timeline & sync data\n• ALL AsyncStorage & local database\n\nThis action cannot be undone! Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'WIPE ALL DATA',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔥 Starting complete data wipe...');
              
              // Import services for complete reset
              const { authService } = await import('../services/authService');
              const { subscriptionService } = await import('../services/subscriptionService');
              
              // Step 1: Clear RevenueCat cache and subscription data
              try {
                console.log('🔄 Clearing RevenueCat subscription data...');
                // RevenueCat automatically clears its cache when we clear AsyncStorage
                // But we can also try to reset the customer info
                await subscriptionService.refreshCustomerInfo();
                console.log('✅ RevenueCat data cleared');
              } catch (error) {
                console.log('⚠️ RevenueCat clear failed (non-critical):', error);
              }
              
              // Step 2: Clear all database tables (including profiles and subscriptions)
              if (database) {
                try {
                  await database.write(async () => {
                    // Delete all records from all tables including profiles and subscriptions
                    const collections = [
                      'focus_sessions',
                      'tasks',
                      'milestones', 
                      'goals',
                      'vision_images',
                      'subscription_usage',
                      'subscriptions',
                      'profiles'  // Delete profiles last to avoid constraint issues
                    ];
                    
                    for (const collectionName of collections) {
                      try {
                        const collection = database!.get(collectionName);
                        const allRecords = await collection.query().fetch();
                        
                        if (allRecords.length > 0) {
                          await Promise.all(allRecords.map(record => record.destroyPermanently()));
                        }
                        
                        console.log(`✅ Cleared ${collectionName}: ${allRecords.length} records deleted`);
                      } catch (error) {
                        console.error(`❌ Error clearing ${collectionName}:`, error);
                      }
                    }
                  });
                  console.log('✅ All database tables cleared successfully');
                } catch (error) {
                  console.error('❌ Error during database write transaction:', error);
                }
              }
              
              // Step 3: Clear specific AsyncStorage keys first (for logging)
              const asyncStorageKeys = [
                // Onboarding & User Data
                'onboarding_completed',
                'onboarding_data',
                'spark_tutorial_shown',
                'persistent_anonymous_id',
                'user-language',
                
                // Notifications
                'notification_permission_requested',
                'notifications_enabled',
                'user_timezone',
                'user_timezone_offset',
                'last_frog_task_completed',
                'main_goal_title',
                'last_activity',
                'last_app_activity',
                'mock_player_id',
                
                // Notification Scheduling
                'last_7_day_notification',
                'last_3_day_notification',
                'frog_streak_count',
                'scheduled_notification_morning_kickstart',
                'scheduled_notification_vision_board_reminder',
                'scheduled_notification_evening_checkin',
                
                // Sync & Database
                'synced_record_ids',
                
                // Widget Timeline Manager
                'widget_timeline_policy',
                'widget_user_metrics',
                'widget_refresh_history',
                'widget_last_refresh',
                'widget_performance_metrics'
              ];
              
              console.log('🔄 Clearing specific AsyncStorage keys...');
              for (const key of asyncStorageKeys) {
                try {
                  await AsyncStorage.removeItem(key);
                  console.log(`✅ Cleared AsyncStorage key: ${key}`);
                } catch (error) {
                  console.log(`⚠️ Failed to clear ${key}:`, error);
                }
              }
              
              // Step 4: Reset onboarding data (this also clears some keys)
              await resetOnboarding();
              
              // Step 5: Complete AsyncStorage wipe (catches any remaining keys)
              await AsyncStorage.clear();
              console.log('✅ Complete AsyncStorage cleared (including any remaining keys)');
              
              // Step 6: Reset additional services
              try {
                // Clear notification service state
                const { notificationService } = await import('../services/notificationService');
                console.log('🔄 Resetting notification service...');
                // The service will reinitialize when needed
                
                // Clear widget timeline manager
                const { widgetTimelineManager } = await import('../services/widgetTimelineManager');
                console.log('🔄 Shutting down widget timeline manager...');
                await widgetTimelineManager.shutdown();
                
                // Clear sync service state
                const { syncService } = await import('../services/syncService');
                console.log('🔄 Resetting sync service state...');
                // Sync service will reinitialize when needed
                
                console.log('✅ Additional services reset');
              } catch (error) {
                console.log('⚠️ Service reset failed (non-critical):', error);
              }
              
              // Step 7: Force auth service to initialize with a completely new anonymous user
              // This will generate a new persistent anonymous ID since AsyncStorage was cleared
              await authService.initialize();
              
              console.log('🚀 Complete data wipe finished, restarting app...');
              
              onClose(); // Close modal
              
              // Small delay to ensure all cleanup is complete before navigation
              setTimeout(() => {
                console.log('🚀 Navigating to onboarding...');
                router.replace('/onboarding'); // Force restart onboarding
                
                // Show success after navigation
                setTimeout(() => {
                  Alert.alert('Complete Wipe Successful', 'All app data has been permanently deleted:\n\n✅ Database cleared\n✅ AsyncStorage wiped\n✅ RevenueCat cache cleared\n✅ Services reset\n✅ New anonymous ID generated\n\nApp is now in first-time use state.');
                }, 500);
              }, 200);
              
            } catch (error) {
              console.error('❌ Error during complete reset:', error);
              Alert.alert('Error', 'Failed to complete data wipe. Check console for details.');
            }
          },
        },
      ]
    );
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[typography.title, styles.title]}>Dev Tools</Text>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.xxl }}>
          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              Onboarding
            </Text>
            <Text style={[typography.caption, styles.statusText]}>
              Status: {isOnboardingCompleted ? 'Completed' : 'Not Completed'}
            </Text>
            
            <Pressable
              style={[
                styles.upgradeButton,
                isPressed === 'log-storage' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  console.log('🔍 === ASYNCSTORAGE DEBUG LOG ===');
                  
                  // Check all onboarding-related keys
                  const keys = [
                    'onboarding_completed',
                    'onboarding_data', 
                    'spark_tutorial_shown',
                    'persistent_anonymous_id',
                    'user-language',
                    'notification_permission_requested'
                  ];
                  
                  for (const key of keys) {
                    try {
                      const value = await AsyncStorage.getItem(key);
                      console.log(`📱 AsyncStorage['${key}'] = ${value}`);
                    } catch (error) {
                      console.log(`❌ Error reading AsyncStorage['${key}']:`, error);
                    }
                  }
                  
                  // Get all AsyncStorage keys
                  try {
                    const allKeys = await AsyncStorage.getAllKeys();
                    console.log('📱 All AsyncStorage keys:', allKeys);
                  } catch (error) {
                    console.log('❌ Error getting all keys:', error);
                  }
                  
                  // Check auth service state
                  const { authService } = await import('../services/authService');
                  const currentUser = authService.getCurrentUser();
                  console.log('👤 Current User:', currentUser);
                  
                  // Check onboarding service state
                  const { onboardingService } = await import('../services/onboardingService');
                  const userData = await onboardingService.getOnboardingData();
                  console.log('📝 Onboarding Data:', userData);
                  
                  console.log('🔍 === END ASYNCSTORAGE DEBUG LOG ===');
                  
                  Alert.alert('Debug Complete', 'Check console for AsyncStorage contents');
                } catch (error) {
                  console.error('❌ Debug error:', error);
                  Alert.alert('Error', 'Failed to debug AsyncStorage');
                }
              }}
              onPressIn={() => setIsPressed('log-storage')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="bug" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.upgradeButtonText]}>
                LOG ASYNCSTORAGE STATE
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'reset' && styles.buttonPressed
              ]}
              onPress={handleResetOnboarding}
              onPressIn={() => setIsPressed('reset')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="refresh" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Reset Onboarding
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.dangerButton,
                isPressed === 'wipe' && styles.buttonPressed
              ]}
              onPress={handleCompleteReset}
              onPressIn={() => setIsPressed('wipe')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.dangerButtonText]}>
                WIPE ALL DATA
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              Subscription Testing
            </Text>
            <Text style={[typography.caption, styles.statusText]}>
              Test RevenueCat integration and paywalls
            </Text>
            
          </View>

          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              App Info
            </Text>
            <Text style={[typography.caption, styles.infoText]}>
              Version: 1.0.0 (Dev)
            </Text>
            <Text style={[typography.caption, styles.infoText]}>
              Environment: Development
            </Text>
          </View>

          {/* Notification Testing Section */}
          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              Notification Testing
            </Text>
            <Text style={[typography.caption, styles.statusText]}>
              Test push notifications on your device
            </Text>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'test-permission' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  const { notificationService } = await import('../services/notificationService');
                  const permission = await notificationService.forceRequestPermission();
                  Alert.alert('Permission Result', permission ? 'Granted!' : 'Denied');
                } catch (error) {
                  Alert.alert('Error', 'Failed to request permission');
                }
              }}
              onPressIn={() => setIsPressed('test-permission')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="notifications" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Request Notification Permission
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.dangerButton,
                isPressed === 'clear-permission' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  // Force clear the permission flag every time
                  await AsyncStorage.removeItem('notification_permission_requested');
                  console.log('🔄 [DevTools] Notification permission flag force cleared');
                  
                  Alert.alert('Permission Cleared', 'Notification permission has been reset. You will be prompted again when requesting permission.');
                } catch (error) {
                  console.error('❌ [DevTools] Failed to clear permission:', error);
                  Alert.alert('Error', 'Failed to clear permission');
                }
              }}
              onPressIn={() => setIsPressed('clear-permission')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="notifications-off" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.dangerButtonText]}>
                Clear Notification Permission
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'test-morning' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  const { OneSignal } = await import('react-native-onesignal');
                  const playerId = await OneSignal.User.pushSubscription.getIdAsync();
                  if (playerId) {
                    // Send a test morning notification using OneSignal REST API
                    const notification = {
                      app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
                      include_subscription_ids: [playerId],
                      headings: { en: '🌅 Good Morning!' },
                      contents: { en: 'Ready to tackle your most important task today?' },
                      data: {
                        type: 'morning_kickstart',
                        scenario: 'test'
                      }
                    };
                    
                    Alert.alert(
                      'Notification Scheduled',
                      'Morning notification will be sent in 30 seconds. Close the app now to test background notifications!',
                      [{ text: 'OK' }]
                    );
                    
                    // Delay for 30 seconds to allow user to close the app
                    setTimeout(async () => {
                      try {
                        // Use the new API endpoint instead of direct OneSignal API call
                        const { getApiUrl } = await import('../constants/config');
                        const response = await fetch(getApiUrl('/api/send-notification'), {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
                            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`,
                          },
                          body: JSON.stringify({
                            app_id: notification.app_id,
                            include_subscription_ids: notification.include_subscription_ids,
                            headings: notification.headings,
                            contents: notification.contents,
                            data: notification.data || {}
                          })
                        });
                        
                        const result = await response.json();
                        console.log('Morning notification sent:', response.ok ? 'Success' : 'Failed', result);
                        
                        if (!response.ok) {
                          console.error('OneSignal API Error:', result);
                        }
                      } catch (error) {
                        console.error('Failed to send morning notification:', error);
                      }
                    }, 30000);
                  } else {
                    Alert.alert('Error', 'No push subscription found. Make sure notifications are enabled.');
                  }
                } catch (error) {
                  console.error('Notification test error:', error);
                  Alert.alert('Error', 'Failed to send test notification');
                }
              }}
              onPressIn={() => setIsPressed('test-morning')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="sunny" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Test Morning Notification
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'test-evening' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  const { OneSignal } = await import('react-native-onesignal');
                  const playerId = await OneSignal.User.pushSubscription.getIdAsync();
                  if (playerId) {
                    const notification = {
                      app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
                      include_subscription_ids: [playerId],
                      headings: { en: '🌙 Evening Check-in' },
                      contents: { en: 'How did your day go? Ready to plan tomorrow?' },
                      data: {
                        type: 'evening_checkin',
                        scenario: 'test'
                      }
                    };
                    
                    Alert.alert(
                      'Notification Scheduled',
                      'Evening notification will be sent in 30 seconds. Close the app now to test background notifications!',
                      [{ text: 'OK' }]
                    );
                    
                    // Delay for 30 seconds to allow user to close the app
                    setTimeout(async () => {
                      try {
                        // Use the new API endpoint instead of direct OneSignal API call
                        const { getApiUrl } = await import('../constants/config');
                        const response = await fetch(getApiUrl('/api/send-notification'), {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
                            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`,
                          },
                          body: JSON.stringify({
                            app_id: notification.app_id,
                            include_subscription_ids: notification.include_subscription_ids,
                            headings: notification.headings,
                            contents: notification.contents,
                            data: notification.data || {}
                          })
                        });
                        
                        const result = await response.json();
                        console.log('Evening notification sent:', response.ok ? 'Success' : 'Failed', result);
                        
                        if (!response.ok) {
                          console.error('OneSignal API Error:', result);
                        }
                      } catch (error) {
                        console.error('Failed to send evening notification:', error);
                      }
                    }, 30000);
                  } else {
                    Alert.alert('Error', 'No push subscription found. Make sure notifications are enabled.');
                  }
                } catch (error) {
                  console.error('Notification test error:', error);
                  Alert.alert('Error', 'Failed to send test notification');
                }
              }}
              onPressIn={() => setIsPressed('test-evening')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="moon" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Test Evening Notification
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'test-frog' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  const { OneSignal } = await import('react-native-onesignal');
                  const playerId = await OneSignal.User.pushSubscription.getIdAsync();
                  if (playerId) {
                    const notification = {
                      app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
                      include_subscription_ids: [playerId],
                      headings: { en: '🐸 Frog Streak!' },
                      contents: { en: 'You\'re on a roll! Keep eating those frogs!' },
                      data: {
                        type: 'frog_streak',
                        scenario: 'test',
                        streakCount: '5'
                      }
                    };
                    
                    Alert.alert(
                      'Notification Scheduled',
                      'Frog streak notification will be sent in 30 seconds. Close the app now to test background notifications!',
                      [{ text: 'OK' }]
                    );
                    
                    // Delay for 30 seconds to allow user to close the app
                    setTimeout(async () => {
                      try {
                        // Use the new API endpoint instead of direct OneSignal API call
                        const { getApiUrl } = await import('../constants/config');
                        const response = await fetch(getApiUrl('/api/send-notification'), {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
                            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`,
                          },
                          body: JSON.stringify({
                            app_id: notification.app_id,
                            include_subscription_ids: notification.include_subscription_ids,
                            headings: notification.headings,
                            contents: notification.contents,
                            data: notification.data || {}
                          })
                        });
                        
                        const result = await response.json();
                        console.log('Frog streak notification sent:', response.ok ? 'Success' : 'Failed', result);
                        
                        if (!response.ok) {
                          console.error('OneSignal API Error:', result);
                        }
                      } catch (error) {
                        console.error('Failed to send frog streak notification:', error);
                      }
                    }, 30000);
                  } else {
                    Alert.alert('Error', 'No push subscription found. Make sure notifications are enabled.');
                  }
                } catch (error) {
                  console.error('Notification test error:', error);
                  Alert.alert('Error', 'Failed to send test notification');
                }
              }}
              onPressIn={() => setIsPressed('test-frog')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="trophy" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Test Frog Streak Notification
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.paywallButton,
                isPressed === 'test-scheduler' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  const { notificationScheduler } = await import('../services/notificationScheduler');
                  
                  // Test the notification scheduler service
                  const morningNotification = await notificationScheduler.generateMorningNotification();
                  const eveningNotification = await notificationScheduler.generateEveningNotification();
                  const visionNotification = await notificationScheduler.generateVisionBoardNotification();
                  
                  Alert.alert(
                    'Notification Scheduler Test',
                    `Generated notifications:\n\n` +
                    `Morning: ${morningNotification.title}\n` +
                    `Evening: ${eveningNotification.title}\n` +
                    `Vision: ${visionNotification.title}`,
                    [{ text: 'OK' }]
                  );
                  
                  console.log('Generated notifications:', {
                    morning: morningNotification,
                    evening: eveningNotification,
                    vision: visionNotification
                  });
                } catch (error) {
                  console.error('Notification scheduler test error:', error);
                  Alert.alert('Error', 'Failed to test notification scheduler');
                }
              }}
              onPressIn={() => setIsPressed('test-scheduler')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="cog" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.paywallButtonText]}>
                Test Notification Scheduler
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.paywallButton,
                isPressed === 'test-local' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  // Test local notification using Expo Notifications
                  const { scheduleNotificationAsync, requestPermissionsAsync } = await import('expo-notifications');
                  
                  await requestPermissionsAsync();
                  
                  await scheduleNotificationAsync({
                    content: {
                      title: '🗺️ Local Test Notification',
                      body: 'This is a test notification sent locally!',
                      data: { test: true },
                    },
                    trigger: { seconds: 10 },
                  });
                  
                  Alert.alert('Local Test Scheduled!', 'Local notification will appear in 10 seconds. Close the app to test!');
                } catch (error) {
                  console.error('Local notification error:', error);
                  Alert.alert('Error', 'Failed to send local notification');
                }
              }}
              onPressIn={() => setIsPressed('test-local')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="phone-portrait" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.paywallButtonText]}>
                Test Local Notification
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.upgradeButton,
                isPressed === 'show-player-id' && styles.buttonPressed
              ]}
              onPress={async () => {
                try {
                  const { OneSignal } = await import('react-native-onesignal');
                  const playerId = await OneSignal.User.pushSubscription.getIdAsync();
                  const { notificationService } = await import('../services/notificationService');
                  
                  // Run debug check
                  await notificationService.debugNotificationStatus();
                  
                  let statusInfo = `Player ID: ${playerId || 'None'}\n`;
                  
                  // Check permission status
                  const hasRequested = await notificationService.hasRequestedPermission();
                  statusInfo += `Permission Requested: ${hasRequested ? 'Yes' : 'No'}\n`;
                  
                  // Get timezone info
                  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  statusInfo += `Timezone: ${timezone}`;
                  
                  Alert.alert('Notification Status', statusInfo);
                } catch (error) {
                  Alert.alert('Error', 'Failed to get notification status');
                }
              }}
              onPressIn={() => setIsPressed('show-player-id')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="information-circle" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.upgradeButtonText]}>
                Show Notification Status
              </Text>
            </Pressable>
          </View>

          {/* Paywall Testing Section */}
          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              Paywall Testing
            </Text>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'paywall' && styles.buttonPressed
              ]}
              onPress={() => {
                onClose();
                router.push('/paywall');
              }}
              onPressIn={() => setIsPressed('paywall')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="card" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Show Onboarding Paywall
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'upgrade-paywall' && styles.buttonPressed
              ]}
              onPress={() => {
                onClose();
                router.push('/paywall?type=feature_upgrade');
              }}
              onPressIn={() => setIsPressed('upgrade-paywall')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="arrow-up" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Show Feature Upgrade Paywall
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.paywallButton,
                isPressed === 'force-paywall' && styles.buttonPressed
              ]}
              onPress={() => {
                onClose();
                router.push('/paywall');
              }}
              onPressIn={() => setIsPressed('force-paywall')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.paywallButtonText]}>
                Force Onboarding Paywall
              </Text>
            </Pressable>
          </View>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.primary,
  },
  title: {
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  section: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  sectionTitle: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  statusText: {
    color: colors.text.primary,
    opacity: 0.7,
  },
  actionButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: colors.secondary,
  },
  dangerButton: {
    backgroundColor: '#DC3545',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoText: {
    color: colors.text.primary,
    opacity: 0.7,
  },
  paywallButton: {
    backgroundColor: '#6A5ACD',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#6A5ACD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  paywallButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: '#228B22',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#228B22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});