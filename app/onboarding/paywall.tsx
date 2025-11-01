import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { SubscriptionCard } from '../../src/components/SubscriptionCard';
import { PromoCodeInput } from '../../src/components/PromoCodeInput';

export default function OnboardingPaywallScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string | null>('tier_achiever');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    subscriptionPlans,
    purchasePackage,
    restorePurchases,
    validateCustomPromoCode,
    isLoading: subscriptionLoading
  } = useSubscription();

  const { finalizeOnboardingAfterSubscription } = useOnboarding();

  const availablePlans = subscriptionPlans;


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
        // Finalize onboarding after successful subscription
        await finalizeOnboardingAfterSubscription();
        
        Alert.alert(
          t('onboardingPaywall.alerts.welcomeTitle'),
          t('onboardingPaywall.alerts.welcomeMessage'),
          [{ text: t('onboardingPaywall.alerts.continue'), onPress: () => router.replace('/(tabs)') }]
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
              t('onboardingPaywall.alerts.paymentDeclinedTitle'),
              t('onboardingPaywall.alerts.paymentDeclinedMessage'),
              [{ text: t('onboardingPaywall.alerts.ok') }]
            );
          } else if (errorMessage.includes('interrupted') || errorMessage.includes('network')) {
            Alert.alert(
              t('onboardingPaywall.alerts.connectionIssueTitle'),
              t('onboardingPaywall.alerts.connectionIssueMessage'),
              [{ text: t('onboardingPaywall.alerts.retry'), onPress: () => handlePurchase() }, { text: t('onboardingPaywall.alerts.cancel') }]
            );
          } else if (errorMessage.includes('already purchased') || errorMessage.includes('already subscribed')) {
            Alert.alert(
              t('onboardingPaywall.alerts.alreadySubscribedTitle'),
              t('onboardingPaywall.alerts.alreadySubscribedMessage'),
              [
                { text: t('onboardingPaywall.alerts.restorePurchases'), onPress: () => handleRestore() },
                { text: t('onboardingPaywall.alerts.ok') }
              ]
            );
          } else {
            Alert.alert(
              t('onboardingPaywall.alerts.purchaseFailedTitle'),
              t('onboardingPaywall.alerts.purchaseFailedMessage', { error: result.error }),
              [{ text: t('onboardingPaywall.alerts.ok') }]
            );
          }
        } else {
          Alert.alert(
            t('onboardingPaywall.alerts.purchaseFailedTitle'),
            t('onboardingPaywall.alerts.purchaseFailedGeneric'),
            [{ text: t('onboardingPaywall.alerts.ok') }]
          );
        }
      }
    } catch (error) {
      Alert.alert(t('onboardingPaywall.alerts.purchaseFailedTitle'), t('onboardingPaywall.alerts.purchaseFailedSimple'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        // Finalize onboarding after successful restore
        await finalizeOnboardingAfterSubscription();
        
        Alert.alert(
          t('onboardingPaywall.alerts.purchasesRestoredTitle'),
          t('onboardingPaywall.alerts.purchasesRestoredMessage'),
          [{ text: t('onboardingPaywall.alerts.continue'), onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert(t('onboardingPaywall.alerts.restoreFailedTitle'), result.error || t('onboardingPaywall.alerts.restoreFailedMessage'));
      }
    } catch (error) {
      Alert.alert(t('onboardingPaywall.alerts.restoreFailedTitle'), t('onboardingPaywall.alerts.restoreFailedGeneric'));
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
          {t('onboardingPaywall.loading.loadingSubscriptionOptions')}
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
            paddingTop: insets.top + 40,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
        {/* Hero Section */}
        <View style={{ marginBottom: 48, alignItems: 'center' }}>
          <View style={{
            marginBottom: 24,
          }}>
            <Image
              source={require('../../assets/SparkAI_Light.png')}
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
            {t('onboardingPaywall.hero.title')}
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
            {t('onboardingPaywall.hero.subtitle')}
          </Text>
        </View>

        {/* Billing Period Toggle - matching plan.tsx */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F5EBE0',
          borderRadius: 12,
          padding: 4,
          marginBottom: 40,
          borderWidth: 0.5,
          borderColor: '#A3B18A',
          shadowColor: '#F5EBE0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 4,
        }}>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setBillingPeriod('monthly');
            }}
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
              {t('onboardingPaywall.billingPeriod.monthly')}
            </Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setBillingPeriod('annual');
            }}
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
              {t('onboardingPaywall.billingPeriod.annual')}
            </Text>
          </Pressable>
        </View>

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
                {t('onboardingPaywall.subscriptionPlans.noPlansAvailable')}
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
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handlePurchase();
            }}
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
              {isLoading ? t('onboardingPaywall.buttons.processing') : t('onboardingPaywall.buttons.subscribe')}
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
            {t('onboardingPaywall.disclaimers.autoRenew')}
          </Text>

          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleRestore();
            }}
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
              {t('onboardingPaywall.buttons.restorePurchases')}
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
            {t('onboardingPaywall.disclaimers.termsAndPrivacy')}{'\n'}
            <Text style={{ textDecorationLine: 'underline' }}>{t('onboardingPaywall.disclaimers.termsOfService')}</Text>
            {t('onboardingPaywall.disclaimers.and')}
            <Text style={{ textDecorationLine: 'underline' }}>{t('onboardingPaywall.disclaimers.privacyPolicy')}</Text>
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}