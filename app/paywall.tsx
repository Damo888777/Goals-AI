import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSubscription } from '../src/hooks/useSubscription';
import { SubscriptionCard } from '../src/components/SubscriptionCard';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string | null>('tier_achiever');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    subscriptionPlans,
    purchasePackage,
    restorePurchases,
    isLoading: subscriptionLoading,
    currentTier,
    isSubscribed
  } = useSubscription();

  // Define tier hierarchy (lower index = lower tier)
  const tierHierarchy = ['tier_starter', 'tier_achiever', 'tier_visionary'];
  
  // Filter plans to show higher tiers OR same tier with different billing period
  const availablePlans = subscriptionPlans.filter(plan => {
    if (!currentTier) return true; // Show all if no current tier
    
    const currentTierIndex = tierHierarchy.indexOf(currentTier.id);
    const planTierIndex = tierHierarchy.indexOf(plan.tier.id);
    
    // Show plans that are higher tier OR same tier (for billing period switching)
    return planTierIndex >= currentTierIndex;
  });

  // Get paywall content - this is now feature upgrade only
  const getPaywallContent = () => {
    return {
      title: 'Ready for the Next Level?',
      description: 'Our higher tiers are designed for ambitious users who are ready to achieve more. Explore the plans below.',
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
        Alert.alert(
          'Success!',
          'Your subscription has been activated. Welcome to Goals AI!',
          [{ text: 'Continue', onPress: () => router.back() }]
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
              'Payment Declined',
              'Your payment method was declined. Please check your payment information and try again.',
              [{ text: 'OK' }]
            );
          } else if (errorMessage.includes('interrupted') || errorMessage.includes('network')) {
            Alert.alert(
              'Connection Issue',
              'The purchase was interrupted due to a network issue. Please check your connection and try again.',
              [{ text: 'Retry', onPress: () => handlePurchase() }, { text: 'Cancel' }]
            );
          } else if (errorMessage.includes('already purchased') || errorMessage.includes('already subscribed')) {
            Alert.alert(
              'Already Subscribed',
              'You already have an active subscription. Try restoring your purchases if you don\'t see your benefits.',
              [
                { text: 'Restore Purchases', onPress: () => handleRestore() },
                { text: 'OK' }
              ]
            );
          } else {
            Alert.alert(
              'Purchase Failed',
              `Something went wrong: ${result.error}\n\nPlease try again or contact support if the issue persists.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Purchase Failed',
            'An unexpected error occurred. Please try again.',
            [{ text: 'OK' }]
          );
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
          fontWeight: '300',
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
          paddingTop: 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button */}
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
              Current Plan
            </Text>
            <Text style={{
              fontSize: 18,
              color: '#F5EBE0',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              {currentTier.name}
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
              Monthly
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
              Annual
            </Text>
          </Pressable>
        </View>

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
                  `You're already on the highest available tier (${currentTier.name}). To change billing frequency, please manage your subscription in your App Store settings.` :
                  'No subscription plans available. Please check your RevenueCat configuration.'
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
              backgroundColor: selectedPlan && !isLoading ? '#F5EBE0' : 'rgba(245, 235, 224, 0.3)',
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
              color: selectedPlan && !isLoading ? '#364958' : 'rgba(54, 73, 88, 0.5)',
              fontFamily: 'Helvetica',
            }}>
              {isLoading ? 'Processing...' : 'Upgrade Plan'}
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
            This subscription will automatically renew unless you cancel it at least 24 hours before the current period ends; you can manage or cancel your subscription anytime in your App Store account settings.
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
              Restore Purchases
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