import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { images } from '../../src/constants/images';
import { GoalCard } from '../../src/components/GoalCard';
import { FAB } from '../../src/components/FAB';
import { typography } from '../../src/constants/typography';
import type { Goal } from '../../src/types';

export default function GoalsTab() {
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<Goal[]>([]);

  const handleFABPress = () => {
    console.log('FAB pressed - Open Spark AI');
  };

  const handleTrophyPress = () => {
    console.log('Navigate to Trophy screen');
  };

  const handleVisionPress = () => {
    router.push('/vision-board');
  };

  const handleGoalPress = (goal: Goal) => {
    console.log('Goal pressed:', goal.id);
  };

  const handleAddGoal = () => {
    console.log('Add new goal');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 63,
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
            style={styles.buttonContainer}
          >
            <View style={styles.trophyButton}>
              <Image 
                source={{ uri: images.icons.trophy }} 
                style={styles.trophyIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.buttonLabel}>
              Trophy
            </Text>
          </Pressable>

          {/* Vision Button */}
          <Pressable 
            onPress={handleVisionPress}
            style={styles.buttonContainer}
          >
            <View style={styles.visionButton}>
              <View style={styles.visionButtonInner}>
                <Image 
                  source={{ uri: images.visionPlaceholder }} 
                  style={styles.visionImage}
                  resizeMode="cover"
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
          {goals.length > 0 ? (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onPress={() => handleGoalPress(goal)}
              />
            ))
          ) : (
            <GoalCard isEmpty={true} onPress={handleAddGoal} />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB onPress={handleFABPress} />
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
  visionButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  visionImage: {
    width: '100%',
    height: '100%',
    // Figma image settings: object-50%-50% object-cover
    resizeMode: 'cover',
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
