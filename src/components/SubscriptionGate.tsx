import React, { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../hooks/useSubscription';
import { Button } from './Button';

interface SubscriptionGateProps {
  children: ReactNode;
  feature: 'create_goal' | 'modify_data' | 'spark_ai_voice' | 'spark_ai_vision' | 'home_widgets';
  currentUsage?: number;
  currentGoalCount?: number;
  showUpgradePrompt?: boolean;
  upgradePromptTitle?: string;
  upgradePromptMessage?: string;
}

export function SubscriptionGate({ 
  children, 
  feature, 
  currentUsage = 0, 
  currentGoalCount = 0,
  showUpgradePrompt = false,
  upgradePromptTitle,
  upgradePromptMessage
}: SubscriptionGateProps) {
  const { t } = useTranslation();
  const subscription = useSubscription();

  const hasAccess = () => {
    switch (feature) {
      case 'create_goal':
        return subscription.canCreateGoal(currentGoalCount);
      case 'modify_data':
        return subscription.canModifyData();
      case 'spark_ai_voice':
        return subscription.canUseSparkAIVoice(currentUsage);
      case 'spark_ai_vision':
        return subscription.canUseSparkAIVision(currentUsage);
      case 'home_widgets':
        return subscription.canUseHomeScreenWidgets();
      default:
        return false;
    }
  };

  const getUpgradeMessage = () => {
    const limits = subscription.getUsageLimits();
    
    switch (feature) {
      case 'create_goal':
        const goalType = limits?.maxGoals === null ? t('subscriptionGate.upgradeMessages.unlimited') : t('subscriptionGate.upgradeMessages.more');
        return t('subscriptionGate.upgradeMessages.createGoal', { type: goalType });
      case 'spark_ai_voice':
        return t('subscriptionGate.upgradeMessages.sparkAIVoice');
      case 'spark_ai_vision':
        return t('subscriptionGate.upgradeMessages.sparkAIVision');
      case 'home_widgets':
        return t('subscriptionGate.upgradeMessages.homeWidgets');
      case 'modify_data':
        return t('subscriptionGate.upgradeMessages.modifyData');
      default:
        return upgradePromptMessage || t('subscriptionGate.defaultPrompt.message');
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (showUpgradePrompt) {
    return (
      <View style={{
        backgroundColor: '#F5EBE0',
        borderRadius: 16,
        padding: 20,
        margin: 16,
        borderWidth: 0.5,
        borderColor: '#364958',
        shadowColor: '#364958',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <Ionicons name="lock-closed" size={24} color="#364958" />
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#364958',
            marginLeft: 12,
            fontFamily: 'Helvetica',
          }}>
            {upgradePromptTitle || t('subscriptionGate.defaultPrompt.title')}
          </Text>
        </View>
        
        <Text style={{
          fontSize: 15,
          color: '#364958',
          marginBottom: 16,
          lineHeight: 22,
          fontFamily: 'Helvetica',
        }}>
          {getUpgradeMessage()}
        </Text>
        
        <Button
          title={t('subscriptionGate.button')}
          variant="primary"
          size="medium"
          onPress={() => router.push('/paywall?type=feature_upgrade')}
          style={{
            backgroundColor: '#364958',
          }}
          textStyle={{
            color: '#F5EBE0',
          }}
        />
      </View>
    );
  }

  // Return disabled/locked version of children
  return (
    <Pressable 
      onPress={() => router.push('/paywall?type=feature_upgrade')}
      style={{ opacity: 0.6 }}
    >
      {children}
    </Pressable>
  );
}
