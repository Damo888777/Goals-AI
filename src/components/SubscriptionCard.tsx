import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionPlan } from '../services/subscriptionService';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  billingPeriod?: 'monthly' | 'annual';
}

export function SubscriptionCard({ plan, isSelected, onSelect, billingPeriod = 'monthly' }: SubscriptionCardProps) {
  const { t } = useTranslation();
  const { tier, monthlyPrice, annualPrice, savings } = plan;
  const isAnnual = billingPeriod === 'annual';

  const getBenefits = () => {
    switch (tier.id) {
      case 'tier_starter':
        return [
          { bold: '3', light: t('subscriptionCard.benefits.activeGoals'), icon: 'flag' },
          { bold: '40', light: t('subscriptionCard.benefits.sparkAIInputs'), icon: 'mic' },
          { bold: '10', light: t('subscriptionCard.benefits.sparkAIVisions'), icon: 'image' },
          { bold: t('subscriptionCard.benefits.unlimited'), light: t('subscriptionCard.benefits.pomodoroSessions'), icon: 'timer' },
          { bold: t('subscriptionCard.benefits.locked'), light: t('subscriptionCard.benefits.homeScreenWidget'), icon: 'apps' }
        ];
      case 'tier_achiever':
        return [
          { bold: '10', light: t('subscriptionCard.benefits.activeGoals'), icon: 'flag' },
          { bold: '150', light: t('subscriptionCard.benefits.sparkAIInputs'), icon: 'mic' },
          { bold: '20', light: t('subscriptionCard.benefits.sparkAIVisions'), icon: 'image' },
          { bold: t('subscriptionCard.benefits.unlimited'), light: t('subscriptionCard.benefits.pomodoroSessions'), icon: 'timer' },
          { bold: t('subscriptionCard.benefits.unlocked'), light: t('subscriptionCard.benefits.homeScreenWidget'), icon: 'apps' }
        ];
      case 'tier_visionary':
        return [
          { bold: t('subscriptionCard.benefits.unlimited'), light: t('subscriptionCard.benefits.activeGoals'), icon: 'infinite' },
          { bold: '500', light: t('subscriptionCard.benefits.sparkAIInputs'), icon: 'mic' },
          { bold: '60', light: t('subscriptionCard.benefits.sparkAIVisions'), icon: 'image' },
          { bold: t('subscriptionCard.benefits.unlimited'), light: t('subscriptionCard.benefits.pomodoroSessions'), icon: 'timer' },
          { bold: t('subscriptionCard.benefits.unlocked'), light: t('subscriptionCard.benefits.homeScreenWidget'), icon: 'apps' }
        ];
      default:
        return [];
    }
  };

  const getDisplayPrice = () => {
    if (isAnnual && annualPrice) {
      return annualPrice + t('subscriptionCard.pricing.perYear');
    }
    return monthlyPrice + t('subscriptionCard.pricing.perMonth');
  };


  return (
    <Pressable
      onPress={onSelect}
      style={{
        backgroundColor: '#F5EBE0',
        borderRadius: 15,
        padding: 32,
        minHeight: 280,
        borderWidth: isSelected ? 3 : 0.5,
        borderColor: isSelected ? '#E9EDC9' : '#A3B18A',
        shadowColor: '#F5EBE0',
        shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: isSelected ? 8 : 4,
        opacity: isSelected ? 1 : 0.7,
        transform: [{ scale: isSelected ? 1.03 : 1 }],
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Badges */}
      {tier.id === 'tier_achiever' && (
        <View style={{
          position: 'absolute',
          top: -12,
          right: 20,
          backgroundColor: '#E9EDC9',
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 16,
          shadowColor: '#F5EBE0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 6,
          zIndex: 10,
        }}>
          <Text style={{
            color: '#364958',
            fontSize: 12,
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}>{t('subscriptionCard.badges.popular')}</Text>
        </View>
      )}
      {tier.id === 'tier_visionary' && isAnnual && savings && (
        <View style={{
          position: 'absolute',
          top: -12,
          right: 20,
          backgroundColor: '#bc4b51',
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 16,
          shadowColor: '#F5EBE0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 6,
          zIndex: 10,
        }}>
          <Text style={{
            color: '#F5EBE0',
            fontSize: 12,
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}>{t('subscriptionCard.badges.bestDeal')}</Text>
        </View>
      )}

      {/* Header with tier name and pricing */}
      <View style={{
        marginBottom: 24,
        marginTop: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#364958',
            textAlign: 'left',
          }}>
            {tier.name}
          </Text>
          {isSelected && (
            <View style={{
              backgroundColor: '#364958',
              borderRadius: 12,
              padding: 4,
            }}>
              <Ionicons name="checkmark" size={16} color="#F5EBE0" />
            </View>
          )}
        </View>
        <Text style={{
          fontSize: 20,
          color: '#364958',
          fontWeight: '300',
          textAlign: 'left',
          marginBottom: 6,
        }}>
          {getDisplayPrice()}
        </Text>
        {isAnnual && savings && (
          <View style={{
            backgroundColor: '#bc4b51',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            alignSelf: 'flex-start',
          }}>
            <Text style={{
              fontSize: 12,
              color: '#FFFFFF',
              fontWeight: 'bold',
              textAlign: 'left',
            }}>
              {t('subscriptionCard.pricing.save', { amount: savings })}
            </Text>
          </View>
        )}
      </View>

      {/* Benefits list */}
      <View style={{ gap: 18 }}>
        {getBenefits().map((benefit, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
            <View style={{
              backgroundColor: '#364958',
              borderRadius: 10,
              padding: 6,
            }}>
              <Ionicons 
                name={benefit.icon as any}
                size={14} 
                color="#F5EBE0" 
              />
            </View>
            <Text style={{
              fontSize: 15,
              color: '#364958',
              flex: 1,
              textAlign: 'left',
              lineHeight: 20,
            }}>
              <Text style={{ fontWeight: 'bold' }}>{benefit.bold}</Text>
              <Text style={{ fontWeight: '300' }}>{benefit.light}</Text>
            </Text>
          </View>
        ))}
      </View>

    </Pressable>
  );
}
