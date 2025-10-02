import { View, Text, Pressable, StyleSheet } from 'react-native';
import { typography } from '../constants/typography';
import type { Milestone } from '../types';

interface MilestoneCardProps {
  milestone?: Milestone & { creationSource?: 'spark' | 'manual' };
  isEmpty?: boolean;
  onPress?: () => void;
}

export function MilestoneCard({ milestone, isEmpty = false, onPress }: MilestoneCardProps) {
  if (isEmpty) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.emptyCard}
      >
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>
            No milestones yet
          </Text>
          <Text style={styles.emptyDescription}>
            Break down your goals into achievable milestones
          </Text>
        </View>
      </Pressable>
    );
  }

  const isOverdue = milestone?.targetDate && new Date(milestone.targetDate) < new Date();
  const isCompleted = milestone?.isComplete;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        isCompleted && styles.completedCard,
        isOverdue && !isCompleted && styles.overdueCard
      ]}
    >
      <View style={styles.content}>
        {/* Title with creation source badge */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { flex: 1 }, isCompleted && styles.completedText]} numberOfLines={2}>
            {milestone?.title || 'Placeholder Milestone'}
          </Text>
          {milestone?.creationSource === 'spark' && (
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeText}>
                ✨ AI
              </Text>
            </View>
          )}
        </View>
        
        {/* Bottom row with date and completion status */}
        <View style={styles.bottomRow}>
          {/* Left side - Target date */}
          <View style={styles.leftContent}>
            <View style={styles.dateRow}>
              <View style={styles.calendarIcon}>
                {/* Vector Calendar Icon */}
                <View style={styles.calendarVector}>
                  <View style={styles.calendarHeader} />
                  <View style={styles.calendarRings}>
                    <View style={styles.calendarRing} />
                    <View style={styles.calendarRing} />
                  </View>
                  <View style={styles.calendarGrid}>
                    <View style={styles.calendarRow}>
                      <View style={styles.calendarCell} />
                      <View style={styles.calendarCell} />
                      <View style={styles.calendarCell} />
                    </View>
                    <View style={styles.calendarRow}>
                      <View style={styles.calendarCell} />
                      <View style={[styles.calendarCell, styles.calendarCellActive]} />
                      <View style={styles.calendarCell} />
                    </View>
                  </View>
                </View>
              </View>
              <Text style={[
                styles.dateText,
                isOverdue && !isCompleted && styles.overdueText,
                isCompleted && styles.completedText
              ]}>
                {milestone?.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'No target date'}
              </Text>
            </View>
          </View>

          {/* Right side - Status indicator */}
          <View style={styles.statusIndicator}>
            {isCompleted ? (
              <View style={styles.completedIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            ) : (
              <View style={[
                styles.progressIndicator,
                isOverdue && styles.overdueIndicator
              ]} />
            )}
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
    gap: 8,
  },
  calendarIcon: {
    width: 16,
    height: 16,
  },
  calendarVector: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#364958',
    borderRadius: 2,
    position: 'relative',
  },
  calendarHeader: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 3,
    backgroundColor: '#364958',
    borderRadius: 1,
  },
  calendarRings: {
    position: 'absolute',
    top: -2,
    left: 3,
    right: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarRing: {
    width: 2,
    height: 4,
    backgroundColor: '#364958',
    borderRadius: 1,
  },
  calendarGrid: {
    position: 'absolute',
    top: 6,
    left: 2,
    right: 2,
    bottom: 2,
    gap: 1,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  calendarCell: {
    width: 2,
    height: 2,
    backgroundColor: '#A3B18A',
    borderRadius: 0.5,
  },
  calendarCellActive: {
    backgroundColor: '#364958',
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
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIndicator: {
    width: 24,
    height: 24,
    backgroundColor: '#8FBC8F',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#A3B18A',
    borderRadius: 6,
  },
  overdueIndicator: {
    backgroundColor: '#DC143C',
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
    color: '#E76F51',
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.small,
    textAlign: 'center',
    marginTop: 8,
  },
});
