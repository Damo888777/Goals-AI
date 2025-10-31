import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { CustomerInfo } from 'react-native-purchases';
import { subscriptionService, SubscriptionTier, SubscriptionPlan } from '../services/subscriptionService';

interface SubscriptionContextType {
  // State
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  currentTier: SubscriptionTier | null;
  isSubscribed: boolean;
  isCurrentSubscriptionAnnual: boolean;
  subscriptionPlans: SubscriptionPlan[];
  
  // Actions
  refreshSubscription: () => Promise<void>;
  purchasePackage: (plan: SubscriptionPlan) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  redeemPromoCode: (promoCode: string) => Promise<{ success: boolean; error?: string; discount?: string }>;
  validateCustomPromoCode: (promoCode: string) => Promise<{ success: boolean; error?: string; discount?: string }>;
  
  // Access Control
  canCreateGoal: (currentGoalCount: number) => boolean;
  canUseSparkAIVoice: (currentUsage: number) => boolean;
  canUseSparkAIVision: (currentUsage: number) => boolean;
  canUseHomeScreenWidgets: () => boolean;
  canModifyData: () => boolean;
  getUsageLimits: () => SubscriptionTier | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [isCurrentSubscriptionAnnual, setIsCurrentSubscriptionAnnual] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

  // Initialize and refresh subscription data
  const refreshSubscription = async () => {
    setIsLoading(true);
    try {
      console.log('Starting subscription refresh...');
      
      // Store previous tier to detect expiration
      const previousTier = currentTier;
      
      // Initialize RevenueCat if not already done
      await subscriptionService.initialize();
      console.log('RevenueCat initialized');
      
      // Refresh customer info and load offerings
      const newCustomerInfo = await subscriptionService.refreshCustomerInfo();
      console.log('Customer info refreshed');
      
      await subscriptionService.loadOfferings();
      console.log('Offerings loaded');
      
      // Update state
      setCustomerInfo(newCustomerInfo);
      const newTier = subscriptionService.getCurrentTier();
      setCurrentTier(newTier);
      setIsCurrentSubscriptionAnnual(subscriptionService.isCurrentSubscriptionAnnual());
      
      const plans = subscriptionService.getSubscriptionPlans();
      console.log('Generated subscription plans:', plans);
      setSubscriptionPlans(plans);
      
      // Check if we need to force onboarding paywall
      const shouldForcePaywall = 
        plans.length === 0 || // No subscription tiers available
        (previousTier && !newTier); // Had subscription but now expired
        
      if (shouldForcePaywall) {
        console.log('🚨 Forcing onboarding paywall - no tiers available or subscription expired');
        const { router } = await import('expo-router');
        router.replace('/onboarding-paywall');
      }
      
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Purchase a subscription package
  const purchasePackage = async (plan: SubscriptionPlan): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await subscriptionService.purchasePackage(plan.package);
      
      if (result.success) {
        // Update local state
        if (result.customerInfo) {
          setCustomerInfo(result.customerInfo);
        }
        setCurrentTier(subscriptionService.getCurrentTier());
        return { success: true };
      } else {
        return { success: false, error: 'Purchase was cancelled' };
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      return { 
        success: false, 
        error: error.message || 'Purchase failed. Please try again.' 
      };
    }
  };

  // Restore previous purchases
  const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const restoredCustomerInfo = await subscriptionService.restorePurchases();
      
      // Update local state
      setCustomerInfo(restoredCustomerInfo);
      setCurrentTier(subscriptionService.getCurrentTier());
      
      return { success: true };
    } catch (error: any) {
      console.error('Restore purchases failed:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to restore purchases. Please try again.' 
      };
    }
  };

  // Redeem promotional code
  const redeemPromoCode = async (promoCode: string): Promise<{ success: boolean; error?: string; discount?: string }> => {
    try {
      const result = await subscriptionService.redeemPromoCode(promoCode);
      
      if (result.success) {
        // Refresh subscription state after successful redemption
        await refreshSubscription();
      }
      
      return result;
    } catch (error: any) {
      console.error('Redeem promo code failed:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to redeem promo code. Please try again.' 
      };
    }
  };

  // Validate custom promotional code
  const validateCustomPromoCode = async (promoCode: string): Promise<{ success: boolean; error?: string; discount?: string }> => {
    try {
      return await subscriptionService.validateCustomPromoCode(promoCode);
    } catch (error: any) {
      console.error('Validate custom promo code failed:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to validate promo code. Please try again.' 
      };
    }
  };

  // Access control methods
  const canCreateGoal = (currentGoalCount: number): boolean => {
    return subscriptionService.canCreateGoal(currentGoalCount);
  };

  const canUseSparkAIVoice = (currentUsage: number): boolean => {
    return subscriptionService.canUseSparkAIVoice(currentUsage);
  };

  const canUseSparkAIVision = (currentUsage: number): boolean => {
    return subscriptionService.canUseSparkAIVision(currentUsage);
  };

  const canUseHomeScreenWidgets = (): boolean => {
    return subscriptionService.canUseHomeScreenWidgets();
  };

  const canModifyData = (): boolean => {
    return subscriptionService.canModifyData();
  };

  const getUsageLimits = (): SubscriptionTier | null => {
    return subscriptionService.getUsageLimits();
  };

  // Initialize on mount with error handling
  useEffect(() => {
    const initializeSubscription = async () => {
      try {
        await refreshSubscription();
      } catch (error) {
        console.error('Failed to initialize subscription:', error);
        // Set default state on error to prevent blocking the app
        setIsLoading(false);
        setCurrentTier(null);
      }
    };
    
    initializeSubscription();
  }, []);

  // Refresh subscription when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh subscription status when app becomes active
        // This ensures we catch any subscription changes made outside the app
        refreshSubscription();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const value: SubscriptionContextType = {
    // State
    isLoading,
    customerInfo,
    currentTier,
    isSubscribed: currentTier !== null,
    isCurrentSubscriptionAnnual,
    subscriptionPlans,
    
    // Actions
    refreshSubscription,
    purchasePackage,
    restorePurchases,
    redeemPromoCode,
    validateCustomPromoCode,
    
    // Access Control
    canCreateGoal,
    canUseSparkAIVoice,
    canUseSparkAIVision,
    canUseHomeScreenWidgets,
    canModifyData,
    getUsageLimits,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
