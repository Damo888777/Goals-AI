import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTasks, useGoals, useMilestones } from '../src/hooks/useDatabase';
import { usePomodoroSessions } from '../src/hooks/usePomodoroSessions';
import { Button } from '../src/components/Button';
import { BackChevronButton } from '../src/components/ChevronButton';
import { spacing } from '../src/constants/spacing';
import { FocusHistorySection } from './focus-history-section';
import type { Task } from '../src/types';

export default function CompletedTaskDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, deleteTask, updateTask } = useTasks();
  const { goals } = useGoals();
  const { milestones } = useMilestones();

  const [task, setTask] = useState<Task | null>(null);
  const [goalName, setGoalName] = useState<string | null>(null);
  const [milestoneName, setMilestoneName] = useState<string | null>(null);

  // Real pomodoro session data from database
  const { sessions: focusSessions, timeStats } = usePomodoroSessions(task?.id || '');

  useEffect(() => {
    if (id) {
      const foundTask = tasks.find(t => t.id === id);
      if (foundTask) {
        setTask(foundTask);
      }
    }
  }, [id, tasks]);

  // Fetch goal and milestone names when task changes
  useEffect(() => {
    if (task?.goalId) {
      const goal = goals.find(g => g.id === task.goalId);
      setGoalName(goal?.title || null);
    } else {
      setGoalName(null);
    }
    
    if (task?.milestoneId) {
      const milestone = milestones.find(m => m.id === task.milestoneId);
      setMilestoneName(milestone?.title || null);
    } else {
      setMilestoneName(null);
    }
  }, [task?.goalId, task?.milestoneId, goals, milestones]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\s/g, '.');
  };

  const getProjectText = () => {
    if (milestoneName) return milestoneName;
    if (goalName) return goalName;
    if (task?.goalId || task?.milestoneId) return 'Linked to project';
    return 'No project linked';
  };

  const handleRestore = () => {
    if (!task || !task.id) return;

    Alert.alert(
      'Restore Task',
      'Are you sure you want to restore this task? It will be moved back to your active tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await updateTask(task.id, {
                isComplete: false,
                updatedAt: new Date()
              });
              Alert.alert('Success', 'Task restored successfully!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error restoring task:', error);
              Alert.alert('Error', 'Failed to restore task');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!task || !task.id) return;

    Alert.alert(
      'Delete Task Permanently',
      'Are you sure you want to permanently delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              Alert.alert('Success', 'Task deleted permanently!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };


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
            <Text style={styles.headerTitle}>Completed Task</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Review your completed task details and focus history.
          </Text>
        </View>

        {/* Task Title Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Task Title</Text>
          <View style={styles.titleDisplay}>
            <Text style={styles.titleText}>{task?.title || 'Loading...'}</Text>
          </View>
        </View>

        {/* Project Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Project</Text>
          <View style={styles.projectDisplay}>
            <Text style={styles.projectText}>{task ? getProjectText() : 'Loading...'}</Text>
          </View>
        </View>

        {/* Completion Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Completion Details</Text>
          <View style={styles.completionDisplay}>
            <Text style={styles.completionText}>
              Completed: {task?.updatedAt ? formatDate(task.updatedAt.toISOString()) : 'Loading...'}
            </Text>
            {task?.scheduledDate && (
              <Text style={styles.completionText}>
                Originally scheduled: {formatDate(task.scheduledDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Notes Section */}
        {task?.notes && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesDisplay}>
              <Text style={styles.notesText}>{task.notes}</Text>
            </View>
          </View>
        )}

        {/* Focus History Section */}
        {task && (
          <FocusHistorySection 
            taskId={task.id}
            focusSessions={focusSessions}
            timeStats={timeStats}
            onStartPomodoro={() => {
              // Completed tasks shouldn't start new pomodoro sessions
              Alert.alert('Info', 'This task is completed. Start a pomodoro session on an active task instead.');
            }}
            isCompletedTask={true}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {task && (
            <>
              <Button
                title="Restore Task"
                variant="save"
                onPress={handleRestore}
                style={styles.restoreButton}
              />
              <Button
                title="Delete"
                variant="delete"
                onPress={handleDelete}
                style={styles.deleteButton}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAE2B7', // Same as CompletedTaskCard background
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 36,
  },
  scrollContent: {
    paddingBottom: 50,
  },

  // Header styles
  headerContainer: {
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#364958',
    lineHeight: 20,
    fontWeight: '300',
  },

  // Section styles
  sectionContainer: {
    marginBottom: 43,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
  },

  // Display containers (non-editable)
  titleDisplay: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#926C15',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  titleText: {
    fontSize: 15,
    color: '#364958',
    fontWeight: '700',
  },
  projectDisplay: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#926C15',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  projectText: {
    fontSize: 15,
    color: '#364958',
    fontWeight: '400',
  },
  completionDisplay: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#926C15',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    gap: 8,
  },
  completionText: {
    fontSize: 15,
    color: '#364958',
    fontWeight: '400',
  },
  notesDisplay: {
    backgroundColor: '#F5EBE0',
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#926C15',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    minHeight: 80,
  },
  notesText: {
    fontSize: 15,
    color: '#364958',
    lineHeight: 20,
    fontWeight: '300',
  },

  // Action button styles
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
    marginBottom: 24,
  },
  restoreButton: {
    backgroundColor: '#a3b18a',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#bc4b51',
    width: 134,
  },
});