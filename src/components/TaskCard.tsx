import { View, Text, Pressable, Animated, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows, touchTargets, emptyStateSpacing } from '../constants/spacing';
import type { Task } from '../types';
import { useRef, useState, useEffect } from 'react';
import { useGoals, useMilestones } from '../hooks/useDatabase';
import { IconButton } from './IconButton';

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
  const [goalName, setGoalName] = useState<string | null>(null);
  const [milestoneName, setMilestoneName] = useState<string | null>(null);
  
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  
  // Fetch goal and milestone names when task changes
  useEffect(() => {
    console.log('🎯 TaskCard debug:', {
      taskId: task?.id,
      taskTitle: task?.title,
      goalId: task?.goalId,
      milestoneId: task?.milestoneId,
      goalsCount: goals.length,
      milestonesCount: milestones.length
    });
    
    if (task?.goalId && goals.length > 0) {
      const goal = goals.find(g => g.id === task.goalId);
      console.log('🎯 Found goal:', goal?.title);
      setGoalName(goal?.title || null);
    } else {
      setGoalName(null);
    }
    
    if (task?.milestoneId && milestones.length > 0) {
      const milestone = milestones.find(m => m.id === task.milestoneId);
      console.log('📍 Found milestone:', milestone?.title);
      setMilestoneName(milestone?.title || null);
    } else {
      setMilestoneName(null);
    }
  }, [task?.goalId, task?.milestoneId, goals, milestones]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert(
        'Delete Task',
        `Are you sure you want to delete "${task.title}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              isDeleting.current = true;
              await onDelete(task.id);
            }
          }
        ]
      );
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
              {
                backgroundColor: isPressed 
                  ? (isCompleted ? '#D4D1A1' : '#D4E2B8')
                  : (isCompleted ? '#EAE2B7' : '#E9EDC9'),
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
        </View>
        
        {/* Bottom row with project info and buttons */}
        <View style={styles.bottomRow}>
          {/* Left side - Project info */}
          <View style={styles.leftContent}>
            <Text style={[
              styles.goalInfo,
              isCompleted && styles.completedText
            ]} numberOfLines={1}>
              {milestoneName ? `📍 ${milestoneName}` : 
               goalName ? `🎯 ${goalName}` : 
               task?.goalId || task?.milestoneId ? 'Linked to project' : 'No project linked'}
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
            {isFrog && (
              <View style={styles.frogBadgeSmall}>
                <Image 
                  source={{ uri: 'https://s3-alpha-sig.figma.com/img/077f/e118/305b3d191f10f5d5855d5f074942d0d5?Expires=1760313600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=MNj3ZK~tjl3RoKhbiLiUJX46IrmmSdSYBjovP3IP8WLxvj8jX9~CP9c95APsjf27TBc7mpqTjsrZI6VyovnQcFaQ2CqD2wP9ToNmM0rOYWllfHPR2VZy6OmvvCT-WsrgrIRrmYSIBEhOp43d8mRlZQEOmEu8sKm-7t2h0qhFXKDgMreHt9DF6jtbt1H~oJxzPqj2Qh8je2ImAQA-d6vVMrTLr1lm4va2QytH13yFdgeni5TqvaMZNDYnYhrn901gQyNgyJfUSg0A4zxHkNs-DQSA2TKlc2kmERUzwl38iaRT1FfEERIk7da3z9QOPNKyQSpLdLM4gbeDhvXV90OAtQ__' }}
                  style={styles.frogIconSmall}
                  contentFit="contain"
                />
              </View>
            )}
            <IconButton
              variant="complete"
              iconText="✓"
              pressed={isCompletePressed}
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
            />
            <IconButton
              variant="pomodoro"
              iconSource={images.icons.tomato}
              pressed={isPomodoroPressed}
              onPress={() => router.push('/pomodoro')}
              onPressIn={() => setIsPomodoroPressed(true)}
              onPressOut={() => setIsPomodoroPressed(false)}
            />
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
        <IconButton
          variant="delete"
          iconName="delete"
          onPress={handleDelete}
        />
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
    backgroundColor: colors.background.primary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: touchTargets.minimum,
    ...shadows.card,
  },
  emptyCard: {
    backgroundColor: colors.background.primary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: touchTargets.minimum,
    ...shadows.card,
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
    alignItems: 'flex-end',
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
  rightContent: {
    alignItems: 'flex-end',
    gap: 4,
  },
  frogBadgeSmall: {
    width: 24,
    height: 24,
    backgroundColor: colors.success,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#9b9b9b',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    padding: 3,
    marginRight: 8,
  },
  frogIconSmall: {
    width: 16,
    height: 16,
    opacity: 1,
  },
  frogBadgeSmallText: {
    fontSize: 10,
  },
  completedCard: {
    backgroundColor: colors.trophy.bg,
    borderColor: colors.trophy.border,
  },
  frogCard: {
    backgroundColor: colors.accent.frog,
    borderColor: colors.border.primary,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  completedText: {
    color: colors.text.tertiary,
    opacity: 0.8,
  },
  emptyCompletedCard: {
    backgroundColor: colors.trophy.bg,
    borderColor: colors.trophy.border,
  },
  emptyCompletedTitle: {
    color: colors.text.tertiary,
  },
  emptyCompletedDescription: {
    color: colors.text.tertiary,
    opacity: 0.8,
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
});
