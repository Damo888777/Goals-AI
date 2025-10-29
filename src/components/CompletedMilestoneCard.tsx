import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { typography } from '../constants/typography';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import type { Milestone } from '../types';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useGoals } from '../hooks/useDatabase';

interface CompletedMilestoneCardProps {
  milestone?: Milestone;
  onPress?: () => void;
  emptyState?: {
    title: string;
    description: string;
  };
}

export function CompletedMilestoneCard({ milestone, onPress, emptyState }: CompletedMilestoneCardProps) {
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  const [goalName, setGoalName] = useState<string | null>(null);
  
  const { goals } = useGoals();
  
  // Fetch goal name when milestone changes
  useEffect(() => {
    if (milestone?.goalId && goals.length > 0) {
      const goal = goals.find(g => g.id === milestone.goalId);
      setGoalName(goal?.title || null);
    } else {
      setGoalName(null);
    }
  }, [milestone?.goalId, goals]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\s/g, '.');
  };

  // Empty state rendering
  if (emptyState) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>{emptyState.title}</Text>
        <Text style={styles.emptyStateDescription}>{emptyState.description}</Text>
      </View>
    );
  }

  // Regular milestone rendering
  if (!milestone || !milestone.id) return null;

  return (
    <View style={styles.outerContainer}>
      <Pressable 
        onPress={() => {
          if (milestone && milestone.id) {
            router.push(`/milestone-details?id=${milestone.id}`);
          } else if (onPress) {
            onPress();
          }
        }} 
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.container,
          {
            backgroundColor: '#EAE2B7',
            transform: [{ scale: isPressed ? 0.98 : 1 }]
          }
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {milestone.title}
          </Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.goalRow}>
              <View style={styles.goalIcon}>
                <Ionicons name="flag" size={12} color="#364958" />
              </View>
              <Text style={styles.projectText}>
                {goalName || t('completedMilestoneCard.noGoalLinked')}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color="#364958" />
              <Text style={styles.completionDate}>
                {t('completedMilestoneCard.completed')}: {formatDate(milestone.updatedAt?.toISOString() || new Date().toISOString())}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.xs,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  container: {
    backgroundColor: '#EAE2B7',
    borderWidth: 0.5,
    borderColor: '#B69121',
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  content: {
    gap: 3,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    width: '100%',
  },
  metaInfo: {
    gap: 1,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalIcon: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionDate: {
    ...typography.caption,
    color: colors.text.primary,
  },
  emptyState: {
    backgroundColor: '#EAE2B7',
    borderWidth: 0.5,
    borderColor: '#926C15',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyStateTitle: {
    ...typography.emptyTitle,
    marginBottom: spacing.xs,
  },
  emptyStateDescription: {
    ...typography.emptyDescription,
  },
});