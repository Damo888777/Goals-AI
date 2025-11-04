import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSubscription } from '../src/hooks/useSubscription';
import { SubscriptionCard } from '../src/components/SubscriptionCard';
import { PromoCodeInput } from '../src/components/PromoCodeInput';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [selectedPlan, setSelectedPlan] = useState<string | null>('tier_achiever');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if this is coming from onboarding completion
  const isFromOnboarding = source === 'onboarding';
  
  const {
    subscriptionPlans,
    purchasePackage,
    restorePurchases,
    validateCustomPromoCode,
    isLoading: subscriptionLoading,
    currentTier,
    isSubscribed
  } = useSubscription();

  // Define tier hierarchy (lower index = lower tier)
  const tierHierarchy = ['tier_starter', 'tier_achiever', 'tier_visionary'];
  
  // Get current subscription billing period
  const { isCurrentSubscriptionAnnual } = useSubscription();
  
  // Filter plans to show only upgrade options
  const availablePlans = subscriptionPlans.filter(plan => {
    if (!currentTier) return true; // Show all if no current tier
    
    const currentTierIndex = tierHierarchy.indexOf(currentTier.id);
    const planTierIndex = tierHierarchy.indexOf(plan.tier.id);
    
    // Show plans that are:
    // 1. Higher tier than current
    // 2. Same tier but annual (if currently on monthly)
    if (planTierIndex > currentTierIndex) {
      return true; // Higher tier - show both monthly and annual
    } else if (planTierIndex === currentTierIndex) {
      // Same tier - only show if it's an upgrade to annual
      return !isCurrentSubscriptionAnnual; // Only show if not already on annual
    }
    
    return false; // Don't show lower tiers
  });

  // Get paywall content - show onboarding content if coming from onboarding
  const getPaywallContent = () => {
    if (isFromOnboarding) {
      return {
        title: t('onboardingPaywall.hero.title'), // "Invest in Yourself"
        description: t('onboardingPaywall.hero.subtitle'),
        canDismiss: false, // Don't allow dismissing after onboarding
      };
    }
    return {
      title: t('paywall.hero.title'),
      description: t('paywall.hero.description'),
      canDismiss: true,
    };
  };

  const { title, description } = getPaywallContent();

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    const plan = availablePlans.find(p => p.tier.id === selectedPlan);
    if (!plan) return;

    setIsLoading(true);
    try {
      const isAnnual = billingPeriod === 'annual';
      const planToPurchase = {
        ...plan,
        package: isAnnual && plan.annualPackage ? plan.annualPackage : plan.package,
        isAnnual
      };
      
      const result = await purchasePackage(planToPurchase);
      if (result.success) {
        const alertTitle = isFromOnboarding ? t('onboardingPaywall.alerts.welcomeTitle') : t('paywall.alerts.successTitle');
        const alertMessage = isFromOnboarding ? t('onboardingPaywall.alerts.welcomeMessage') : t('paywall.alerts.successMessage');
        const onContinue = isFromOnboarding ? () => router.replace('/(tabs)') : () => router.back();
        
        Alert.alert(
          alertTitle,
          alertMessage,
          [{ text: t('paywall.alerts.continue'), onPress: onContinue }]
        );
      } else {
        // Handle different types of purchase errors
        if (result.error) {
          const errorMessage = result.error.toLowerCase();
          
          if (errorMessage.includes('cancelled') || errorMessage.includes('user cancelled')) {
            // User cancelled - no alert needed
            return;
          } else if (errorMessage.includes('declined') || errorMessage.includes('payment declined')) {
            Alert.alert(
              t('paywall.alerts.paymentDeclinedTitle'),
              t('paywall.alerts.paymentDeclinedMessage'),
              [{ text: t('paywall.alerts.ok') }]
            );
          } else if (errorMessage.includes('interrupted') || errorMessage.includes('network')) {
            Alert.alert(
              t('paywall.alerts.connectionIssueTitle'),
              t('paywall.alerts.connectionIssueMessage'),
              [{ text: t('paywall.alerts.retry'), onPress: () => handlePurchase() }, { text: t('paywall.alerts.cancel') }]
            );
          } else if (errorMessage.includes('already purchased') || errorMessage.includes('already subscribed')) {
            Alert.alert(
              t('paywall.alerts.alreadySubscribedTitle'),
              t('paywall.alerts.alreadySubscribedMessage'),
              [
                { text: t('paywall.alerts.restorePurchases'), onPress: () => handleRestore() },
                { text: t('paywall.alerts.ok') }
              ]
            );
          } else {
            Alert.alert(
              t('paywall.alerts.purchaseFailedTitle'),
              t('paywall.alerts.purchaseFailedMessage', { error: result.error }),
              [{ text: t('paywall.alerts.ok') }]
            );
          }
        } else {
          Alert.alert(
            t('paywall.alerts.purchaseFailedTitle'),
            t('paywall.alerts.purchaseFailedGeneric'),
            [{ text: t('paywall.alerts.ok') }]
          );
        }
      }
    } catch (error) {
      Alert.alert(t('paywall.alerts.purchaseFailedTitle'), t('paywall.alerts.purchaseFailedSimple'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        const alertTitle = isFromOnboarding ? t('onboardingPaywall.alerts.purchasesRestoredTitle') : t('paywall.alerts.purchasesRestoredTitle');
        const alertMessage = isFromOnboarding ? t('onboardingPaywall.alerts.purchasesRestoredMessage') : t('paywall.alerts.purchasesRestoredMessage');
        const onContinue = isFromOnboarding ? () => router.replace('/(tabs)') : () => router.back();
        
        Alert.alert(
          alertTitle,
          alertMessage,
          [{ text: t('paywall.alerts.continue'), onPress: onContinue }]
        );
      } else {
        Alert.alert(t('paywall.alerts.restoreFailedTitle'), result.error || t('paywall.alerts.restoreFailedMessage'));
      }
    } catch (error) {
      Alert.alert(t('paywall.alerts.restoreFailedTitle'), t('paywall.alerts.restoreFailedGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#364958',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color="#F5EBE0" />
        <Text style={{
          color: '#F5EBE0',
          fontSize: 16,
          marginTop: 16,
          fontFamily: 'Helvetica',
          fontWeight: '300',
        }}>
          {t('paywall.loading.loadingSubscriptionOptions')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#364958' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: 20,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
        {/* Close Button - only show if dismissible */}
        {getPaywallContent().canDismiss && (
          <View style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 20,
          }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={24} color="#F5EBE0" />
            </Pressable>
          </View>
        )}

        {/* Current Subscription State */}
        {isSubscribed && currentTier && (
          <View style={{
            backgroundColor: 'rgba(245, 235, 224, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
            marginTop: 60,
            borderWidth: 0.5,
            borderColor: 'rgba(245, 235, 224, 0.3)',
          }}>
            <Text style={{
              fontSize: 14,
              color: '#F5EBE0',
              opacity: 0.8,
              fontWeight: '300',
              textAlign: 'center',
              marginBottom: 4,
            }}>
              {t('paywall.currentPlan.currentPlan')}
            </Text>
            <Text style={{
              fontSize: 20,
              color: '#F5EBE0',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              {currentTier.name} {isCurrentSubscriptionAnnual ? t('paywall.billing.annual') : t('paywall.billing.monthly')}
            </Text>
          </View>
        )}

        {/* Hero Section */}
        <View style={{ marginBottom: 48, alignItems: 'center', marginTop: isSubscribed && currentTier ? 0 : 60 }}>
          <View style={{
            marginBottom: 24,
          }}>
            <Image
              source={require('../assets/SparkAI_Light.png')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
          </View>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#F5EBE0',
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 38,
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: 18,
            color: '#F5EBE0',
            textAlign: 'center',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: 24,
            paddingHorizontal: 8,
          }}>
            {description}
          </Text>
        </View>

        {/* Current Subscription State */}
        {isSubscribed && currentTier && (
          <View style={{
            backgroundColor: 'rgba(245, 235, 224, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
            borderWidth: 0.5,
            borderColor: 'rgba(245, 235, 224, 0.3)',
          }}>
            <Text style={{
              fontSize: 14,
              color: '#F5EBE0',
              opacity: 0.8,
              fontWeight: '300',
              textAlign: 'center',
              marginBottom: 4,
            }}>
              {t('paywall.currentSubscription.label')}
            </Text>
            <Text style={{
              fontSize: 20,
              color: '#F5EBE0',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              {currentTier.name} - {isCurrentSubscriptionAnnual ? t('paywall.billingPeriod.annual') : t('paywall.billingPeriod.monthly')}
            </Text>
          </View>
        )}

      {/* Billing Period Toggle - only show if we have both monthly and annual options */}
      {availablePlans.some(p => !p.isAnnual) && availablePlans.some(p => p.isAnnual || p.annualPackage) && (
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F5EBE0',
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
          borderWidth: 0.5,
          borderColor: '#A3B18A',
        }}>
          <Pressable
            onPress={() => setBillingPeriod('monthly')}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: billingPeriod === 'monthly' ? '#364958' : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: billingPeriod === 'monthly' ? '600' : '500',
              color: billingPeriod === 'monthly' ? '#FFFFFF' : '#364958',
              fontFamily: 'Helvetica',
            }}>
              {t('paywall.billingPeriod.monthly')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setBillingPeriod('annual')}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: billingPeriod === 'annual' ? '#364958' : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: billingPeriod === 'annual' ? '600' : '500',
              color: billingPeriod === 'annual' ? '#FFFFFF' : '#364958',
              fontFamily: 'Helvetica',
            }}>
              {t('paywall.billingPeriod.annual')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Promotional Code Input */}
        <PromoCodeInput
          onPromoCodeApplied={validateCustomPromoCode}
          isLoading={isLoading}
          style={{ marginBottom: 24 }}
        />

        {/* Subscription Cards */}
        <View style={{ gap: 24, marginBottom: 40, paddingTop: 16 }}>
          {availablePlans.length === 0 ? (
            <View style={{ 
              padding: 24, 
              backgroundColor: '#F5EBE0', 
              borderRadius: 15,
              borderWidth: 0.5,
              borderColor: '#A3B18A',
              shadowColor: '#F5EBE0',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}>
              <Text style={{ 
                color: '#364958', 
                textAlign: 'center', 
                fontSize: 16, 
                fontFamily: 'Helvetica',
                fontWeight: '600',
              }}>
                {isSubscribed && currentTier ? 
                  t('paywall.subscriptionPlans.highestTierMessage', { tierName: currentTier.name }) :
                  t('paywall.subscriptionPlans.noPlansAvailable')
                }
              </Text>
            </View>
          ) : (
            availablePlans.map((plan) => (
              <SubscriptionCard
                key={`${plan.tier.id}_${billingPeriod}`}
                plan={plan}
                isSelected={selectedPlan === plan.tier.id}
                onSelect={() => setSelectedPlan(plan.tier.id)}
                billingPeriod={billingPeriod}
              />
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 20 }}>
          <Pressable
            onPress={handlePurchase}
            disabled={!selectedPlan || isLoading}
            style={{
              backgroundColor: selectedPlan ? '#F5EBE0' : 'rgba(245, 235, 224, 0.3)',
              paddingVertical: 20,
              paddingHorizontal: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#F5EBE0',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: selectedPlan ? '#364958' : 'rgba(54, 73, 88, 0.5)',
              fontFamily: 'Helvetica',
            }}>
              {isLoading ? t('paywall.buttons.processing') : t('paywall.buttons.upgradePlan')}
            </Text>
          </Pressable>

          {/* Subscription disclaimer */}
          <Text style={{
            fontSize: 12,
            color: '#F5EBE0',
            opacity: 0.7,
            textAlign: 'center',
            lineHeight: 16,
            fontFamily: 'Helvetica',
            fontWeight: '300',
            marginTop: 12,
            paddingHorizontal: 16,
          }}>
            {t('paywall.disclaimers.autoRenew')}
          </Text>

          <Pressable
            onPress={handleRestore}
            disabled={isLoading}
            style={{
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontSize: 16,
              color: '#F5EBE0',
              opacity: isLoading ? 0.5 : 0.8,
              fontFamily: 'Helvetica',
              fontWeight: '400',
            }}>
              {t('paywall.buttons.restorePurchases')}
            </Text>
          </Pressable>
        </View>

        {/* Terms and Privacy */}
        <View style={{ 
          marginTop: 40,
          paddingTop: 24,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(245, 235, 224, 0.3)',
        }}>
          <Text style={{
            fontSize: 12,
            color: '#F5EBE0',
            opacity: 0.7,
            textAlign: 'center',
            lineHeight: 18,
            fontFamily: 'Helvetica',
            fontWeight: '300',
          }}>
            {t('paywall.disclaimers.termsAndPrivacy')}{'\n'}
            <Text style={{ textDecorationLine: 'underline' }}>{t('paywall.disclaimers.termsOfService')}</Text>
            {t('paywall.disclaimers.and')}
            <Text style={{ textDecorationLine: 'underline' }}>{t('paywall.disclaimers.privacyPolicy')}</Text>
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}