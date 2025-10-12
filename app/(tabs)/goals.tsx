import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { images } from '../../src/constants/images';
import { GoalCard } from '../../src/components/GoalCard';
import { FAB } from '../../src/components/FAB';
import { typography } from '../../src/constants/typography';
import { useAuth, useGoals, useMilestones } from '../../src/hooks/useDatabase';
import type { Goal } from '../../src/types';


export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [isTrophyPressed, setIsTrophyPressed] = useState(false);
  const [isVisionPressed, setIsVisionPressed] = useState(false);
  
  // Database hooks
  const { user, isLoading: authLoading, signInAnonymously } = useAuth();
  const { goals, isLoading: goalsLoading, createGoal, completeGoal } = useGoals();
  const { milestones: allMilestones } = useMilestones();

  // Auto sign-in anonymously if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      signInAnonymously();
    }
  }, [authLoading, user, signInAnonymously]);


  const handleTrophyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/trophy');
  };

  const handleVisionPress = () => {
    console.log('🔵 Vision Board button clicked - starting navigation');
    console.log('🔵 Current route:', router);
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('🔵 Haptics triggered successfully');
      
      console.log('🔵 Attempting to navigate to ../vision-board');
      router.push('../vision-board');
      console.log('🔵 Navigation command executed');
    } catch (error) {
      console.error('🔴 Error in handleVisionPress:', error);
    }
  };

  const handleGoalPress = (goal: Goal) => {
    console.log('Goal pressed:', goal.id);
  };

  const handleToggleExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const handleMilestoneComplete = (milestoneId: string) => {
    // TODO: Implement milestone completion with database hooks
    console.log('Complete milestone:', milestoneId);
  };

  const handleAddGoal = () => {
    router.push('/manual-goal');
  };

  // Remove loading state - show UI immediately with empty state if needed
  // if (authLoading || goalsLoading) {
  //   return (
  //     <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
  //       <ActivityIndicator size="large" color="#A3B18A" />
  //       <Text style={[typography.body, { marginTop: 16, color: '#588157' }]}>
  //         Loading your goals...
  //       </Text>
  //     </View>
  //   );
  // }

  // Transform database goals to UI format with milestones
  const transformedGoals: Goal[] = goals.map(dbGoal => {
    const goalMilestones = allMilestones.filter(milestone => milestone.goalId === dbGoal.id);
    const completedMilestones = goalMilestones.filter(m => m.isComplete).length;
    const progress = goalMilestones.length > 0 ? (completedMilestones / goalMilestones.length) * 100 : 0;
    
    return {
      id: dbGoal.id,
      title: dbGoal.title,
      description: dbGoal.notes || '',
      emotions: dbGoal.feelingsArray || [],
      visionImages: dbGoal.visionImageUrl ? [dbGoal.visionImageUrl] : [],
      milestones: goalMilestones.map(milestone => ({
        id: milestone.id,
        title: milestone.title,
        targetDate: milestone.targetDate,
        isComplete: milestone.isComplete,
        goalId: milestone.goalId,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt
      })),
      progress,
      isCompleted: dbGoal.isCompleted,
      createdAt: dbGoal.createdAt,
      updatedAt: dbGoal.updatedAt,
    };
  });

  return (
    <View style={styles.container}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 36,
          paddingBottom: 150,
          gap: 43,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Goals Hub Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Goals Hub
          </Text>
          <Text style={styles.headerDescription}>
            This is where your dreams take shape. Start with your vision, then build the plan to make it real.
          </Text>
        </View>

        {/* Trophy and Vision Buttons */}
        <View style={styles.buttonsRow}>
          {/* Trophy Button */}
          <Pressable 
            onPress={handleTrophyPress}
            onPressIn={() => setIsTrophyPressed(true)}
            onPressOut={() => setIsTrophyPressed(false)}
            style={styles.buttonContainer}
          >
            <View style={[styles.trophyButton, isTrophyPressed && styles.trophyButtonPressed]}>
              <Image 
                source={{ uri: images.icons.trophy }} 
                style={styles.trophyIcon}
                contentFit="contain"
              />
            </View>
            <Text style={styles.buttonLabel}>
              Trophy
            </Text>
          </Pressable>

          {/* Vision Button */}
          <Pressable 
            onPress={() => {
              console.log('🔵 Vision Button Pressable onPress triggered');
              handleVisionPress();
            }}
            onPressIn={() => {
              console.log('🔵 Vision Button pressed in');
              setIsVisionPressed(true);
            }}
            onPressOut={() => {
              console.log('🔵 Vision Button pressed out');
              setIsVisionPressed(false);
            }}
            style={styles.buttonContainer}
          >
            <View style={[styles.visionButton, isVisionPressed && styles.visionButtonPressed]}>
              <View style={styles.visionButtonInner}>
                <Image 
                  source={{ uri: images.visionPlaceholder }} 
                  style={styles.visionImage}
                  contentFit="cover"
                />
              </View>
            </View>
            <Text style={styles.buttonLabel}>
              Vision
            </Text>
          </Pressable>
        </View>

        {/* My Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              My Goals
            </Text>
            <Text style={styles.headerDescription}>
              Here you find all your current goals.
            </Text>
          </View>

          {/* Goals List */}
          {transformedGoals.length > 0 ? (
            transformedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                variant="active-with-vision"
                milestones={goal.milestones}
                expanded={expandedGoals.has(goal.id)}
                onPress={() => handleGoalPress(goal)}
                onToggleExpand={() => handleToggleExpand(goal.id)}
                onMilestoneComplete={handleMilestoneComplete}
              />
            ))
          ) : (
            <GoalCard variant="empty" />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDC9',
  },
  header: {
    gap: 8,
  },
  headerTitle: {
    ...typography.title,
  },
  headerDescription: {
    ...typography.body,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 25,
  },
  buttonContainer: {
    flex: 1,
    gap: 8,
  },
  trophyButton: {
    backgroundColor: '#EAE2B7',
    borderWidth: 0.5,
    borderColor: '#926C15',
    borderRadius: 20,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    // Drop shadow for iOS - Figma specs: #7C7C7C, 75% opacity, Y4, X0, no blur
    shadowColor: '#7C7C7C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    // Drop shadow for Android
    elevation: 4,
  },
  trophyButtonPressed: {
    shadowOffset: { width: 0, height: 2 },
  },
  trophyIcon: {
    width: 30,
    height: 30,
  },
  visionButton: {
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    height: 75,
    // Drop shadow for iOS - Figma specs: #7C7C7C, 75% opacity, Y4, X0, no blur
    shadowColor: '#7C7C7C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    // Drop shadow for Android
    elevation: 4,
  },
  visionButtonPressed: {
    shadowOffset: { width: 0, height: 2 },
  },
  visionButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  visionImage: {
    width: '100%',
    height: '100%',
    // Center the image content
    alignSelf: 'center',
  },
  buttonLabel: {
    ...typography.body,
    textAlign: 'center',
  },
  goalsSection: {
    gap: 15,
  },
});
