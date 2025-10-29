import React from 'react';
import { View, Text, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../src/hooks/useNotifications';
import { BackChevronButton } from '../src/components/ChevronButton';
import { Button } from '../src/components/Button';
import { colors } from '../src/constants/colors';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
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
          t('notificationSettings.alerts.permissionRequired'),
          t('notificationSettings.alerts.enableInSettings'),
          [
            { text: t('notificationSettings.alerts.cancel'), style: 'cancel' },
            { text: t('notificationSettings.alerts.settings'), onPress: () => {
              // In a real app, you would open device settings
              console.log('Open device settings');
            }}
          ]
        );
      }
    } else {
      Alert.alert(
        t('notificationSettings.alerts.disableNotifications'),
        t('notificationSettings.alerts.disableConfirmation'),
        [
          { text: t('notificationSettings.alerts.cancel'), style: 'cancel' },
          { text: t('notificationSettings.alerts.disable'), style: 'destructive', onPress: disableNotifications }
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
            {t('notificationSettings.header.title')}
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
            {t('notificationSettings.sections.dailyReminders')}
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
                {t('notificationSettings.mainToggle.enableNotifications')}
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.text.tertiary,
                lineHeight: 20
              }}>
                {t('notificationSettings.mainToggle.description')}
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
                  {t('notificationSettings.notificationTypes.morningKickstart')}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.text.tertiary,
                  lineHeight: 20
                }}>
                  {t('notificationSettings.notificationTypes.morningDescription')}
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text.primary,
                  marginBottom: 8
                }}>
                  {t('notificationSettings.notificationTypes.eveningCheckin')}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.text.tertiary,
                  lineHeight: 20
                }}>
                  {t('notificationSettings.notificationTypes.eveningDescription')}
                </Text>
              </View>

              <View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text.primary,
                  marginBottom: 8
                }}>
                  {t('notificationSettings.notificationTypes.reengagementCoach')}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.text.tertiary,
                  lineHeight: 20
                }}>
                  {t('notificationSettings.notificationTypes.reengagementDescription')}
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
              {t('notificationSettings.permissionStatus.title')}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#92400E',
              lineHeight: 20
            }}>
              {t('notificationSettings.permissionStatus.description')}
            </Text>
          </View>
        )}

        {/* Test Notification Button (Development) */}
        {__DEV__ && isEnabled && (
          <Button
            title={t('notificationSettings.testButton.title')}
            variant="secondary"
            onPress={() => {
              Alert.alert(t('notificationSettings.testButton.alertTitle'), t('notificationSettings.testButton.alertMessage'));
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
