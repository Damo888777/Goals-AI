import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';

interface SparkTutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  fabPosition?: { x: number; y: number };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SparkTutorialOverlay({ 
  visible, 
  onComplete, 
  fabPosition 
}: SparkTutorialOverlayProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spotlightAnim = useRef(new Animated.Value(0)).current;

  // Calculate actual FAB center position with responsive positioning
  const fabOffset = 51; // Consistent offset for all screen sizes
  const actualFabPosition = fabPosition || {
    x: screenWidth - 20 - 30, // right margin - half FAB width
    y: screenHeight - insets.bottom - 30 - fabOffset // responsive positioning
  };

  useEffect(() => {
    if (visible) {
      // Animate in overlay
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(spotlightAnim, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      spotlightAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const spotlightSize = 100;
  const tooltipWidth = screenWidth - 60;
  
  // Calculate tooltip position (above FAB, moved higher up)
  const tooltipX = Math.max(30, Math.min(actualFabPosition.x - tooltipWidth / 2, screenWidth - tooltipWidth - 30));
  const tooltipY = actualFabPosition.y - 420 - fabOffset;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      {/* Dimmed background */}
      <View style={styles.dimBackground} />
      
      {/* Spotlight circle around FAB */}
      <Animated.View
        style={[
          styles.spotlight,
          {
            left: actualFabPosition.x - spotlightSize / 2,
            top: actualFabPosition.y - spotlightSize / 2 - fabOffset,
            width: spotlightSize,
            height: spotlightSize,
            opacity: spotlightAnim,
          }
        ]}
      />
      
      {/* Tooltip */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            left: tooltipX,
            top: tooltipY,
            width: tooltipWidth,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.tooltipContent}>
          {/* Header with Spark icon */}
          <View style={styles.tooltipHeader}>
            <View style={styles.sparkIconContainer}>
              <Image 
                source={require('../../assets/SparkAI_Dark.png')}
                style={styles.sparkIcon}
                contentFit="contain"
              />
            </View>
            <Text style={[typography.cardTitle, styles.tooltipTitle]}>
              {t('sparkTutorialOverlay.title')}
            </Text>
          </View>
          
          {/* Main content */}
          <Text style={[typography.body, styles.tooltipBody]}>
            {t('sparkTutorialOverlay.body')}
          </Text>
          
          {/* Sub-note */}
          <Text style={[typography.caption, styles.tooltipSubNote]}>
            {t('sparkTutorialOverlay.subNote')}
          </Text>
          
          {/* Action button */}
          <Pressable
            style={styles.tooltipButton}
            onPress={onComplete}
          >
            <Text style={[typography.button, styles.tooltipButtonText]}>
              {t('sparkTutorialOverlay.button')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
      
      {/* Pulsing highlight around FAB */}
      <Animated.View
        style={[
          styles.fabHighlight,
          {
            left: actualFabPosition.x - 40,
            top: actualFabPosition.y - 40 - fabOffset,
            opacity: spotlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
            transform: [
              {
                scale: spotlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.1],
                }),
              },
            ],
          }
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dimBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  spotlight: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent.frog,
    shadowColor: colors.accent.frog,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 8,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.background.primary,
  },
  tooltipContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sparkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkIcon: {
    width: 20,
    height: 20,
  },
  tooltipTitle: {
    color: colors.text.primary,
    flex: 1,
  },
  tooltipBody: {
    color: colors.text.primary,
    lineHeight: 20,
  },
  tooltipSubNote: {
    color: colors.text.primary,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  tooltipButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  tooltipButtonText: {
    color: colors.secondary,
  },
  fabHighlight: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.accent.frog,
    backgroundColor: 'transparent',
  },
});