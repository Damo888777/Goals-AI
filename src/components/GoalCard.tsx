import { View, Text, Pressable, Image, Animated, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { Goal, Milestone } from '../types';
import { typography } from '../constants/typography';
import { useState, useRef } from 'react';

interface GoalCardProps {
  goal?: Goal & { creationSource?: 'spark' | 'manual' };
  isEmpty?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  onToggleExpand?: () => void;
  onMilestoneComplete?: (milestoneId: string) => void;
  onMilestoneDelete?: (milestoneId: string) => void;
}

export function GoalCard({ goal, isEmpty = false, expanded = false, onPress, onToggleExpand, onMilestoneComplete, onMilestoneDelete }: GoalCardProps) {
  if (isEmpty) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: '#F5EBE0',
          borderWidth: 0.5,
          borderColor: '#A3B18A',
          borderRadius: 20,
          padding: 20,
          minHeight: 124,
          // Drop shadow matching Figma specs
          shadowColor: '#7C7C7C',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 4,
        }}
      >
        <View style={{
          backgroundColor: '#E9EDC9',
          borderWidth: 0.5,
          borderColor: '#A3B18A',
          borderRadius: 20,
          padding: 15,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          // Inner card shadow
          shadowColor: '#7C7C7C',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 4,
        }}>
          <Text style={{
            ...typography.cardTitle,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            No goals yet
          </Text>
          <Text style={{
            ...typography.cardDescription,
            textAlign: 'center',
          }}>
            Create your first goal and start your journey
          </Text>
        </View>
      </Pressable>
    );
  }

  const progress = goal?.progress || 0;
  const emotions = goal?.emotions || [];
  const displayedEmotions = emotions.slice(0, 2);
  const remainingCount = emotions.length - 2;
  const milestones = goal?.milestones || [];
  const hasVisionImage = goal?.visionImages && goal.visionImages.length > 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\s/g, '.');
  };

  // Emotion color mapping based on SparkAIOutput component
  const getEmotionStyle = (emotion: string, index: number) => {
    const emotionStyles: { [key: string]: { backgroundColor: string; borderColor: string; textColor: string } } = {
      'confident': { backgroundColor: '#f7e1d7', borderColor: '#a4133c', textColor: '#a4133c' },
      'grateful': { backgroundColor: '#a1c181', borderColor: '#081c15', textColor: '#081c15' },
      'proud': { backgroundColor: '#cdb4db', borderColor: '#3d405b', textColor: '#3d405b' },
      'happy': { backgroundColor: '#bde0fe', borderColor: '#023047', textColor: '#023047' },
      'excited': { backgroundColor: '#fcb9b2', borderColor: '#b23a48', textColor: '#b23a48' },
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
    <View
      style={{
        backgroundColor: '#F5EBE0',
        borderWidth: 0.5,
        borderColor: '#A3B18A',
        borderRadius: 20,
        padding: 20,
        gap: 10,
        // Drop shadow matching Figma specs
        shadowColor: '#7C7C7C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
      }}
    >
      {/* Goal Card Container */}
      <View style={{
        backgroundColor: '#E9EDC9',
        borderWidth: 0.5,
        borderColor: '#A3B18A',
        borderRadius: 20,
        padding: 15,
        // Inner card shadow
        shadowColor: '#7C7C7C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
      }}>
        {/* Vision Image Placeholder */}
        {hasVisionImage && (
          <View style={{
            height: 102,
            backgroundColor: '#E3E3E3',
            borderWidth: 0.5,
            borderColor: '#A3B18A',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            marginBottom: 15,
            opacity: 0.2,
            marginHorizontal: -15,
            marginTop: -15,
          }} />
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
              }} numberOfLines={2}>
                {goal?.title || 'Placeholder Title'}
              </Text>
              {goal?.creationSource === 'spark' && (
                <View style={{
                  backgroundColor: '#FFE066',
                  borderWidth: 0.5,
                  borderColor: '#F4A261',
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: 8,
                    fontWeight: '600',
                    color: '#E76F51',
                  }}>
                    ✨ AI
                  </Text>
                </View>
              )}
            </View>

              {/* Progress Bar */}
              <View style={{ height: 17, justifyContent: 'center' }}>
              <View style={{
                height: 6,
                backgroundColor: 'rgba(120,120,120,0.2)',
                borderRadius: 3,
                marginHorizontal: 16,
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
              <Pressable
                onPress={onToggleExpand}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ rotate: expanded ? '180deg' : '0deg' }],
                }}>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRightWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderColor: '#364958',
                    transform: [{ rotate: '45deg' }],
                    marginTop: -2,
                  }} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Emotion Badges - Always visible, bottom right corner */}
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
            {(expanded ? emotions.slice(0, 5) : displayedEmotions).map((emotion, index) => {
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
            
            {!expanded && emotions.length > 2 && (
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
        </View>

        {/* Expanded Content */}
        {expanded && (
          <View style={{ gap: 20, marginTop: 15 }}>            
            {/* View Complete Goal Button */}
            <Pressable
              onPress={onPress}
              style={{
                borderWidth: 0.5,
                borderColor: '#344E41',
                borderRadius: 3,
                paddingVertical: 3,
                width: 105,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 10,
                color: '#344E41',
                fontFamily: 'Helvetica',
              }}>
                View complete goal
              </Text>
            </Pressable>

            {/* Milestones Section */}
            {milestones.length > 0 ? (
              milestones.map((milestone) => {
                const translateX = useRef(new Animated.Value(0)).current;
                const isDeleting = useRef(false);

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

                return (
                  <View key={milestone.id} style={{ position: 'relative', overflow: 'visible', marginBottom: 8 }}>
                    <PanGestureHandler
                      onGestureEvent={handleGestureEvent}
                      onHandlerStateChange={handleStateChange}
                      activeOffsetX={[-10, 10]}
                    >
                      <Animated.View style={{ transform: [{ translateX }], zIndex: 1 }}>
                        <View
                          style={{
                            backgroundColor: '#E9EDC9',
                            borderWidth: 0.5,
                            borderColor: '#A3B18A',
                            borderRadius: 15,
                            padding: 15,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 20,
                            minHeight: 91,
                            // Drop shadow for milestone cards (3 layers)
                            shadowColor: '#7C7C7C',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.75,
                            shadowRadius: 0,
                            elevation: 4,
                          }}
                        >
                          {/* Milestone Content */}
                          <View style={{ flex: 1, gap: 8 }}>
                            <Text style={{
                              fontSize: 15,
                              fontWeight: 'bold',
                              color: '#364958',
                              fontFamily: 'Helvetica',
                            }}>
                              {milestone.title}
                            </Text>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '300',
                              color: '#364958',
                              fontFamily: 'Helvetica',
                            }}>
                              {goal?.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 12, color: '#364958' }}>📅</Text>
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
                          <Pressable
                            onPress={() => onMilestoneComplete?.(milestone.id)}
                            style={{
                              backgroundColor: milestone.isComplete ? '#A3B18A' : '#A3B18A',
                              borderWidth: 1,
                              borderColor: '#7C7C7C',
                              borderRadius: 10,
                              width: 40,
                              height: 40,
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
                            <Text style={{
                              fontSize: 16,
                              color: '#F5EBE0',
                            }}>
                              ✓
                            </Text>
                          </Pressable>
                        </View>
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
                        <Icon name="delete" size={32} color="#B23A48" />
                      </Pressable>
                    </Animated.View>
                  </View>
                );
              })
            ) : (
              <View style={{
                backgroundColor: '#E9EDC9',
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
    </View>
  );
}

const styles = StyleSheet.create({
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
