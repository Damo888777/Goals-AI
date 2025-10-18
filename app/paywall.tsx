import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../src/hooks/useSubscription';
import { Button } from '../src/components/Button';
import { typography } from '../src/constants/typography';

import { SubscriptionCard } from '../src/components/SubscriptionCard';

type PaywallType = 'onboarding' | 'feature_upgrade';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { type = 'onboarding' } = useLocalSearchParams<{ type?: PaywallType }>();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    subscriptionPlans,
    purchasePackage,
    restorePurchases,
    isLoading: subscriptionLoading
  } = useSubscription();

  // Use all plans since each plan now contains both monthly and annual packages
  const availablePlans = subscriptionPlans;

  // Get paywall content based on type
  const getPaywallContent = () => {
    switch (type) {
      case 'onboarding':
        return {
          title: 'Your Vision is Worth It.',
          description: "You've experienced the clarity of a guided plan. A subscription gives you the complete system to turn your vision into daily, meaningful action.",
          canDismiss: false,
        };
      case 'feature_upgrade':
        return {
          title: 'Ready for the Next Level?',
          description: 'Our higher tiers are designed for ambitious users who are ready to achieve more. Explore the plans below.',
          canDismiss: true,
        };
      default:
        return {
          title: 'Your Vision is Worth It.',
          description: "You've experienced the clarity of a guided plan. A subscription gives you the complete system to turn your vision into daily, meaningful action.",
          canDismiss: true,
        };
    }
  };

  const { title, description, canDismiss } = getPaywallContent();

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    const plan = availablePlans.find(p => p.tier.id === selectedPlan);
    if (!plan) return;

    setIsLoading(true);
    try {
      // Create a modified plan with the correct package based on billing period
      const isAnnual = billingPeriod === 'annual';
      const planToPurchase = {
        ...plan,
        package: isAnnual && plan.annualPackage ? plan.annualPackage : plan.package,
        isAnnual
      };
      
      const result = await purchasePackage(planToPurchase);
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription has been activated. Welcome to Goals AI!',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else {
        if (result.error && !result.error.includes('cancelled')) {
          Alert.alert('Purchase Failed', result.error);
        }
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert(
          'Purchases Restored',
          'Your previous purchases have been restored.',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Restore Failed', result.error || 'No previous purchases found.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
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
        }}>
          Loading subscription options...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#364958' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 32 
        }}>
          <View style={{ flex: 1 }} />
          {canDismiss && (
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(245, 235, 224, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={24} color="#F5EBE0" />
            </Pressable>
          )}
        </View>

        {/* Title and Description */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{
            ...typography.title,
            fontSize: 28,
            color: '#F5EBE0',
            textAlign: 'left',
            marginBottom: 16,
          }}>
            {title}
          </Text>
          <Text style={{
            ...typography.body,
            fontSize: 16,
            color: '#F5EBE0',
            textAlign: 'left',
            opacity: 0.9,
          }}>
            {description}
          </Text>
        </View>

        {/* Billing Period Toggle */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F5EBE0',
          borderRadius: 12,
          padding: 4,
          marginBottom: 32,
          shadowColor: '#364958',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 4,
        }}>
          <Pressable
            onPress={() => setBillingPeriod('monthly')}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: billingPeriod === 'monthly' ? '#364958' : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: billingPeriod === 'monthly' ? '#F5EBE0' : '#364958',
              fontFamily: 'Helvetica',
            }}>
              Monthly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setBillingPeriod('annual')}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: billingPeriod === 'annual' ? '#364958' : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: billingPeriod === 'annual' ? '#F5EBE0' : '#364958',
              fontFamily: 'Helvetica',
            }}>
              Annual
            </Text>
          </Pressable>
        </View>

        {/* Subscription Cards */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {availablePlans.length === 0 ? (
            <View style={{ padding: 20, backgroundColor: '#F5EBE0', borderRadius: 16 }}>
              <Text style={{ color: '#364958', textAlign: 'center', fontSize: 16, fontFamily: 'Helvetica' }}>
                No subscription plans available. Please check your RevenueCat configuration.
              </Text>
            </View>
          ) : (
            availablePlans.map((plan) => (
              <View key={`${plan.tier.id}_${billingPeriod}`} style={{ 
                backgroundColor: '#F5EBE0', 
                padding: 20, 
                borderRadius: 16, 
                borderWidth: selectedPlan === plan.tier.id ? 2 : 1,
                borderColor: selectedPlan === plan.tier.id ? '#364958' : 'rgba(54, 73, 88, 0.2)'
              }}>
                <Pressable onPress={() => setSelectedPlan(plan.tier.id)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#364958', marginBottom: 8 }}>
                    {plan.tier.name}
                  </Text>
                  <Text style={{ fontSize: 16, color: '#364958', marginBottom: 4 }}>
                    {billingPeriod === 'annual' && plan.annualPrice ? plan.annualPrice + '/year' : plan.monthlyPrice + '/month'}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    {plan.tier.maxGoals === null ? 'Unlimited' : plan.tier.maxGoals} Goals • {plan.tier.sparkAIVoiceInputs} Voice Inputs
                  </Text>
                  {billingPeriod === 'annual' && plan.savings && (
                    <Text style={{ fontSize: 12, color: '#bc4b51', fontWeight: 'bold', marginTop: 4 }}>
                      Save {plan.savings}
                    </Text>
                  )}
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 16 }}>
          <Button
            title={isLoading ? 'Processing...' : 'Start Subscription'}
            variant="primary"
            size="large"
            onPress={handlePurchase}
            disabled={!selectedPlan || isLoading}
            style={{
              backgroundColor: selectedPlan && !isLoading ? '#F5EBE0' : 'rgba(245, 235, 224, 0.3)',
              shadowColor: '#364958',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}
            textStyle={{
              color: selectedPlan && !isLoading ? '#364958' : 'rgba(54, 73, 88, 0.5)',
            }}
          />

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
            }}>
              Restore Purchases
            </Text>
          </Pressable>
        </View>

        {/* Terms and Privacy */}
        <View style={{ 
          marginTop: 32,
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: 'rgba(245, 235, 224, 0.2)',
        }}>
          <Text style={{
            fontSize: 12,
            color: '#F5EBE0',
            opacity: 0.7,
            textAlign: 'center',
            lineHeight: 18,
            fontFamily: 'Helvetica',
          }}>
            By continuing, you agree to our{'\n'}
            <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text>
            {' and '}
            <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
