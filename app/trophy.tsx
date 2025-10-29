import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import TrophyCard from '../src/components/TrophyCard';
import { CompletedTaskCard } from '../src/components/CompletedTaskCard';
import { CompletedMilestoneCard } from '../src/components/CompletedMilestoneCard';
import { BackChevronButton } from '../src/components/ChevronButton';
import { typography } from '../src/constants/typography';
import { useGoals, useMilestones, useTasks } from '../src/hooks/useDatabase';
import type { Goal, Milestone, Task } from '../src/types';

type ViewMode = 'goals' | 'milestones';

export default function TrophyScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('goals');
  
  // Database hooks
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  const { tasks } = useTasks();
  
  // Filter completed items
  const completedGoals = goals.filter(goal => goal.isCompleted);
  const completedMilestones = milestones.filter(milestone => milestone.isComplete);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleViewToggle = (mode: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(mode);
  };


  return (
    <View style={styles.container}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 36,
          paddingBottom: 50,
          gap: 43,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <BackChevronButton
              onPress={handleBackPress}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>{t('trophy.header.title')}</Text>
          </View>
          <Text style={styles.headerDescription}>
            {t('trophy.header.description')}
          </Text>
        </View>
        
        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <Pressable
            onPress={() => handleViewToggle('goals')}
            style={[
              styles.toggleButton,
              viewMode === 'goals' && styles.toggleButtonActive
            ]}
          >
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'goals' && styles.toggleButtonTextActive
            ]}>
              {t('trophy.toggleButtons.goals')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleViewToggle('milestones')}
            style={[
              styles.toggleButton,
              viewMode === 'milestones' && styles.toggleButtonActive
            ]}
          >
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'milestones' && styles.toggleButtonTextActive
            ]}>
              {t('trophy.toggleButtons.milestones')}
            </Text>
          </Pressable>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {viewMode === 'goals' ? (
            completedGoals.length > 0 ? (
              completedGoals.map((goal) => (
                <TrophyCard
                  key={goal.id}
                  goal={{
                    id: goal.id,
                    title: goal.title,
                    description: goal.notes || '',
                    feelings: goal.feelings || [],
                    emotions: goal.feelings || [],
                    visionImageUrl: goal.visionImageUrl,
                    visionImages: goal.visionImageUrl ? [goal.visionImageUrl] : [],
                    milestones: [], // Empty array since TrophyCard doesn't need milestones
                    progress: 100, // Completed goals are 100%
                    isCompleted: goal.isCompleted,
                    completedAt: goal.completedAt,
                    reflectionAnswers: goal.reflectionAnswers,
                    notes: goal.notes,
                    creationSource: goal.creationSource,
                    createdAt: goal.createdAt,
                    updatedAt: goal.updatedAt
                  }}
                  onPress={() => router.push(`/completed-goal-details?id=${goal.id}`)}
                />
              ))
            ) : (
              <TrophyCard
                emptyState={{
                  title: t('trophy.emptyState.goals.title'),
                  description: t('trophy.emptyState.goals.description')
                }}
              />
            )
          ) : (
            completedMilestones.length > 0 ? (
              completedMilestones.map((milestone) => (
                <CompletedMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onPress={() => router.push(`/milestone-details?id=${milestone.id}`)}
                />
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateInner}>
                  <Text style={styles.emptyStateTitle}>{t('trophy.emptyState.milestones.title')}</Text>
                  <Text style={styles.emptyStateDescription}>
                    {t('trophy.emptyState.milestones.description')}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAE2B7', // Figma background color
  },
  headerSection: {
    gap: 8,
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 8px gap between back button and title
  },
  backButton: {
    width: 30, // 30x30px touchable area
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronIcon: {
    width: 20, // 20x20px icon size
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backChevronLine1: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1, // Rounded line caps
    transform: [{ rotate: '-45deg' }, { translateX: 2 }, { translateY: -2 }],
  },
  backChevronLine2: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1, // Rounded line caps
    transform: [{ rotate: '45deg' }, { translateX: 2 }, { translateY: 2 }],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
    textAlign: 'left',
    flex: 1,
  },
  headerDescription: {
    fontSize: 15,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: '300',
    textAlign: 'left',
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5EBE0',
    borderRadius: 12,
    padding: 4,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#B69121',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  toggleButtonTextActive: {
    color: '#F5EBE0',
    fontWeight: '600',
  },
  contentContainer: {
    width: '100%',
    gap: 16,
  },
  emptyStateCard: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    padding: 20,
    minHeight: 124,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyStateInner: {
    backgroundColor: '#EAE2B7',
    borderWidth: 0.5,
    borderColor: '#B69121',
    borderRadius: 20,
    padding: 15,
    flex: 1,
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateDescription: {
    ...typography.small,
    textAlign: 'center',
    marginTop: 8,
  },
});
