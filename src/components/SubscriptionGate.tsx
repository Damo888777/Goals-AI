import React, { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
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
  upgradePromptTitle = "Upgrade Required",
  upgradePromptMessage = "This feature requires a subscription."
}: SubscriptionGateProps) {
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
        return `You've reached your goal limit. Upgrade to create ${limits?.maxGoals === null ? 'unlimited' : 'more'} goals.`;
      case 'spark_ai_voice':
        return `You've used all your Spark AI voice inputs this month. Upgrade for more.`;
      case 'spark_ai_vision':
        return `You've used all your Spark AI vision images this month. Upgrade for more.`;
      case 'home_widgets':
        return `Home Screen Widgets are available with Achiever and Visionary tiers.`;
      case 'modify_data':
        return `Subscribe to create, edit, and manage your goals and tasks.`;
      default:
        return upgradePromptMessage;
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
            {upgradePromptTitle}
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
          title="View Subscription Plans"
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
