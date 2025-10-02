import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface Achievement {
  id: string;
  title: string;
  achievedDate: string;
  isExpanded?: boolean;
  totalFocusTime: string;
  milestonesCompleted: number;
  tasksCompleted: number;
  journeyDuration: string;
  yourTakeaways: string;
  challengeConquered: string;
  futureImprovement: string;
}

interface TrophyCardProps {
  achievement: Achievement;
  onToggle: (id: string) => void;
}

export default function TrophyCard({ achievement, onToggle }: TrophyCardProps) {
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(achievement.id);
  };

  return (
    <View style={styles.trophyCard}>
      <Pressable 
        onPress={handleToggle}
        style={styles.trophyCardContent}
      >
        <View style={styles.innerContainer}>
          <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={styles.goalTitle}>{achievement.title}</Text>
            <Text style={styles.achievedText}>
              <Text style={styles.achievedLabel}>Achieved:</Text>
              <Text style={styles.achievedDate}> {achievement.achievedDate}</Text>
            </Text>
          </View>
          <View style={styles.chevronButton}>
            <View style={[styles.chevronIcon, achievement.isExpanded && styles.chevronIconRotated]}>
              <View style={styles.chevronLine1} />
              <View style={styles.chevronLine2} />
            </View>
          </View>
        </View>
        
          
          {/* Expanded Content */}
          {achievement.isExpanded && (
            <View style={styles.expandedContent}>
            {/* Vision Board Placeholder */}
            <View style={styles.visionBoardPlaceholder} />
            
            {/* Statistics */}
            <View style={styles.statisticsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Total Focus Time</Text>
                <Text style={styles.statValue}>{achievement.totalFocusTime}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Milestones Completed</Text>
                <Text style={styles.statValue}>{achievement.milestonesCompleted} Milestones</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Tasks Completed</Text>
                <Text style={styles.statValue}>{achievement.tasksCompleted} Tasks</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Journey Duration</Text>
                <Text style={styles.statValue}>{achievement.journeyDuration}</Text>
              </View>
              
              <View style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.diamondIcon}>◊</Text>
                  <Text style={styles.reflectionTitle}>Your Takeaways</Text>
                </View>
                <Text style={styles.reflectionValue}>{achievement.yourTakeaways}</Text>
              </View>
              
              <View style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.diamondIcon}>◊</Text>
                  <Text style={styles.reflectionTitle}>Challenge Conquered</Text>
                </View>
                <Text style={styles.reflectionValue}>{achievement.challengeConquered}</Text>
              </View>
              
              <View style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.diamondIcon}>◊</Text>
                  <Text style={styles.reflectionTitle}>Future Improvement</Text>
                </View>
                <Text style={styles.reflectionValue}>{achievement.futureImprovement}</Text>
              </View>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  trophyCard: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    minHeight: 124,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  trophyCardContent: {
    flex: 1,
  },
  innerContainer: {
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
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  titleContent: {
    flex: 1,
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
    marginBottom: 4,
  },
  achievedText: {
    fontSize: 14,
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  achievedLabel: {
    fontWeight: '300',
  },
  achievedDate: {
    fontWeight: 'bold',
  },
  chevronButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  chevronLine1: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 2 }],
  },
  chevronLine2: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#364958',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }, { translateX: 2 }, { translateY: 2 }],
  },
  expandedContent: {
    gap: 16,
    marginTop: 16,
    width: '100%',
  },
  visionBoardPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#E9EDC9',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
  },
  statisticsSection: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 15,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: '300',
  },
  statValue: {
    fontSize: 15,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  reflectionItem: {
    gap: 8,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diamondIcon: {
    fontSize: 12,
    color: '#364958',
  },
  reflectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  reflectionValue: {
    fontSize: 14,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: '300',
  },
});
