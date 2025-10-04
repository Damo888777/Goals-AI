import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import type { Task } from '../types';

interface TaskCardProps {
  task?: Task | null;
  isEmpty?: boolean;
  isFrog?: boolean;
  onPress?: () => void;
  onToggleComplete?: (taskId: string) => Promise<void>;
}

export function TaskCard({ task, isEmpty = false, isFrog = false, onPress, onToggleComplete }: TaskCardProps) {
  if (isEmpty) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.emptyCard}
      >
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>
            {isEmpty && isFrog ? 'No frog for today' : 'No someday tasks'}
          </Text>
          <Text style={styles.emptyDescription}>
            {isEmpty && isFrog ? 'What is your most important task for today?' : 'Add tasks for future consideration or when you have time.'}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.content}>
        {/* Title with creation source badge */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { flex: 1 }]} numberOfLines={3}>
            {task?.title || 'Placeholder Task Title'}
          </Text>
          {task?.creationSource === 'spark' && (
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeText}>
                ✨ AI
              </Text>
            </View>
          )}
        </View>
        
        {/* Bottom row with project info and buttons */}
        <View style={styles.bottomRow}>
          {/* Left side - Project info */}
          <View style={styles.leftContent}>
            <Text style={styles.goalInfo}>
              {task?.goalId || task?.milestoneId ? 'Linked to project' : 'No project linked'}
            </Text>
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
              <Text style={styles.dateText}>
                {task?.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'Someday'}
              </Text>
            </View>
          </View>

          {/* Right side - Action buttons */}
          <View style={styles.actionButtons}>
            <Pressable 
              style={styles.completeButton}
              onPress={() => task?.id && onToggleComplete?.(task.id)}
            >
              <View style={[styles.checkIcon, task?.isComplete && styles.checkIconCompleted]}>
                <Text style={[styles.checkmark, task?.isComplete && styles.checkmarkCompleted]}>✓</Text>
              </View>
            </Pressable>
            <Pressable 
              style={styles.pomodoroButton}
              onPress={() => router.push('/pomodoro')}
            >
              <Image 
                source={{ uri: images.icons.tomato }}
                style={styles.tomatoIcon}
                contentFit="contain"
              />
            </Pressable>
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
    minHeight: 80,
    gap: 12,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    width: '100%',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    gap: 4,
  },
  goalInfo: {
    fontSize: 12,
    fontWeight: '300',
    color: '#364958',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#A3B18A',
    borderWidth: 1,
    borderColor: '#9B9B9B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  checkIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#F5EBE0',
    fontWeight: '700',
  },
  pomodoroButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F2CCC3',
    borderWidth: 1,
    borderColor: '#9B9B9B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  tomatoIcon: {
    width: 22,
    height: 22,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
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
  checkIconCompleted: {
    backgroundColor: '#A3B18A',
    borderColor: '#A3B18A',
  },
  checkmarkCompleted: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
