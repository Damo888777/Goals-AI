import React, { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSubscription } from '../hooks/useSubscription';

interface AccessControlProps {
  children: ReactNode;
  feature: 'create_goal' | 'modify_data' | 'spark_ai_voice' | 'spark_ai_vision' | 'home_widgets';
  currentUsage?: number;
  currentGoalCount?: number;
  fallback?: ReactNode;
  showPaywall?: boolean;
}

export function AccessControl({ 
  children, 
  feature, 
  currentUsage = 0, 
  currentGoalCount = 0,
  fallback = null,
  showPaywall = true 
}: AccessControlProps) {
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

  const handleAccessDenied = () => {
    if (showPaywall) {
      router.push('/paywall?type=feature_upgrade');
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Return a wrapper that triggers paywall on interaction
  return (
    <Pressable onPress={handleAccessDenied}>
      {children}
    </Pressable>
  );
}

// Hook for programmatic access checks
export function useAccessControl() {
  const subscription = useSubscription();

  const checkAccess = (
    feature: AccessControlProps['feature'],
    options: { currentUsage?: number; currentGoalCount?: number } = {}
  ) => {
    const { currentUsage = 0, currentGoalCount = 0 } = options;

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

  const requireAccess = (
    feature: AccessControlProps['feature'],
    options: { currentUsage?: number; currentGoalCount?: number } = {}
  ) => {
    if (!checkAccess(feature, options)) {
      router.push('/paywall?type=feature_upgrade');
      return false;
    }
    return true;
  };

  return {
    checkAccess,
    requireAccess,
    subscription,
  };
}
