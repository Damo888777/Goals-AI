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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    if (!dateString) return t('completedTask.noDate');
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
    if (task?.goalId || task?.milestoneId) return t('completedTask.project.linkedToProject');
    return t('completedTask.project.noProjectLinked');
  };

  const handleRestore = () => {
    if (!task || !task.id) return;

    Alert.alert(
      t('completedTask.alerts.restoreTitle'),
      t('completedTask.alerts.restoreMessage'),
      [
        { text: t('completedTask.alerts.cancel'), style: 'cancel' },
        {
          text: t('completedTask.alerts.restore'),
          onPress: async () => {
            try {
              await updateTask(task.id, {
                isComplete: false,
                updatedAt: new Date()
              });
              Alert.alert(t('completedTask.alerts.success'), t('completedTask.alerts.taskRestoredSuccess'), [
                { text: t('completedTask.alerts.ok'), onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error restoring task:', error);
              Alert.alert(t('completedTask.alerts.error'), t('completedTask.alerts.restoreFailed'));
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!task || !task.id) return;

    Alert.alert(
      t('completedTask.alerts.deleteTitle'),
      t('completedTask.alerts.deleteMessage'),
      [
        { text: t('completedTask.alerts.cancel'), style: 'cancel' },
        {
          text: t('completedTask.alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              Alert.alert(t('completedTask.alerts.success'), t('completedTask.alerts.taskDeletedSuccess'), [
                { text: t('completedTask.alerts.ok'), onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert(t('completedTask.alerts.error'), t('completedTask.alerts.deleteFailed'));
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
            <Text style={styles.headerTitle}>{t('completedTask.header.title')}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('completedTask.header.subtitle')}
          </Text>
        </View>

        {/* Task Title Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('completedTask.sections.taskTitle')}</Text>
          <View style={styles.titleDisplay}>
            <Text style={styles.titleText}>{task?.title || t('completedTask.loading')}</Text>
          </View>
        </View>

        {/* Project Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('completedTask.sections.project')}</Text>
          <View style={styles.projectDisplay}>
            <Text style={styles.projectText}>{task ? getProjectText() : t('completedTask.loading')}</Text>
          </View>
        </View>

        {/* Completion Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('completedTask.sections.completionDetails')}</Text>
          <View style={styles.completionDisplay}>
            <Text style={styles.completionText}>
              {t('completedTask.completion.completed')} {task?.updatedAt ? formatDate(task.updatedAt.toISOString()) : t('completedTask.loading')}
            </Text>
            {task?.scheduledDate && (
              <Text style={styles.completionText}>
                {t('completedTask.completion.originallyScheduled')} {formatDate(task.scheduledDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Notes Section */}
        {task?.notes && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('completedTask.sections.notes')}</Text>
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
              Alert.alert(t('completedTask.alerts.info'), t('completedTask.alerts.pomodoroInfo'));
            }}
            isCompletedTask={true}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {task && (
            <>
              <Button
                title={t('completedTask.buttons.restoreTask')}
                variant="save"
                onPress={handleRestore}
                style={styles.restoreButton}
              />
              <Button
                title={t('completedTask.buttons.delete')}
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