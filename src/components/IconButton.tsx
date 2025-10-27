import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows, touchTargets } from '../constants/spacing';

export type IconButtonVariant = 'complete' | 'pomodoro' | 'delete' | 'primary' | 'secondary';
export type IconButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps {
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  // Icon props
  iconName?: string; // For MaterialIcons
  iconSource?: any; // For Image icons (URI or local asset)
  iconText?: string; // For text-based icons like checkmark
  pressed?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  iconName,
  iconSource,
  iconText,
  pressed = false,
  onPressIn,
  onPressOut,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseSize = size === 'small' ? 32 : size === 'large' ? 48 : 40;
    
    const baseStyle: ViewStyle = {
      width: baseSize,
      height: baseSize,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      overflow: 'visible',
      ...shadows.card,
    };

    // Variant styles
    switch (variant) {
      case 'complete':
        return {
          ...baseStyle,
          backgroundColor: colors.success,
          borderColor: '#9B9B9B',
          shadowColor: '#7c7c7c',
          shadowOffset: { width: 0, height: pressed ? 1 : 2 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 2,
        };
      case 'pomodoro':
        return {
          ...baseStyle,
          backgroundColor: '#F2CCC3',
          borderColor: '#9B9B9B',
          shadowColor: '#7c7c7c',
          shadowOffset: { width: 0, height: pressed ? 1 : 2 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 2,
        };
      case 'delete':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          width: '100%',
          height: '100%',
          alignItems: 'flex-end',
          paddingRight: 25,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.primary,
        };
      default: // primary
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          borderColor: colors.border.primary,
        };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 28;
      default: return 22;
    }
  };

  const renderIcon = () => {
    if (iconText) {
      return (
        <Text style={[
          styles.iconText,
          { fontSize: getIconSize() },
          variant === 'complete' && styles.completeIconText,
          variant === 'delete' && styles.deleteIconText,
        ]}>
          {iconText}
        </Text>
      );
    }
    
    if (iconSource) {
      return (
        <Image 
          source={iconSource}
          style={[styles.iconImage, { width: getIconSize(), height: getIconSize() }]}
          contentFit="contain"
        />
      );
    }
    
    if (iconName) {
      return (
        <Icon 
          name={iconName} 
          size={getIconSize() + 8} 
          color={variant === 'delete' ? '#B23A48' : colors.white} 
        />
      );
    }
    
    return null;
  };

  return (
    <Pressable
      style={[getButtonStyle(), disabled && styles.disabled, style]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      {variant === 'complete' && (
        <View style={styles.checkIconContainer}>
          {renderIcon()}
        </View>
      )}
      {variant !== 'complete' && renderIcon()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  iconText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  completeIconText: {
    color: colors.background.primary,
  },
  deleteIconText: {
    color: '#B23A48',
  },
  iconImage: {
    // Image styles handled by props
  },
  checkIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
