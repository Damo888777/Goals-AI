import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { touchTargets } from '../constants/spacing';

export type ChevronDirection = 'up' | 'down' | 'left' | 'right';
export type ChevronSize = 'small' | 'medium' | 'large';

interface ChevronButtonProps {
  direction?: ChevronDirection;
  size?: ChevronSize;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  rotated?: boolean;
}

export const ChevronButton: React.FC<ChevronButtonProps> = ({
  direction = 'down',
  size = 'medium',
  color = colors.text.primary,
  onPress,
  style,
  rotated = false,
}) => {
  const getChevronSize = () => {
    switch (size) {
      case 'small':
        return { width: 10, height: 10, lineWidth: 4, lineHeight: 1.5 }; // +0.5px
      case 'large':
        return { width: 14, height: 14, lineWidth: 6, lineHeight: 1.7 }; // +0.5px
      default: // medium
        return { width: 12, height: 12, lineWidth: 5, lineHeight: 1.6 }; // +0.5px
    }
  };

  const getRotation = () => {
    let baseRotation = 0;
    switch (direction) {
      case 'up':
        baseRotation = 180;
        break;
      case 'left':
        baseRotation = 90;
        break;
      case 'right':
        baseRotation = -90;
        break;
      default: // down
        baseRotation = 0;
    }
    
    if (rotated) {
      baseRotation += 180;
    }
    
    return baseRotation;
  };

  const { width, height, lineWidth, lineHeight } = getChevronSize();
  const rotation = getRotation();

  const getChevronBorderStyle = () => {
    const borderWidth = lineHeight;
    
    switch (direction) {
      case 'up':
        return {
          borderTopWidth: borderWidth,
          borderRightWidth: borderWidth,
          borderTopRightRadius: borderWidth / 2, // Round line endings only
          transform: [{ rotate: '-45deg' }],
        };
      case 'down':
        return {
          borderBottomWidth: borderWidth,
          borderRightWidth: borderWidth,
          borderBottomRightRadius: borderWidth / 2, // Round line endings only
          transform: [{ rotate: '45deg' }],
        };
      case 'left':
        return {
          borderLeftWidth: borderWidth,
          borderBottomWidth: borderWidth,
          borderBottomLeftRadius: borderWidth / 2, // Round line endings only
          transform: [{ rotate: '45deg' }],
        };
      case 'right':
        return {
          borderRightWidth: borderWidth,
          borderBottomWidth: borderWidth,
          borderBottomRightRadius: borderWidth / 2, // Round line endings only
          transform: [{ rotate: '-45deg' }],
        };
      default:
        return {
          borderBottomWidth: borderWidth,
          borderRightWidth: borderWidth,
          borderBottomRightRadius: borderWidth / 2, // Round line endings only
          transform: [{ rotate: '45deg' }],
        };
    }
  };

  const chevronBorderStyle = getChevronBorderStyle();

  const chevronStyles = StyleSheet.create({
    container: {
      width: touchTargets.minimum,
      height: touchTargets.minimum,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronIcon: {
      width,
      height,
      borderColor: color,
      ...chevronBorderStyle,
    },
  });

  if (onPress) {
    return (
      <TouchableOpacity
        style={[chevronStyles.container, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={chevronStyles.chevronIcon} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[chevronStyles.container, style]}>
      <View style={chevronStyles.chevronIcon} />
    </View>
  );
};

// Back Chevron Button - specialized for back navigation
export const BackChevronButton: React.FC<{
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}> = ({ onPress, color = colors.text.primary, style }) => {
  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.backChevronIcon, { borderColor: color }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronIcon: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 1, // Round line endings only
    transform: [{ rotate: '45deg' }],
  },
});
