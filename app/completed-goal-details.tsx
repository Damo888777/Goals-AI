import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGoals, useMilestones, useTasks } from '../src/hooks/useDatabase';
import { BackChevronButton } from '../src/components/ChevronButton';
import { typography } from '../src/constants/typography';
import { colors } from '../src/constants/colors';
import { spacing } from '../src/constants/spacing';
import type { Goal, Milestone, Task } from '../src/types/index';

export default function CompletedGoalDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  const { tasks } = useTasks();
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalMilestones, setGoalMilestones] = useState<Milestone[]>([]);
  const [goalTasks, setGoalTasks] = useState<Task[]>([]);
  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');

  useEffect(() => {
    if (id && goals.length > 0) {
      const foundGoal = goals.find(g => g.id === id);
      if (foundGoal) {
        setGoal(foundGoal as unknown as Goal);
        
        // Get goal milestones
        const goalMilestonesList = milestones.filter(m => m.goalId === id);
        setGoalMilestones(goalMilestonesList);
        
        // Get goal tasks (both direct goal tasks and milestone tasks)
        const milestoneIds = goalMilestonesList.map(m => m.id);
        const relatedTasks = tasks.filter(t => 
          t.goalId === id || (t.milestoneId && milestoneIds.includes(t.milestoneId))
        );
        setGoalTasks(relatedTasks);
        
        // Load reflection answers from goal data if available
        if (foundGoal.reflectionAnswers) {
          const answers = foundGoal.reflectionAnswers;
          setReflection1(answers.takeaways || '');
          setReflection2(answers.challengeConquered || '');
          setReflection3(answers.futureImprovement || '');
        }
      }
    }
  }, [id, goals, milestones, tasks]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\s/g, '.');
  };

  const calculateDuration = () => {
    if (!goal) return 'N/A';
    const created = goal.createdAt instanceof Date ? goal.createdAt : new Date(goal.createdAt);
    const completed = goal.updatedAt instanceof Date ? goal.updatedAt : new Date(goal.updatedAt);
    const diffTime = Math.abs(completed.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      return remainingDays > 0 ? `${months}m ${remainingDays}d` : `${months} months`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const months = Math.floor(remainingDays / 30);
      return `${years}y ${months}m`;
    }
  };

  const calculatePomodoroSessions = () => {
    // Calculate total focus sessions from all related tasks
    let totalSessions = 0;
    goalTasks.forEach(task => {
      if (task.focusSessions) {
        totalSessions += task.focusSessions.length;
      }
    });
    return totalSessions;
  };

  const completedTasks = goalTasks.filter(task => task.isComplete);
  const completedMilestones = goalMilestones.filter(milestone => milestone.isComplete);

  if (!goal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 100 }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <BackChevronButton
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>
              Goal Victory
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Celebrate your achievement and reflect on your journey.
          </Text>
        </View>

        {/* Goal Title */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Goal Title</Text>
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyText}>{goal.title}</Text>
          </View>
        </View>

        {/* Notes */}
        {goal.notes && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{goal.notes}</Text>
            </View>
          </View>
        )}

        {/* Vision Image */}
        {goal.visionImageUrl && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Vision</Text>
            <View style={styles.visionContainer}>
              <Image 
                source={{ uri: goal.visionImageUrl }}
                style={styles.visionImage}
                contentFit="cover"
              />
            </View>
          </View>
        )}

        {/* Statistics Container */}
        <View style={styles.statisticsContainer}>
          <Text style={styles.sectionTitle}>Achievement Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedMilestones.length}</Text>
              <Text style={styles.statLabel}>Milestones Achieved</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{calculatePomodoroSessions()}</Text>
              <Text style={styles.statLabel}>Focus Sessions</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{calculateDuration()}</Text>
              <Text style={styles.statLabel}>Total Duration</Text>
            </View>
          </View>
        </View>

        {/* Achieved Milestones */}
        {completedMilestones.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Achieved Milestones</Text>
            <View style={styles.milestonesContainer}>
              {completedMilestones.map((milestone, index) => (
                <View key={milestone.id} style={styles.milestoneItem}>
                  <View style={styles.milestoneIcon}>
                    <Ionicons name="flag" size={16} color="#364958" />
                  </View>
                  <Text style={styles.milestoneText}>{milestone.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Completion Details */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Completion Details</Text>
          <View style={styles.completionDetails}>
            <View style={styles.completionRow}>
              <Ionicons name="calendar-outline" size={16} color="#364958" />
              <Text style={styles.completionText}>
                Completed: {formatDate(goal.updatedAt instanceof Date ? goal.updatedAt : new Date(goal.updatedAt))}
              </Text>
            </View>
            <View style={styles.completionRow}>
              <Ionicons name="time-outline" size={16} color="#364958" />
              <Text style={styles.completionText}>
                Journey Duration: {calculateDuration()}
              </Text>
            </View>
          </View>
        </View>

        {/* Reflection Questions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Reflection Questions</Text>
          <Text style={styles.sectionSubtitle}>
            Take a moment to reflect on your journey and learnings.
          </Text>
          
          {/* Question 1 */}
          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Text style={styles.diamondIcon}>◊</Text>
              <Text style={styles.questionTitle}>What are your key takeaways?</Text>
            </View>
            <TextInput
              value={reflection1}
              onChangeText={setReflection1}
              placeholder="Share the most important lessons you learned..."
              placeholderTextColor="rgba(54,73,88,0.5)"
              style={styles.reflectionInput}
              multiline
              scrollEnabled={false}
            />
          </View>

          {/* Question 2 */}
          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Text style={styles.diamondIcon}>◊</Text>
              <Text style={styles.questionTitle}>What challenge did you conquer?</Text>
            </View>
            <TextInput
              value={reflection2}
              onChangeText={setReflection2}
              placeholder="Describe the biggest obstacle you overcame..."
              placeholderTextColor="rgba(54,73,88,0.5)"
              style={styles.reflectionInput}
              multiline
              scrollEnabled={false}
            />
          </View>

          {/* Question 3 */}
          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Text style={styles.diamondIcon}>◊</Text>
              <Text style={styles.questionTitle}>How will you improve in the future?</Text>
            </View>
            <TextInput
              value={reflection3}
              onChangeText={setReflection3}
              placeholder="What would you do differently next time..."
              placeholderTextColor="rgba(54,73,88,0.5)"
              style={styles.reflectionInput}
              multiline
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Save Reflections Button */}
        <Pressable
          style={styles.saveButton}
          onPress={async () => {
            // TODO: Save reflection answers to goal
            console.log('Save reflections:', { reflection1, reflection2, reflection3 });
          }}
        >
          <Text style={styles.saveButtonText}>Save Reflections</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDC9',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 36,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#364958',
  },

  // Header styles
  headerContainer: {
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '300',
    color: '#364958',
    lineHeight: 20,
  },

  // Section styles
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#364958',
    lineHeight: 20,
    marginBottom: 15,
    fontWeight: '300',
  },

  // Read-only content
  readOnlyContainer: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  readOnlyText: {
    fontSize: 15,
    color: '#364958',
    lineHeight: 20,
  },

  // Vision image
  visionContainer: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 4,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  visionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },

  // Statistics
  statisticsContainer: {
    backgroundColor: '#F5EBE0',
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    marginBottom: 32,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#EAE2B7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '47%',
    borderWidth: 0.5,
    borderColor: '#B69121',
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#364958',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Milestones
  milestonesContainer: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  milestoneIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#EAE2B7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneText: {
    fontSize: 14,
    color: '#364958',
    flex: 1,
    fontWeight: '500',
  },

  // Completion details
  completionDetails: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#364958',
    fontWeight: '500',
  },

  // Reflection questions
  questionContainer: {
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  diamondIcon: {
    fontSize: 12,
    color: '#364958',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#364958',
  },
  reflectionInput: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    fontSize: 14,
    color: '#364958',
    minHeight: 80,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    textAlignVertical: 'top',
  },

  // Save button
  saveButton: {
    backgroundColor: '#A3B18A',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  saveButtonText: {
    color: '#F5EBE0',
    fontSize: 16,
    fontWeight: '700',
  },
});