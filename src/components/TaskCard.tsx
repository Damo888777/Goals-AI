import { View, Text, Pressable, Animated, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows, touchTargets, emptyStateSpacing } from '../constants/spacing';
import type { Task } from '../types';
import { useRef, useState, useEffect } from 'react';
import { useGoals, useMilestones } from '../hooks/useDatabase';
import { IconButton } from './IconButton';
import { soundService } from '../services/soundService';

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
  const { t } = useTranslation();
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
        t('components.taskCard.alerts.deleteTask'),
        t('components.taskCard.alerts.deleteTaskMessage', { title: task.title }),
        [
          {
            text: t('components.taskCard.alerts.cancel'),
            style: 'cancel',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
          {
            text: t('components.taskCard.alerts.delete'),
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
            title: t('components.taskCard.emptyStates.noFrogToday'),
            description: t('components.taskCard.emptyStates.dayLooksClear')
          };
        case 'empty-someday':
          return {
            title: t('components.taskCard.emptyStates.noSomedayTasks'),
            description: t('components.taskCard.emptyStates.somedayDescription')
          };
        case 'empty-weekday':
        case 'empty-today':
          return {
            title: t('components.taskCard.emptyStates.noTasksToday'),
            description: t('components.taskCard.emptyStates.dayLooksClear')
          };
        case 'empty-completed':
          return {
            title: t('components.taskCard.emptyStates.noCompletedTasks'),
            description: t('components.taskCard.emptyStates.dayLooksClear')
          };
        default:
          return {
            title: t('components.taskCard.emptyStates.noTasks'),
            description: t('components.taskCard.emptyStates.dayLooksClear')
          };
      }
    };

    const content = getEmptyContent();
    const isCompletedEmpty = variant === 'empty-completed';

    return (
      <View style={[styles.emptyCard, isCompletedEmpty && styles.emptyCompletedCard]}>
        <View style={styles.emptyContent}>
          <Text style={[styles.emptyTitle, isCompletedEmpty && styles.emptyCompletedTitle]}>
            {content.title}
          </Text>
          <Text style={[styles.emptyDescription, isCompletedEmpty && styles.emptyCompletedDescription]}>
            {content.description}
          </Text>
        </View>
      </View>
    );
  }

  // Determine card styling based on variant
  const isCompleted = variant === 'completed';
  const isFrog = task?.isFrog || variant === 'active-frog';
  const hasDate = variant === 'active-with-date' || task?.scheduledDate;
  const showSparkBadge = false; // Disabled Spark badge display

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
            {task?.title || t('components.taskCard.placeholderTitle')}
          </Text>
          {showSparkBadge && (
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeText}>{t('components.taskCard.sparkBadge')}</Text>
            </View>
          )}
        </View>
        
        {/* Bottom row with project info and buttons */}
        <View style={styles.bottomRow}>
          {/* Left side - Project info */}
          <View style={styles.leftContent}>
            <View style={styles.goalRow}>
              <View style={styles.goalIcon}>
                <Ionicons name="flag" size={12} color="#364958" />
              </View> 
              <Text style={[
                styles.goalInfo,
                isCompleted && styles.completedText
              ]} numberOfLines={1}>
                {milestoneName ? milestoneName : 
                 goalName ? goalName : 
                 task?.goalId || task?.milestoneId ? t('components.taskCard.projectInfo.linkedToProject') : t('components.taskCard.projectInfo.noProjectLinked')}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color="#364958" />
              <Text style={[
                styles.dateText,
                isCompleted && styles.completedText
              ]}>
                {hasDate && task?.scheduledDate 
                  ? formatDate(new Date(task.scheduledDate)) 
                  : variant === 'completed' 
                    ? `${t('components.taskCard.dateInfo.completed')} ${task?.updatedAt ? formatDate(new Date(task.updatedAt)) : t('components.taskCard.dateInfo.recently')}` 
                    : t('components.taskCard.dateInfo.someday')
                }
              </Text>
            </View>
          </View>

          {/* Right side - Action buttons */}
          <View style={styles.actionButtons}>
            {isFrog && (
              <View style={styles.frogBadgeSmall}>
                <Image 
                  source={require('../../assets/frog.png')}
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
                    t('components.taskCard.alerts.completeTask'),
                    t('components.taskCard.alerts.completeTaskMessage', { title: task.title }),
                    [
                      {
                        text: t('components.taskCard.alerts.no'),
                        style: 'cancel',
                        onPress: () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      },
                      {
                        text: t('components.taskCard.alerts.yes'),
                        onPress: async () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          soundService.playCompleteSound(); // Play completion sound
                          await onToggleComplete(task.id);
                          
                          // Show completion confirmation
                          setTimeout(() => {
                            Alert.alert(
                              t('components.taskCard.alerts.taskCompleted'),
                              t('components.taskCard.alerts.taskCompletedMessage'),
                              [{ text: t('components.taskCard.alerts.ok'), onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }]
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
              onPress={() => router.push(`/pomodoro?taskTitle=${encodeURIComponent(task?.title || 'Task')}&taskId=${task?.id || ''}`)}
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
    gap: 3,
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
    marginTop: 0,
  },
  leftContent: {
    flex: 1,
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
  goalInfo: {
    fontSize: 12,
    fontWeight: '300',
    color: '#364958',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
    marginBottom: 0,
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
    borderWidth: 1,
    borderColor: '#9B9B9B',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 2,
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
