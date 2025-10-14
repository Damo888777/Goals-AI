import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/spacing';

interface BaseCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'completed' | 'trophy';
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  padding?: keyof typeof spacing;
}

export function BaseCard({ 
  children, 
  variant = 'primary', 
  style, 
  innerStyle,
  padding = 'xl'
}: BaseCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'completed':
        return {
          container: styles.completedContainer,
          inner: styles.completedInner,
        };
      case 'trophy':
        return {
          container: styles.trophyContainer,
          inner: styles.trophyInner,
        };
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          inner: styles.secondaryInner,
        };
      default:
        return {
          container: styles.primaryContainer,
          inner: styles.primaryInner,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[variantStyles.container, { padding: spacing[padding] }, style]}>
      <View style={[variantStyles.inner, innerStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Primary variant (default)
  primaryContainer: {
    backgroundColor: colors.background.secondary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  primaryInner: {
    backgroundColor: colors.background.primary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },

  // Secondary variant
  secondaryContainer: {
    backgroundColor: colors.background.primary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  secondaryInner: {
    padding: spacing.lg,
  },

  // Completed variant
  completedContainer: {
    backgroundColor: colors.trophy.bg,
    borderWidth: 0.5,
    borderColor: colors.trophy.border,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  completedInner: {
    backgroundColor: colors.completedTask,
    borderWidth: 0.5,
    borderColor: colors.trophy.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.trophy,
  },

  // Trophy variant
  trophyContainer: {
    backgroundColor: colors.background.secondary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  trophyInner: {
    backgroundColor: colors.trophy.bg,
    borderWidth: 0.5,
    borderColor: colors.trophy.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.trophy,
  },
});
