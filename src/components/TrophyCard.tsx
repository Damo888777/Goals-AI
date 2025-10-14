import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { borderRadius } from '../constants/spacing';
import { shadows } from '../constants/spacing';
import { touchTargets } from '../constants/spacing';
import { ChevronButton } from './ChevronButton';

export interface Achievement {
  id: string;
  title: string;
  achievedDate: string;
  isExpanded?: boolean;
  totalFocusTime: string;
  milestonesCompleted: number;
  tasksCompleted: number;
  journeyDuration: string;
  yourTakeaways: string;
  challengeConquered: string;
  futureImprovement: string;
}

interface TrophyCardProps {
  achievement: Achievement;
  onToggleExpand: (id: string) => void;
}

export default function TrophyCard({ achievement, onToggleExpand }: TrophyCardProps) {
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleExpand(achievement.id);
  };

  return (
    <View style={styles.trophyCard}>
      <Pressable 
        onPress={handleToggle}
        style={styles.trophyCardContent}
      >
        <View style={styles.innerContainer}>
          <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={styles.goalTitle}>{achievement.title}</Text>
            <Text style={styles.achievedText}>
              <Text style={styles.achievedLabel}>Achieved:</Text>
              <Text style={styles.achievedDate}> {achievement.achievedDate}</Text>
            </Text>
          </View>
          <ChevronButton
            direction="down"
            rotated={achievement.isExpanded}
            onPress={handleToggle}
            size="medium"
          />
        </View>
        
          
          {/* Expanded Content */}
          {achievement.isExpanded && (
            <View style={styles.expandedContent}>
            {/* Vision Board Placeholder */}
            <View style={styles.visionBoardPlaceholder} />
            
            {/* Statistics */}
            <View style={styles.statisticsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Total Focus Time</Text>
                <Text style={styles.statValue}>{achievement.totalFocusTime}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Milestones Completed</Text>
                <Text style={styles.statValue}>{achievement.milestonesCompleted} Milestones</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Tasks Completed</Text>
                <Text style={styles.statValue}>{achievement.tasksCompleted} Tasks</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Journey Duration</Text>
                <Text style={styles.statValue}>{achievement.journeyDuration}</Text>
              </View>
              
              <View style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.diamondIcon}>◊</Text>
                  <Text style={styles.reflectionTitle}>Your Takeaways</Text>
                </View>
                <Text style={styles.reflectionValue}>{achievement.yourTakeaways}</Text>
              </View>
              
              <View style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.diamondIcon}>◊</Text>
                  <Text style={styles.reflectionTitle}>Challenge Conquered</Text>
                </View>
                <Text style={styles.reflectionValue}>{achievement.challengeConquered}</Text>
              </View>
              
              <View style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.diamondIcon}>◊</Text>
                  <Text style={styles.reflectionTitle}>Future Improvement</Text>
                </View>
                <Text style={styles.reflectionValue}>{achievement.futureImprovement}</Text>
              </View>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  trophyCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    minHeight: 124,
    ...shadows.card,
  },
  trophyCardContent: {
    flex: 1,
  },
  innerContainer: {
    backgroundColor: colors.trophy.bg,
    borderWidth: 0.5,
    borderColor: colors.trophy.border,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    flex: 1,
    ...shadows.trophy,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  titleContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  goalTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xxs,
  },
  achievedText: {
    ...typography.caption,
    fontSize: 14,
  },
  achievedLabel: {
    fontWeight: '300',
  },
  achievedDate: {
    fontWeight: 'bold',
  },
  chevronButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  chevronLine1: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: colors.text.primary,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 2 }],
  },
  chevronLine2: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: colors.text.primary,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }, { translateX: 2 }, { translateY: 2 }],
  },
  expandedContent: {
    gap: spacing.lg,
    marginTop: spacing.lg,
    width: '100%',
  },
  visionBoardPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.sm,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
  },
  statisticsSection: {
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    ...typography.body,
  },
  statValue: {
    ...typography.cardTitle,
  },
  reflectionItem: {
    gap: spacing.xs,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  diamondIcon: {
    ...typography.small,
    fontSize: 12,
  },
  reflectionTitle: {
    ...typography.cardTitle,
  },
  reflectionValue: {
    ...typography.caption,
    fontSize: 14,
  },
});
