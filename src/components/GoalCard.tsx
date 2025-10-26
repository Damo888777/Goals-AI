import { View, Text, Pressable, Animated, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { router, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState, useRef, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows, touchTargets, emptyStateSpacing } from '../constants/spacing';
import { ChevronButton } from './ChevronButton';
import { IconButton } from './IconButton';
import { soundService } from '../services/soundService';
import { GoalCompletionModal } from './GoalCompletionModal';
import { goalCompletionService } from '../services/goalCompletionService';
import type { Goal, Milestone } from '../types';

// Separate component for milestone cards to fix hooks order
interface MilestoneCardProps {
  milestone: Milestone;
  goal?: Goal;
  onMilestoneComplete?: (milestoneId: string) => void;
  onMilestoneDelete?: (milestoneId: string) => void;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, goal, onMilestoneComplete, onMilestoneDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isDeleting = useRef(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isCompletePressed, setIsCompletePressed] = useState(false);
  const router = useRouter();

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
    if (onMilestoneDelete) {
      isDeleting.current = true;
      onMilestoneDelete(milestone.id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\s/g, '.');
  };

  return (
    <View style={{ position: 'relative', overflow: 'visible', marginBottom: 8 }}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={{ transform: [{ translateX }], zIndex: 1 }}>
          <Pressable
            onPress={() => {
              if (milestone?.id) {
                router.push(`/milestone-details?id=${milestone.id}`);
              }
            }}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={{
              backgroundColor: isPressed ? '#E8D5C4' : '#F5EBE0',
              borderWidth: 0.5,
              borderColor: colors.border.primary,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xl,
              minHeight: 91,
              ...shadows.card,
              transform: [{ scale: isPressed ? 0.98 : 1 }],
            }}
          >
            {/* Milestone Content */}
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{
                ...typography.cardTitle,
                fontFamily: 'Helvetica',
              }}>
                {milestone.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="flag" size={12} color="#364958" />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: '#364958',
                  fontFamily: 'Helvetica',
                }}>
                  {goal?.title || 'Goal Title'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar-outline" size={12} color="#364958" />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: '#364958',
                  fontFamily: 'Helvetica',
                }}>
                  {formatDate(milestone.targetDate)}
                </Text>
              </View>
            </View>

            {/* Complete Button */}
            <IconButton
              variant="complete"
              iconText="✓"
              pressed={isCompletePressed}
              onPress={() => {
                if (milestone?.id && onMilestoneComplete) {
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
                          onMilestoneComplete(milestone.id);
                          
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
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Delete State - Full Card Transform */}
      <Animated.View style={[
        styles.milestoneDeleteState,
        {
          opacity: translateX.interpolate({
            inputRange: [-80, -40, 0],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
          }),
        }
      ]}>
        <Pressable onPress={handleDelete} style={styles.milestoneDeleteButton}>
          <Text style={{ fontSize: 24, color: '#B23A48' }}>🗑️</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

type GoalCardVariant = 
  | 'empty'
  | 'active-without-vision'
  | 'active-with-vision'
  | 'empty-completed'
  | 'active-completed'
  | 'selection-compact'
  | 'selection-empty';

interface GoalCardProps {
  goal?: Goal;
  variant: GoalCardVariant;
  milestones?: Milestone[];
  expanded?: boolean;
  onPress?: () => void;
  onToggleExpand?: () => void;
  onMilestoneComplete?: (milestoneId: string) => void;
  onMilestoneDelete?: (milestoneId: string) => void;
  creationSource?: 'spark' | 'manual';
  onAttach?: () => void;
  onDetach?: () => void;
  isAttached?: boolean;
  onDelete?: (goalId: string) => Promise<void>;
  onGoalComplete?: (goalId: string) => Promise<void>;
  allMilestones?: Milestone[];
}

export function GoalCard({ 
  goal, 
  variant, 
  milestones = [], 
  onPress, 
  onToggleExpand, 
  expanded = false, 
  onMilestoneComplete, 
  onMilestoneDelete,
  onAttach,
  onDetach,
  isAttached = false,
  creationSource,
  onDelete,
  onGoalComplete,
  allMilestones = []
}: GoalCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const router = useRouter();
  const [isEmptyPressed, setIsEmptyPressed] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const isDeleting = useRef(false);
  const [showGoalCompletionModal, setShowGoalCompletionModal] = useState(false);

  // Handle milestone completion and check if goal should be completed
  const handleMilestoneCompletion = async (milestoneId: string) => {
    if (onMilestoneComplete) {
      await onMilestoneComplete(milestoneId);
      
      // Check if goal should be completed after milestone completion
      if (goal?.id) {
        const shouldTriggerGoalCompletion = goalCompletionService.shouldCheckGoalCompletion(
          { id: milestoneId, isComplete: true, goalId: goal.id } as Milestone,
          allMilestones
        );
        
        if (shouldTriggerGoalCompletion && !goal.isCompleted) {
          setShowGoalCompletionModal(true);
        }
      }
    }
  };

  // Handle goal completion with optional reflection data
  const handleGoalCompletion = async (goalId: string, reflectionData?: any) => {
    if (onGoalComplete) {
      await onGoalComplete(goalId);
    }
    setShowGoalCompletionModal(false);
  };

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
    if (goal?.id && onDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert(
        'Delete Goal',
        `Are you sure you want to delete "${goal.title}"?`,
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
              await onDelete(goal.id);
            }
          }
        ]
      );
    }
  };
  
  // Selection compact variant for goal selection dropdowns
  if (variant === 'selection-compact') {
    if (!goal) return null;
    
    return (
      <View style={styles.goalSelectionCard}>
        <Text style={styles.goalSelectionTitle}>{goal.title}</Text>
        <TouchableOpacity
          style={[
            styles.goalSelectionButton,
            {
              backgroundColor: isAttached ? '#BC4B51' : '#A3B18A',
            }
          ]}
          onPress={isAttached ? onDetach : onAttach}
        >
          {isAttached ? (
            <View style={styles.xIcon}>
              <View style={styles.xLine1} />
              <View style={styles.xLine2} />
            </View>
          ) : (
            <View style={styles.plusIcon}>
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Selection empty variant for when no goals exist
  if (variant === 'selection-empty') {
    return (
      <View style={styles.goalSelectionEmptyCard}>
        <Text style={styles.goalSelectionEmptyTitle}>No goals yet</Text>
        <Text style={styles.goalSelectionEmptyDescription}>Create your first goal and start your journey</Text>
      </View>
    );
  }

  // Empty state variants
  if (variant === 'empty' || variant === 'empty-completed') {
    const isCompletedEmpty = variant === 'empty-completed';
    const content = isCompletedEmpty 
      ? { title: 'No completed goals', description: 'Complete some goals to see them here.' }
      : { title: 'No goals yet', description: 'Create a goal and start your journey' };

    return (
      <Pressable onPress={onPress} style={[
        styles.emptyInnerCard,
        isCompletedEmpty && styles.emptyCompletedInnerCard
      ]}>
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
      </Pressable>
    );
  }

  // Determine card properties based on variant
  const isCompleted = variant === 'active-completed';
  const hasVisionImage = variant === 'active-with-vision' && goal?.visionImageUrl;
  const showSparkBadge = creationSource === 'spark';
  
  // Calculate progress using goalCompletionService
  const progress = goal?.id 
    ? goalCompletionService.calculateProgress(goal.id, allMilestones)
    : 0;
  
  const emotions = goal?.emotions || goal?.feelings || [];
  const displayedEmotions = emotions.slice(0, 2);
  const remainingCount = emotions.length - 2;
  const goalMilestones = milestones || goal?.milestones || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\s/g, '.');
  };

  // Emotion color mapping based on manual-goal.tsx
  const getEmotionStyle = (emotion: string, index: number) => {
    const emotionStyles: { [key: string]: { backgroundColor: string; borderColor: string; textColor: string } } = {
      'confident': { backgroundColor: '#f7e1d7', borderColor: '#a4133c', textColor: '#a4133c' },
      'grateful': { backgroundColor: '#a1c181', borderColor: '#081c15', textColor: '#081c15' },
      'proud': { backgroundColor: '#cdb4db', borderColor: '#3d405b', textColor: '#3d405b' },
      'calm': { backgroundColor: '#dedbd2', borderColor: '#335c67', textColor: '#335c67' },
      'energized': { backgroundColor: '#eec170', borderColor: '#780116', textColor: '#780116' },
      'happy': { backgroundColor: '#bde0fe', borderColor: '#023047', textColor: '#023047' },
      'empowered': { backgroundColor: '#eae2b7', borderColor: '#bb3e03', textColor: '#bb3e03' },
      'excited': { backgroundColor: '#f4a261', borderColor: '#b23a48', textColor: '#b23a48' },
      'fulfilled': { backgroundColor: '#f8ad9d', borderColor: '#e07a5f', textColor: '#e07a5f' },
    };
    
    const emotionKey = emotion.toLowerCase();
    return emotionStyles[emotionKey] || {
      backgroundColor: index === 0 ? '#BDE0FE' : '#CDB4DB',
      borderColor: index === 0 ? '#023047' : '#3D405B',
      textColor: index === 0 ? '#023047' : '#3D405B'
    };
  };

  return (
    <View style={styles.goalCardContainer}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={[styles.goalCardWrapper, { transform: [{ translateX }] }]}>
          <View style={[
            styles.innerCard,
            isCompleted && styles.completedInnerCard
          ]}>
            {/* Vision Image */}
            {hasVisionImage && (
          <View style={{
            height: 102,
            borderWidth: 0.5,
            borderColor: '#A3B18A',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            marginBottom: 15,
            marginHorizontal: -15,
            marginTop: -15,
            overflow: 'hidden',
          }}>
            <Image
              source={{ uri: goal?.visionImageUrl }}
              style={{
                width: '100%',
                height: '100%',
              }}
              contentFit="cover"
            />
          </View>
        )}

        {/* Main Content */}
        <View style={{ position: 'relative' }}>
          <View style={{ flexDirection: 'row', alignItems: expanded ? 'flex-start' : 'center' }}>
            {/* Left side - Title and Progress */}
            <View style={{ flex: 1, gap: 9 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{
                ...typography.cardTitle,
                lineHeight: 20,
                flex: 1,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? '#8B7355' : '#364958',
              }} numberOfLines={2}>
                {goal?.title || 'Placeholder Title'}
              </Text>
              {showSparkBadge && (
                <View style={styles.sparkBadge}>
                  <Text style={styles.sparkBadgeText}>SPARK</Text>
                </View>
              )}
            </View>

              {/* Progress Bar */}
              <View style={{ height: 17, justifyContent: 'center' }}>
              <View style={{
                height: 6,
                backgroundColor: 'rgba(120,120,120,0.2)',
                borderRadius: 3,
                marginRight: 75, // 59px (emotion badges width) + 8px gap + 8px extra margin
              }}>
                <View style={{
                  height: 6,
                  backgroundColor: '#A1C181',
                  borderRadius: 3,
                  width: `${progress}%`,
                }} />
                </View>
              </View>

              {/* Expand/Collapse Button - Matching WeekDayCard */}
              <ChevronButton
                direction={expanded ? 'up' : 'down'}
                size="small"
                color={colors.text.primary}
                onPress={onToggleExpand}
                style={{
                  alignSelf: 'flex-start',
                  width: 44,
                  height: 44,
                  marginLeft: -spacing.md, // Counteract container padding to align to left edge
                }}
              />
            </View>
          </View>

          {/* Emotion Badges - Collapsed: bottom right corner, Expanded: auto-layout */}
          {!expanded ? (
            // Collapsed state - original position
            <View style={{ 
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 59, 
              gap: 6, 
              alignItems: 'center',
              justifyContent: 'flex-end',
              zIndex: 10,
            }}>
              {displayedEmotions.map((emotion, index) => {
                const style = getEmotionStyle(emotion, index);
                return (
                  <View
                    key={index}
                    style={{
                      backgroundColor: style.backgroundColor,
                      borderWidth: 0.3,
                      borderColor: style.borderColor,
                      borderRadius: 5,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      height: 21,
                      width: 59,
                      alignItems: 'center',
                      justifyContent: 'center',
                      // Drop shadow matching Figma specs
                      shadowColor: '#7C7C7C',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.75,
                      shadowRadius: 0,
                      elevation: 4,
                    }}
                  >
                    <Text 
                      style={{
                        fontSize: 10,
                        fontWeight: '400',
                        color: style.textColor,
                        textAlign: 'center',
                      }}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {emotion}
                    </Text>
                  </View>
                );
              })}
              
              {/* Plus badge for remaining emotions */}
              {emotions.length > 2 && (
                <View style={{
                  position: 'absolute',
                  right: -7,
                  bottom: 0,
                  backgroundColor: '#FCB9B2',
                  borderWidth: 0.5,
                  borderColor: '#BC4749',
                  borderRadius: 8,
                  width: 13,
                  height: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: 8,
                    fontWeight: '400',
                    color: '#BC4749',
                  }}>
                    +{emotions.length - 2}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Expanded Content */}
        {expanded && (
          <View style={{ gap: 20, marginTop: 15 }}>
            {/* Emotion Badges - Expanded state with auto-layout */}
            {emotions.length > 0 && (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}>
                {emotions.slice(0, 5).map((emotion, index) => {
                  const style = getEmotionStyle(emotion, index);
                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: style.backgroundColor,
                        borderWidth: 0.3,
                        borderColor: style.borderColor,
                        borderRadius: 5,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        height: 21,
                        minWidth: 59,
                        alignItems: 'center',
                        justifyContent: 'center',
                        // Drop shadow matching Figma specs
                        shadowColor: '#7C7C7C',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.75,
                        shadowRadius: 0,
                        elevation: 4,
                      }}
                    >
                      <Text 
                        style={{
                          fontSize: 10,
                          fontWeight: '400',
                          color: style.textColor,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                      >
                        {emotion}
                      </Text>
                    </View>
                  );
                })}
                {emotions.length > 5 && (
                  <View style={{
                    backgroundColor: '#FCB9B2',
                    borderWidth: 0.5,
                    borderColor: '#BC4749',
                    borderRadius: 8,
                    width: 24,
                    height: 21,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{
                      fontSize: 8,
                      fontWeight: '400',
                      color: '#BC4749',
                    }}>
                      +{emotions.length - 5}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* View Complete Goal Button */}
            <Pressable
              onPress={() => {
                if (goal?.id) {
                  router.push(`/goal-details?id=${goal.id}`);
                } else if (onToggleExpand) {
                  onToggleExpand();
                }
              }}
              style={{
                alignItems: 'center',
                alignSelf: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                fontSize: 12,
                color: '#364958',
                fontFamily: 'Helvetica',
                fontWeight: 'bold',
                opacity: 0.5,
              }}>
                View Full Goal
              </Text>
            </Pressable>

            {/* Milestones Section */}
            {goalMilestones.length > 0 ? (
              goalMilestones.map((milestone: Milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  goal={goal}
                  onMilestoneComplete={handleMilestoneCompletion}
                  onMilestoneDelete={onMilestoneDelete}
                />
              ))
            ) : (
              <View style={{
                backgroundColor: '#F5EBE0',
                borderWidth: 0.5,
                borderColor: '#A3B18A',
                borderRadius: 15,
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 91,
                // Drop shadow for empty milestone card (3 layers)
                shadowColor: '#7C7C7C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.75,
                shadowRadius: 0,
                elevation: 4,
              }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#364958',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  No milestones yet
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#364958',
                  textAlign: 'center',
                }}>
                  Break your goal down into milestones.
                </Text>
              </View>
            )}
          </View>
        )}
          </View>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Delete State - Full Card Transform */}
      <Animated.View style={[
        styles.goalDeleteState,
        {
          opacity: translateX.interpolate({
            inputRange: [-80, -40, 0],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
          }),
        }
      ]}>
        <View style={styles.goalDeleteButton}>
          <IconButton
            variant="delete"
            iconName="delete"
            onPress={handleDelete}
          />
        </View>
      </Animated.View>
      
      {/* Goal Completion Modal */}
      <GoalCompletionModal
        visible={showGoalCompletionModal}
        goal={goal || null}
        onClose={() => setShowGoalCompletionModal(false)}
        onCompleteGoal={handleGoalCompletion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Goal card container for swipe functionality
  goalCardContainer: {
    position: 'relative',
    overflow: 'visible',
    marginBottom: 8,
  },
  goalCardWrapper: {
    zIndex: 1,
  },
  goalDeleteState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2CCC3',
    borderRadius: 20,
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
  goalDeleteButton: {
    width: '100%',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 20,
    paddingRight: 25,
  },
  // Empty state styles
  emptyContainer: {
    backgroundColor: colors.background.secondary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    minHeight: 124,
    ...shadows.card,
  },
  emptyCompletedContainer: {
    backgroundColor: colors.trophy.bg,
    borderColor: colors.trophy.border,
  },
  emptyInnerCard: {
    backgroundColor: colors.background.primary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    ...shadows.card,
  },
  emptyCompletedInnerCard: {
    backgroundColor: '#F0E68C',
    borderColor: colors.trophy.border,
  },
  emptyTitle: {
    ...typography.emptyTitle,
    marginBottom: emptyStateSpacing.titleMarginBottom,
  },
  emptyCompletedTitle: {
    color: colors.text.tertiary,
  },
  emptyDescription: {
    ...typography.emptyDescription,
  },
  emptyCompletedDescription: {
    color: colors.text.tertiary,
    opacity: 0.8,
  },
  // Active state styles
  container: {
    backgroundColor: colors.background.secondary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  completedContainer: {
    backgroundColor: colors.trophy.bg,
    borderColor: colors.trophy.border,
  },
  containerPressed: {
    shadowOffset: { width: 0, height: 2 },
  },
  innerCard: {
    backgroundColor: colors.background.primary,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  completedInnerCard: {
    backgroundColor: '#F0E68C',
    borderColor: colors.trophy.border,
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




  // Goal selection card (optimized design)
  goalSelectionCard: {
    backgroundColor: '#e9edc9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#364958',
    flex: 1,
    marginRight: 12,
  },
  goalSelectionButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  goalSelectionButtonText: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 32,
  },
  goalSelectionDescription: {
    fontSize: 14,
    fontWeight: '300',
    color: '#364958',
    textAlign: 'center',
  },
  // Empty selection card styles (centered layout)
  goalSelectionEmptyCard: {
    backgroundColor: '#e9edc9',
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 91,
  },
  goalSelectionEmptyTitle: {
    ...typography.emptyTitle,
    marginBottom: emptyStateSpacing.titleMarginBottom,
  },
  goalSelectionEmptyDescription: {
    ...typography.emptyDescription,
  },
  plusIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 16,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  plusVertical: {
    position: 'absolute',
    width: 3,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  xIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  xLine1: {
    position: 'absolute',
    width: 16,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  xLine2: {
    position: 'absolute',
    width: 16,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ rotate: '-45deg' }],
  },
  milestoneDeleteState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2CCC3',
    borderRadius: 15,
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
  milestoneDeleteButton: {
    width: '100%',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 15,
    paddingRight: 25,
  },
});
