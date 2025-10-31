import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface PromoCodeInputProps {
  onPromoCodeApplied: (promoCode: string) => Promise<{ success: boolean; error?: string; discount?: string }>;
  isLoading?: boolean;
  style?: any;
}

export function PromoCodeInput({ onPromoCodeApplied, isLoading = false, style }: PromoCodeInputProps) {
  const { t } = useTranslation();
  const [promoCode, setPromoCode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsApplying(true);
    setError(null);

    try {
      const result = await onPromoCodeApplied(promoCode.trim().toUpperCase());
      
      if (result.success) {
        setAppliedCode(promoCode.trim().toUpperCase());
        setDiscount(result.discount || null);
        setPromoCode('');
        setIsExpanded(false);
        setError(null);
      } else {
        setError(result.error || t('components.promoCodeInput.errors.invalidCode'));
      }
    } catch (error) {
      setError(t('components.promoCodeInput.errors.genericError'));
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedCode(null);
    setDiscount(null);
    setError(null);
    setPromoCode('');
  };

  if (appliedCode) {
    return (
      <View style={[{
        backgroundColor: '#E9EDC9',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#A3B18A',
        shadowColor: '#E9EDC9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
      }, style]}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}>
              <Ionicons name="checkmark-circle" size={20} color="#588157" />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#364958',
                marginLeft: 8,
                fontFamily: 'Helvetica',
              }}>
                {t('components.promoCodeInput.applied.title')}
              </Text>
            </View>
            <Text style={{
              fontSize: 14,
              color: '#364958',
              opacity: 0.8,
              fontFamily: 'Helvetica',
            }}>
              {t('components.promoCodeInput.applied.codeLabel')}: {appliedCode}
            </Text>
            {discount && (
              <Text style={{
                fontSize: 14,
                color: '#588157',
                fontWeight: '600',
                marginTop: 2,
                fontFamily: 'Helvetica',
              }}>
                {t('components.promoCodeInput.applied.discount', { amount: discount })}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleRemovePromoCode}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(54, 73, 88, 0.1)',
            }}
          >
            <Ionicons name="close" size={16} color="#364958" />
          </Pressable>
        </View>
      </View>
    );
  }

  if (!isExpanded) {
    return (
      <Pressable
        onPress={() => setIsExpanded(true)}
        style={[{
          backgroundColor: '#F5EBE0',
          borderRadius: 12,
          padding: 16,
          marginVertical: 8,
          borderWidth: 0.5,
          borderColor: '#A3B18A',
          shadowColor: '#F5EBE0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 4,
        }, style]}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
            <Ionicons name="pricetag-outline" size={20} color="#364958" />
            <Text style={{
              fontSize: 16,
              color: '#364958',
              fontWeight: '500',
              fontFamily: 'Helvetica',
              textAlign: 'left',
            }}>
              {t('components.promoCodeInput.expandButton')}
            </Text>
          </View>
          <Pressable
            style={{
              padding: 4,
            }}
          >
            <Ionicons name="chevron-down" size={20} color="#364958" />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[{
      backgroundColor: '#F5EBE0',
      borderRadius: 12,
      padding: 20,
      marginVertical: 8,
      borderWidth: 0.5,
      borderColor: '#A3B18A',
      shadowColor: '#F5EBE0',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    }, style]}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#364958',
          fontFamily: 'Helvetica',
        }}>
          {t('components.promoCodeInput.title')}
        </Text>
        <Pressable
          onPress={() => {
            setIsExpanded(false);
            setError(null);
            setPromoCode('');
          }}
          style={{
            padding: 4,
          }}
        >
          <Ionicons name="chevron-up" size={20} color="#364958" />
        </Pressable>
      </View>

      <View style={{
        flexDirection: 'row',
        gap: 12,
      }}>
        <View style={{ flex: 1 }}>
          <TextInput
            value={promoCode}
            onChangeText={(text) => {
              setPromoCode(text);
              setError(null);
            }}
            placeholder={t('components.promoCodeInput.placeholder')}
            placeholderTextColor="rgba(54, 73, 88, 0.5)"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#364958',
              borderWidth: error ? 2 : 0.5,
              borderColor: error ? '#bc4b51' : '#A3B18A',
              fontFamily: 'Helvetica',
              textTransform: 'uppercase',
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isApplying && !isLoading}
            returnKeyType="done"
            onSubmitEditing={handleApplyPromoCode}
          />
          {error && (
            <Text style={{
              fontSize: 12,
              color: '#bc4b51',
              marginTop: 6,
              fontFamily: 'Helvetica',
            }}>
              {error}
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleApplyPromoCode}
          disabled={!promoCode.trim() || isApplying || isLoading}
          style={{
            backgroundColor: promoCode.trim() && !isApplying && !isLoading ? '#364958' : 'rgba(54, 73, 88, 0.3)',
            borderRadius: 8,
            paddingHorizontal: 20,
            paddingVertical: 12,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 80,
            shadowColor: '#364958',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: promoCode.trim() && !isApplying && !isLoading ? 0.3 : 0,
            shadowRadius: 0,
            elevation: promoCode.trim() && !isApplying && !isLoading ? 2 : 0,
          }}
        >
          {isApplying ? (
            <ActivityIndicator size="small" color="#F5EBE0" />
          ) : (
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: promoCode.trim() && !isLoading ? '#F5EBE0' : 'rgba(245, 235, 224, 0.5)',
              fontFamily: 'Helvetica',
            }}>
              {t('components.promoCodeInput.applyButton')}
            </Text>
          )}
        </Pressable>
      </View>

      <Text style={{
        fontSize: 12,
        color: '#364958',
        opacity: 0.7,
        marginTop: 12,
        textAlign: 'center',
        fontFamily: 'Helvetica',
      }}>
        {t('components.promoCodeInput.description')}
      </Text>
    </View>
  );
}