import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import TrophyCard, { Achievement } from '../src/components/TrophyCard';
import { Image } from 'expo-image';
import { typography } from '../src/constants/typography';


export default function TrophyScreen() {
  const insets = useSafeAreaInsets();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const toggleAchievement = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAchievements(prev => 
      prev.map(achievement => 
        achievement.id === id 
          ? { ...achievement, isExpanded: !achievement.isExpanded }
          : achievement
      )
    );
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Pressable onPress={handleBackPress} style={styles.backButton}>
              <View style={styles.backChevronIcon}>
                <View style={styles.backChevronLine1} />
                <View style={styles.backChevronLine2} />
              </View>
            </Pressable>
            <Text style={styles.headerTitle}>My Victories</Text>
          </View>
          <Text style={styles.headerDescription}>
            A gallery of your achievements. Proof of your dedication and progress.
          </Text>
        </View>

        {/* Trophy Cards Container */}
        <View style={styles.trophyCardsContainer}>
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <TrophyCard 
                key={achievement.id} 
                achievement={achievement} 
                onToggle={toggleAchievement} 
              />
            ))
          ) : (
            /* Empty State */
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateInner}>
                <Text style={styles.emptyStateTitle}>No achieved goals yet</Text>
                <Text style={styles.emptyStateDescription}>
                  It's time to tackle your goals. Complete tasks and milestones.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAE2B7', // Figma background color
  },
  headerSection: {
    gap: 8,
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 8px gap between back button and title
  },
  backButton: {
    width: 30, // 30x30px touchable area
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronIcon: {
    width: 20, // 20x20px icon size
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backChevronLine1: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1, // Rounded line caps
    transform: [{ rotate: '-45deg' }, { translateX: 2 }, { translateY: -2 }],
  },
  backChevronLine2: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1, // Rounded line caps
    transform: [{ rotate: '45deg' }, { translateX: 2 }, { translateY: 2 }],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
    textAlign: 'left',
    flex: 1,
  },
  headerDescription: {
    fontSize: 15,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: '300',
    textAlign: 'left',
    lineHeight: 20,
  },
  trophyCardsContainer: {
    width: '100%',
    gap: 16,
  },
  emptyStateCard: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    padding: 20,
    minHeight: 124,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyStateInner: {
    backgroundColor: '#EAE2B7',
    borderWidth: 0.5,
    borderColor: '#B69121',
    borderRadius: 20,
    padding: 15,
    flex: 1,
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateDescription: {
    ...typography.small,
    textAlign: 'center',
    marginTop: 8,
  },
});
