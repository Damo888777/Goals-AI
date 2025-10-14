import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { borderRadius } from '../constants/spacing';
import { touchTargets } from '../constants/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'cancel' | 'delete' | 'save' | 'confirm' | 'modal';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      minHeight: touchTargets.minimum,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = spacing.xs;
        baseStyle.paddingHorizontal = spacing.sm;
        break;
      case 'large':
        baseStyle.paddingVertical = spacing.md;
        baseStyle.paddingHorizontal = spacing.lg;
        break;
      default: // medium
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
    }

    // Perfect action button styling for save/delete/cancel ONLY
    const perfectActionButtonStyle: ViewStyle = {
      ...baseStyle,
      borderRadius: 10,
      minHeight: 40,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: '#9b9b9b',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    };

    // Variant styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
          borderWidth: 1,
          borderColor: colors.border.primary,
        };
      case 'cancel':
        return {
          ...perfectActionButtonStyle,
          backgroundColor: '#bc4b51',
          width: 134,
        };
      case 'delete':
        return {
          ...perfectActionButtonStyle,
          backgroundColor: '#bc4b51',
          width: 134,
        };
      case 'save':
        return {
          ...perfectActionButtonStyle,
          backgroundColor: '#a3b18a',
          flex: 1,
        };
      case 'confirm':
        return {
          ...perfectActionButtonStyle,
          backgroundColor: '#a3b18a',
          flex: 1,
        };
      case 'modal':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          flex: 1,
          marginHorizontal: spacing.xs,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...typography.button,
      textAlign: 'center',
    };

    // Perfect action button text styling for save/delete/cancel ONLY
    const perfectActionButtonTextStyle: TextStyle = {
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
      color: '#f5ebe0',
    };

    switch (variant) {
      case 'cancel':
      case 'delete':
      case 'save':
      case 'confirm':
        return perfectActionButtonTextStyle;
      case 'primary':
      case 'modal':
        return {
          ...baseTextStyle,
          color: colors.white,
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: colors.text.primary,
        };
      default:
        return baseTextStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[getTextStyle(), disabled && styles.disabledText, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textSecondary,
  },
});
