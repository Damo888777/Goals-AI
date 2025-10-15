import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows, touchTargets, emptyStateSpacing } from '../constants/spacing';
import { IconButton } from './IconButton';
import { soundService } from '../services/soundService';
import type { Milestone } from '../types';

type MilestoneCardVariant = 
  | 'empty'
  | 'active'
  | 'active-completed'
  | 'empty-completed';

interface MilestoneCardProps {
  milestone?: Milestone;
  variant: MilestoneCardVariant;
  onPress?: () => void;
  onToggleComplete?: (milestoneId: string) => Promise<void>;
  creationSource?: 'spark' | 'manual';
}

export function MilestoneCard({ milestone, variant, onPress, onToggleComplete, creationSource }: MilestoneCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isEmptyPressed, setIsEmptyPressed] = useState(false);
  const [isCompletePressed, setIsCompletePressed] = useState(false);
  
  // Empty state variants
  if (variant === 'empty' || variant === 'empty-completed') {
    const isCompletedEmpty = variant === 'empty-completed';
    const content = isCompletedEmpty 
      ? { title: 'No completed milestones', description: 'Complete some milestones to see them here.' }
      : { title: 'No milestones yet', description: 'Break down your goals into achievable milestones' };

    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setIsEmptyPressed(true)}
        onPressOut={() => setIsEmptyPressed(false)}
        style={[
          styles.emptyCard, 
          isCompletedEmpty && styles.emptyCompletedCard,
          isEmptyPressed && styles.emptyCardPressed
        ]}
      >
        <View style={styles.emptyContent}>
          <Text style={[
            styles.emptyTitle,
            isCompletedEmpty && styles.emptyCompletedTitle
          ]}>
            {content.title}
          </Text>
          <Text style={[
            styles.emptyDescription,
            isCompletedEmpty && styles.emptyCompletedDescription
          ]}>
            {content.description}
          </Text>
        </View>
      </Pressable>
    );
  }

  // Determine card properties based on variant
  const isCompleted = variant === 'active-completed' || milestone?.isComplete;
  const isOverdue = milestone?.targetDate && new Date(milestone.targetDate) < new Date() && !isCompleted;
  const showSparkBadge = creationSource === 'spark';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.card,
        isCompleted ? styles.completedCard : null,
        isOverdue ? styles.overdueCard : null,
        isPressed ? styles.cardPressed : null
      ]}
    >
      <View style={styles.content}>
        {/* Title with creation source badge */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { flex: 1 }, isCompleted ? styles.completedText : null]} numberOfLines={2}>
            {milestone?.title || 'Placeholder Milestone'}
          </Text>
          {showSparkBadge && (
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeText}>SPARK</Text>
            </View>
          )}
        </View>
        
        {/* Bottom row with date and completion status */}
        <View style={styles.bottomRow}>
          {/* Left side - Target date */}
          <View style={styles.leftContent}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color="#364958" />
              <Text style={[
                styles.dateText,
                isOverdue ? styles.overdueText : null,
                isCompleted ? styles.completedText : null
              ]}>
                {milestone?.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'No target date'}
              </Text>
            </View>
          </View>

          {/* Right side - Action buttons */}
          <View style={styles.actionButtons}>
            <IconButton
              variant="complete"
              iconText="✓"
              pressed={isCompletePressed}
              onPress={() => {
                if (milestone?.id && onToggleComplete) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  
                  Alert.alert(
                    'Complete Milestone',
                    `Did you complete "${milestone.title}"?`,
                    [
                      {
                        text: 'No',
                        style: 'cancel',
                        onPress: () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      },
                      {
                        text: 'Yes',
                        onPress: async () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          soundService.playCompleteSound(); // Play completion sound
                          await onToggleComplete(milestone.id);
                          
                          // Show completion confirmation
                          setTimeout(() => {
                            Alert.alert(
                              '🎉 Milestone Completed!',
                              'Great job! Your milestone has been marked as complete.',
                              [{ text: 'OK', onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }]
                            );
                          }, 300);
                        }
                      }
                    ]
                  );
                }
              }}
              onPressIn={() => setIsCompletePressed(true)}
              onPressOut={() => setIsCompletePressed(false)}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E9EDC9',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 15,
    padding: 15,
    minHeight: 44,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  cardPressed: {
    shadowOffset: { width: 0, height: 2 },
  },
  completedCard: {
    backgroundColor: '#F0F8E8',
    borderColor: '#8FBC8F',
  },
  overdueCard: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFB6C1',
  },
  emptyCard: {
    backgroundColor: '#E9EDC9',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 15,
    padding: 16,
    minHeight: 44,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyCardPressed: {
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    minHeight: 60,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    width: '100%',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8FBC8F',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#364958',
  },
  overdueText: {
    color: '#DC143C',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  sparkBadge: {
    backgroundColor: '#FFE066',
    borderWidth: 0.5,
    borderColor: '#F4A261',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#8B4513',
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: emptyStateSpacing.contentPadding,
  },
  emptyTitle: {
    ...typography.emptyTitle,
    marginBottom: emptyStateSpacing.titleMarginBottom,
  },
  emptyDescription: {
    ...typography.emptyDescription,
  },
  emptyCompletedCard: {
    backgroundColor: '#EAE2B7',
    borderColor: '#B69121',
  },
  emptyCompletedTitle: {
    color: '#8B7355',
  },
  emptyCompletedDescription: {
    color: '#8B7355',
    opacity: 0.8,
  },
});
