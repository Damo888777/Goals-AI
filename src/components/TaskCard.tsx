import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import type { Task } from '../types';

interface TaskCardProps {
  task?: Task;
  isEmpty?: boolean;
  isFrog?: boolean;
  onPress?: () => void;
}

export function TaskCard({ task, isEmpty = false, isFrog = false, onPress }: TaskCardProps) {
  if (isEmpty) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.emptyCard}
      >
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>
            {isEmpty && isFrog ? 'No frog for today' : 'No tasks for today'}
          </Text>
          <Text style={styles.emptyDescription}>
            {isEmpty && isFrog ? 'What is your most important task for today?' : 'Your day looks clear. Add a task to get started.'}
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
        {/* Left side - Task info */}
        <View style={styles.taskInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {task?.title || 'Placeholder Task Title'}
          </Text>
          <Text style={styles.goalInfo}>
            {task?.goalId ? 'Goal attached' : 'No goal attached'}
          </Text>
          <View style={styles.dateRow}>
            <View style={styles.calendarIcon}>
              {/* Calendar icon placeholder */}
              <View style={{ width: 13, height: 13, backgroundColor: '#364958', borderRadius: 2 }} />
            </View>
            <Text style={styles.dateText}>
              {task?.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
            </Text>
          </View>
        </View>

        {/* Right side - Action buttons */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.completeButton}>
            <View style={styles.checkIcon}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </Pressable>
          <Pressable style={styles.pomodoroButton}>
            <Image 
              source={{ uri: images.icons.tomato }}
              style={styles.tomatoIcon}
              resizeMode="contain"
            />
          </Pressable>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  taskInfo: {
    flex: 1,
    gap: 8,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
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
    width: 13,
    height: 13,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#364958',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 0,
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
  },
  checkIcon: {
    width: 20,
    height: 20,
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
    marginLeft: 0,
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
});
