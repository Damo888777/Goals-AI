import React from 'react';
import { View, Text, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNotifications } from '../src/hooks/useNotifications';
import { BackChevronButton } from '../src/components/ChevronButton';
import { Button } from '../src/components/Button';
import { colors } from '../src/constants/colors';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { 
    isEnabled, 
    hasPermission, 
    isLoading, 
    enableNotifications, 
    disableNotifications 
  } = useNotifications();

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const success = await enableNotifications();
      if (!success) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders and progress updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // In a real app, you would open device settings
              console.log('Open device settings');
            }}
          ]
        );
      }
    } else {
      Alert.alert(
        'Disable Notifications',
        'Are you sure you want to disable notifications? You\'ll miss daily motivation and progress reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: disableNotifications }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: 20, 
          marginBottom: 32 
        }}>
          <BackChevronButton onPress={() => router.back()} />
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '600', 
            color: colors.text.primary,
            marginLeft: 16
          }}>
            Notifications
          </Text>
        </View>

        {/* Notification Settings */}
        <View style={{
          backgroundColor: colors.background.secondary,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.border.primary
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: 16
          }}>
            Daily Reminders
          </Text>

          {/* Main Toggle */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: colors.text.primary,
                marginBottom: 4
              }}>
                Enable Notifications
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.text.tertiary,
                lineHeight: 20
              }}>
                Get daily motivation and progress reminders
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isLoading}
              trackColor={{ 
                false: colors.background.primary, 
                true: colors.primary 
              }}
              thumbColor={isEnabled ? '#ffffff' : colors.text.tertiary}
            />
          </View>

          {/* Notification Types */}
          {isEnabled && (
            <>
              <View style={{
                height: 1,
                backgroundColor: colors.border.primary,
                marginBottom: 20
              }} />

              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text.primary,
                  marginBottom: 8
                }}>
                  Morning Kickstart (7:00 AM)
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.text.tertiary,
                  lineHeight: 20
                }}>
                  Daily reminder to set or tackle your "Eat the Frog" task
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text.primary,
                  marginBottom: 8
                }}>
                  Evening Check-in (6:00 PM)
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.text.tertiary,
                  lineHeight: 20
                }}>
                  Progress celebration and streak tracking
                </Text>
              </View>

              <View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text.primary,
                  marginBottom: 8
                }}>
                  Re-engagement Coach
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.text.tertiary,
                  lineHeight: 20
                }}>
                  Gentle reminders when you've been away for a few days
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Permission Status */}
        {!hasPermission && (
          <View style={{
            backgroundColor: '#FEF3C7',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#FDE68A'
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#92400E',
              marginBottom: 4
            }}>
              Permission Required
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#92400E',
              lineHeight: 20
            }}>
              To receive notifications, please enable them when prompted or in your device settings.
            </Text>
          </View>
        )}

        {/* Test Notification Button (Development) */}
        {__DEV__ && isEnabled && (
          <Button
            title="Test Notification"
            variant="secondary"
            onPress={() => {
              Alert.alert('Test Notification', 'In development, this would send a test notification.');
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
