import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionPlan } from '../services/subscriptionService';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  billingPeriod?: 'monthly' | 'annual';
}

export function SubscriptionCard({ plan, isSelected, onSelect, billingPeriod = 'monthly' }: SubscriptionCardProps) {
  const { tier, monthlyPrice, annualPrice, savings } = plan;
  const isAnnual = billingPeriod === 'annual';

  const getBenefits = () => {
    const benefits = [
      `${tier.maxGoals === null ? 'Unlimited' : tier.maxGoals} Active Goals`,
      `${tier.sparkAIVoiceInputs} Spark AI Voice Inputs/month`,
      `${tier.sparkAIVisionImages} Spark AI Vision Images/month`,
      'Unlimited Pomodoro Sessions',
    ];

    if (tier.homeScreenWidgets) {
      benefits.push('Home Screen Widgets');
    }

    return benefits;
  };

  const getDisplayPrice = () => {
    if (isAnnual && annualPrice) {
      const monthlyEquivalent = (parseFloat(annualPrice.replace(/[^0-9.]/g, '')) / 12).toFixed(2);
      return `$${monthlyEquivalent}/month`;
    }
    return monthlyPrice;
  };

  const getFullPrice = () => {
    if (isAnnual && annualPrice) {
      return `${annualPrice}/year`;
    }
    return `${monthlyPrice}/month`;
  };

  return (
    <Pressable
      onPress={onSelect}
      style={{
        backgroundColor: '#F5EBE0',
        borderRadius: 16,
        padding: 20,
        borderWidth: isSelected ? 1 : 0.5,
        borderColor: '#364958',
        shadowColor: '#364958',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
        opacity: isSelected ? 1 : 0.9,
      }}
    >
      {/* Header with tier name and pricing */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#364958',
            fontFamily: 'Helvetica',
            marginBottom: 4,
          }}>
            {tier.name}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '800',
              color: '#364958',
              fontFamily: 'Helvetica',
            }}>
              {getDisplayPrice()}
            </Text>
            
            {isAnnual && savings && (
              <View style={{
                backgroundColor: '#364958',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#F5EBE0',
                  fontFamily: 'Helvetica',
                }}>
                  Save {savings}
                </Text>
              </View>
            )}
          </View>

          {isAnnual && (
            <Text style={{
              fontSize: 14,
              color: '#364958',
              opacity: 0.7,
              fontFamily: 'Helvetica',
              marginTop: 2,
            }}>
              {getFullPrice()}
            </Text>
          )}
        </View>

        {/* Selection indicator */}
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: '#364958',
          backgroundColor: isSelected ? '#364958' : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {isSelected && (
            <Ionicons name="checkmark" size={14} color="#F5EBE0" />
          )}
        </View>
      </View>

      {/* Benefits list */}
      <View style={{ gap: 12 }}>
        {getBenefits().map((benefit, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color="#364958" 
            />
            <Text style={{
              fontSize: 15,
              color: '#364958',
              fontFamily: 'Helvetica',
              flex: 1,
            }}>
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      {/* Popular badge for middle tier */}
      {tier.id === 'tier_achiever' && (
        <View style={{
          position: 'absolute',
          top: -8,
          right: 20,
          backgroundColor: '#364958',
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#F5EBE0',
            fontFamily: 'Helvetica',
          }}>
            Most Popular
          </Text>
        </View>
      )}
    </Pressable>
  );
}
