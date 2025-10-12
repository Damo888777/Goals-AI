import { View, Text, Pressable, Animated, StyleSheet, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import type { Task } from '../types';
import { useRef, useState } from 'react';

// Format date as Dec.05.2025
const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}.${day}.${year}`;
};

type TaskCardVariant = 
  | 'empty-today'
  | 'empty-weekday' 
  | 'empty-someday'
  | 'empty-frog'
  | 'active-with-date'
  | 'active-without-date'
  | 'active-frog'
  | 'completed'
  | 'empty-completed';

interface TaskCardProps {
  task?: Task | null;
  variant: TaskCardVariant;
  onPress?: () => void;
  onToggleComplete?: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  creationSource?: 'spark' | 'manual';
}

export function TaskCard({ task, variant, onPress, onToggleComplete, onDelete, creationSource }: TaskCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isDeleting = useRef(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isCompletePressed, setIsCompletePressed] = useState(false);
  const [isPomodoroPressed, setIsPomodoroPressed] = useState(false);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -20 && !isDeleting.current) {
        Animated.spring(translateX, {
          toValue: -80,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleDelete = () => {
    if (task?.id && onDelete) {
      isDeleting.current = true;
      onDelete(task.id);
    }
  };
  // Empty state variants
  if (variant.startsWith('empty')) {
    const getEmptyContent = () => {
      switch (variant) {
        case 'empty-frog':
          return {
            title: 'No frog for today',
            description: 'What is your most important task for today?'
          };
        case 'empty-someday':
          return {
            title: 'No someday tasks',
            description: 'Add tasks for future consideration or when you have time.'
          };
        case 'empty-weekday':
        case 'empty-today':
          return {
            title: 'No tasks for today',
            description: 'Your day looks clear. Add a task to get started.'
          };
        case 'empty-completed':
          return {
            title: 'No completed tasks',
            description: 'Complete some tasks to see them here.'
          };
        default:
          return {
            title: 'No tasks',
            description: 'Add a task to get started.'
          };
      }
    };

    const content = getEmptyContent();
    const isCompletedEmpty = variant === 'empty-completed';

    return (
      <Pressable
        onPress={onPress}
        style={[styles.emptyCard, isCompletedEmpty && styles.emptyCompletedCard]}
      >
        <View style={styles.emptyContent}>
          <Text style={[styles.emptyTitle, isCompletedEmpty && styles.emptyCompletedTitle]}>
            {content.title}
          </Text>
          <Text style={[styles.emptyDescription, isCompletedEmpty && styles.emptyCompletedDescription]}>
            {content.description}
          </Text>
        </View>
      </Pressable>
    );
  }

  // Determine card styling based on variant
  const isCompleted = variant === 'completed';
  const isFrog = variant === 'active-frog';
  const hasDate = variant === 'active-with-date' || task?.scheduledDate;
  const showSparkBadge = creationSource === 'spark';

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={[styles.cardWrapper, { transform: [{ translateX }] }]}>
          <Pressable
            onPress={() => {
              if (task?.id) {
                router.push(`/task-details?id=${task.id}`);
              } else if (onPress) {
                onPress();
              }
            }}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={[
              styles.card,
              isCompleted && styles.completedCard,
              isFrog && styles.frogCard,
              {
                backgroundColor: isPressed 
                  ? (isCompleted ? '#D4D1A1' : isFrog ? '#E8FFF8' : '#D4E2B8')
                  : (isCompleted ? '#EAE2B7' : isFrog ? '#F0FFF0' : '#E9EDC9'),
                transform: [{ scale: isPressed ? 0.98 : 1 }]
              }
            ]}
          >
            <View style={styles.content}>
        {/* Title with creation source badge */}
        <View style={styles.titleRow}>
          <Text style={[
            styles.title, 
            { flex: 1 },
            isCompleted && styles.completedTitle
          ]} numberOfLines={3}>
            {task?.title || 'Placeholder Task Title'}
          </Text>
          {showSparkBadge && (
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeText}>SPARK</Text>
            </View>
          )}
          {isFrog && (
            <View style={styles.frogBadge}>
              <Text style={styles.frogBadgeText}>🐸</Text>
            </View>
          )}
        </View>
        
        {/* Bottom row with project info and buttons */}
        <View style={styles.bottomRow}>
          {/* Left side - Project info */}
          <View style={styles.leftContent}>
            <Text style={[
              styles.goalInfo,
              isCompleted && styles.completedText
            ]}>
              {task?.goalId || task?.milestoneId ? 'Linked to project' : 'No project linked'}
            </Text>
            <View style={styles.dateRow}>
              <Text style={{ fontSize: 12, color: '#364958' }}>📅</Text>
              <Text style={[
                styles.dateText,
                isCompleted && styles.completedText
              ]}>
                {hasDate && task?.scheduledDate 
                  ? formatDate(new Date(task.scheduledDate)) 
                  : variant === 'completed' 
                    ? `Completed: ${task?.updatedAt ? formatDate(new Date(task.updatedAt)) : 'Recently'}` 
                    : 'Someday'
                }
              </Text>
            </View>
          </View>

          {/* Right side - Action buttons */}
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.completeButton, isCompletePressed && styles.completeButtonPressed]}
              onPress={() => {
                if (task?.id && onToggleComplete) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  
                  Alert.alert(
                    'Complete Task',
                    `Did you complete "${task.title}"?`,
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
                          await onToggleComplete(task.id);
                          
                          // Show completion confirmation
                          setTimeout(() => {
                            Alert.alert(
                              '🎉 Task Completed!',
                              'Great job! Your task has been marked as complete.',
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
            >
              <View style={[
                styles.checkIcon, 
                (task?.isComplete || isCompleted) && styles.checkIconCompleted
              ]}>
                <Text style={[
                  styles.checkmark, 
                  (task?.isComplete || isCompleted) && styles.checkmarkCompleted
                ]}>✓</Text>
              </View>
            </Pressable>
            <Pressable 
              style={[styles.pomodoroButton, isPomodoroPressed && styles.pomodoroButtonPressed]}
              onPress={() => router.push('/pomodoro')}
              onPressIn={() => setIsPomodoroPressed(true)}
              onPressOut={() => setIsPomodoroPressed(false)}
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
      </Animated.View>
      </PanGestureHandler>
      
      {/* Delete State - Full Card Transform */}
      <Animated.View style={[
        styles.deleteState,
        {
          opacity: translateX.interpolate({
            inputRange: [-80, -40, 0],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
          }),
        }
      ]}>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Icon name="delete" size={32} color="#B23A48" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
    marginBottom: 8,
  },
  cardWrapper: {
    zIndex: 1,
  },
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
  completeButtonPressed: {
    shadowOffset: { width: 0, height: 2 },
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
  pomodoroButtonPressed: {
    shadowOffset: { width: 0, height: 2 },
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
  frogBadge: {
    backgroundColor: '#90EE90',
    borderWidth: 0.5,
    borderColor: '#228B22',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frogBadgeText: {
    fontSize: 12,
  },
  completedCard: {
    backgroundColor: '#EAE2B7',
    borderColor: '#B69121',
  },
  frogCard: {
    backgroundColor: '#F0FFF0',
    borderColor: '#90EE90',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#8B7355',
  },
  completedText: {
    color: '#8B7355',
    opacity: 0.8,
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
  checkIconCompleted: {
    backgroundColor: '#A3B18A',
    borderColor: '#A3B18A',
  },
  checkmarkCompleted: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deleteState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2CCC3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 12,
    paddingRight: 25,
  },
});
