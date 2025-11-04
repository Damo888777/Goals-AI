import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GoalCard } from '../src/components/GoalCard';
import * as Haptics from 'expo-haptics';
import { useTasks, useGoals, useMilestones } from '../src/hooks/useDatabase';
import type { Task, Goal, Milestone } from '../src/types';
import { Image } from 'expo-image';
import { images } from '../src/constants/images';
import { Button } from '../src/components/Button';
import { BackChevronButton } from '../src/components/ChevronButton';
import { spacing } from '../src/constants/spacing';
import { FocusHistorySection } from './focus-history-section';
import { usePomodoroSessions } from '../src/hooks/usePomodoroSessions';
import { formatDate as formatDateUtil } from '../src/utils/dateFormatter';

// Date Picker Component
interface DatePickerProps {
  selectedDate?: Date | null;
  onDateSelect: (date: Date | null) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateSelect }) => {
  const { t } = useTranslation();
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate || new Date());

  const handleDatePickerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(selectedDate || new Date());
    setIsDateModalVisible(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateSelect(tempDate);
    setIsDateModalVisible(false);
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(selectedDate || new Date());
    setIsDateModalVisible(false);
  };


  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('taskDetails.sections.dueDate')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('taskDetails.sections.dueDateSubtitle')}
      </Text>
      <TouchableOpacity 
        style={styles.datePickerContainer}
        onPress={handleDatePickerPress}
      >
        <View style={styles.datePickerContent}>
          <Text style={styles.datePickerText}>
            {selectedDate ? formatDateUtil(selectedDate, t) : t('taskDetails.datePicker.selectDate')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Date Modal */}
      <Modal
        visible={isDateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('taskDetails.datePicker.modalTitle')}</Text>
            </View>
            
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#364958"
                locale={t('localeCode')}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.modalCancelText}>{t('taskDetails.datePicker.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.modalConfirmText}>{t('taskDetails.datePicker.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Eat the Frog Section Component
interface EatTheFrogSectionProps {
  isSelected: boolean;
  onToggle: () => void;
}

// Pomodoro Session Tracking Section
interface PomodoroSectionProps {
  completedSessions: number;
  totalSessions: number;
  onStartPomodoro: () => void;
}

export default function TaskDetailsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  const { tasks, updateTask, deleteTask } = useTasks();

  const [task, setTask] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFrog, setIsFrog] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [attachmentType, setAttachmentType] = useState<'goal' | 'milestone'>('goal');
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false);

  // Real pomodoro session data from database
  const { sessions: focusSessions, timeStats } = usePomodoroSessions(task?.id || '');

  useEffect(() => {
    if (id) {
      const foundTask = tasks.find(t => t.id === id);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setNotes(foundTask.notes || '');
        setIsFrog(foundTask.isFrog || false);
        setSelectedGoalId(foundTask.goalId || '');
        setSelectedMilestoneId(foundTask.milestoneId || '');
        // Don't set a date for someday tasks (tasks without scheduled date)
        if (foundTask.scheduledDate) {
          setScheduledDate(new Date(foundTask.scheduledDate));
        } else {
          setScheduledDate(null); // Keep it null for someday tasks
        }
        setAttachmentType(foundTask.milestoneId ? 'milestone' : 'goal');
      } else {
        console.log('Task not found with id:', id);
      }
    }
  }, [id, tasks]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
  
  // Filter out completed goals and milestones for dropdowns
  const availableGoals = goals.filter(g => !g.isCompleted);
  const availableMilestones = selectedGoalId 
    ? milestones.filter(m => m.goalId === selectedGoalId && !m.isComplete) 
    : milestones.filter(m => !m.isComplete);

  const handleGoalSelect = (goalId: string | undefined) => {
    setSelectedGoalId(goalId || '');
  };

  const handleMilestoneSelect = (milestoneId: string | undefined) => {
    setSelectedMilestoneId(milestoneId || '');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('taskDetails.alerts.error'), t('taskDetails.alerts.pleaseEnterTitle'));
      return;
    }

    if (!task) {
      Alert.alert(t('taskDetails.alerts.error'), t('taskDetails.alerts.taskNotFound'));
      return;
    }

    try {
      // Enforce mutual exclusivity: task can only be attached to EITHER goal OR milestone
      const taskUpdate = {
        title: title.trim(),
        notes: notes.trim(),
        isFrog: isFrog,
        goalId: selectedMilestoneId ? undefined : (selectedGoalId || undefined),
        milestoneId: selectedMilestoneId || undefined,
        scheduledDate: scheduledDate ? scheduledDate.toISOString() : undefined,
      };

      await updateTask(task.id, taskUpdate);
      
      // Force widget sync after task update
      const { widgetSyncService } = await import('../src/services/widgetSyncService');
      await widgetSyncService.forceSyncToWidget();
      console.log('🔄 [Task Details] Forced widget sync after task update');
      
      router.back();
    } catch (error) {
      Alert.alert(t('taskDetails.alerts.error'), t('taskDetails.alerts.failedToUpdateTask'));
    }
  };

  const handleDelete = () => {
    if (!task) {
      Alert.alert(t('taskDetails.alerts.error'), t('taskDetails.alerts.taskNotFound'));
      return;
    }

    Alert.alert(
      t('taskDetails.alerts.deleteTaskTitle'),
      t('taskDetails.alerts.deleteTaskMessage'),
      [
        { text: t('taskDetails.alerts.cancel'), style: 'cancel' },
        {
          text: t('taskDetails.alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              router.back();
            } catch (error) {
              Alert.alert(t('taskDetails.alerts.error'), t('taskDetails.alerts.failedToDeleteTask'));
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };


  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <BackChevronButton
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>{t('taskDetails.header.title')}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('taskDetails.header.subtitle')}
          </Text>
        </View>

        {/* Task Title Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('taskDetails.sections.taskTitle')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('taskDetails.sections.taskTitleSubtitle')}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('taskDetails.placeholders.taskTitle')}
            placeholderTextColor="rgba(54,73,88,0.5)"
            style={styles.textInput}
          />
        </View>

        {/* Eat the Frog Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('taskDetails.sections.eatTheFrog')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('taskDetails.sections.eatTheFrogSubtitle')}
          </Text>
          <EatTheFrogSection 
            isSelected={isFrog} 
            onToggle={async () => {
              if (!isFrog) {
                // Check if there's already an active frog task
                const existingFrogTask = tasks.find(t => t.isFrog && !t.isComplete && t.id !== task?.id);
                if (existingFrogTask) {
                  Alert.alert(
                    t('taskDetails.alerts.replaceFrogTaskTitle'),
                    t('taskDetails.alerts.replaceFrogTaskMessage', { title: existingFrogTask.title }),
                    [
                      {
                        text: t('taskDetails.alerts.cancel'),
                        style: 'cancel',
                        onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      },
                      {
                        text: t('taskDetails.alerts.replace'),
                        onPress: () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsFrog(true);
                        }
                      }
                    ]
                  );
                } else {
                  setIsFrog(true);
                }
              } else {
                setIsFrog(false);
              }
            }} 
          />
        </View>

        {/* Goal/Milestone Selection */}
        <GoalMilestoneSelection 
          selectedGoalId={selectedGoalId}
          selectedMilestoneId={selectedMilestoneId}
          onGoalSelect={handleGoalSelect}
          onMilestoneSelect={handleMilestoneSelect}
        />

        {/* Date Picker */}
        <DatePicker 
          selectedDate={scheduledDate}
          onDateSelect={setScheduledDate}
        />

        {/* Focus History Section */}
        {task && (
          <FocusHistorySection 
            taskId={task.id}
            focusSessions={focusSessions}
            timeStats={timeStats}
            onStartPomodoro={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/pomodoro?taskTitle=${encodeURIComponent(task?.title || 'Task')}&taskId=${task?.id || ''}`);
            }}
          />
        )}

        {/* Notes Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {t('taskDetails.sections.notesDetails')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t('taskDetails.sections.notesSubtitle')}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('taskDetails.placeholders.notesDetails')}
            placeholderTextColor="rgba(54,73,88,0.5)"
            style={[styles.textInput, styles.textInputMultiline]}
            multiline
            scrollEnabled={false}
          />
        </View>

        {/* Action Buttons */}
        {task && (
          <View style={styles.actionButtonsContainer}>
            <Button
              title={t('taskDetails.buttons.deleteTask')}
              variant="delete"
              onPress={handleDelete}
              style={styles.cancelButton}
            />
            <Button
              title={t('taskDetails.buttons.saveChanges')}
              variant="save"
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: '#e9edc9',
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
    chevronContainer: {
      width: 20,
      height: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    chevron: {
      width: 12,
      height: 12,
      borderLeftWidth: 2,
      borderBottomWidth: 2,
      borderColor: '#364958',
      transform: [{ rotate: '45deg' }],
      borderRadius: 1,
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
    sectionSubtitle: {
      fontSize: 15,
      color: '#364958',
      lineHeight: 20,
      marginBottom: 15,
      fontWeight: '300',
    },

    // Input styles
    textInput: {
      backgroundColor: '#f5ebe0',
      borderRadius: 15,
      padding: 16,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      fontSize: 15,
      color: '#364958',
      minHeight: 44,
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    textInputMultiline: {
      minHeight: 80,
      paddingTop: 16,
      paddingBottom: 16,
      lineHeight: 20,
    },

    // Eat the Frog styles
    eatFrogContainer: {
      backgroundColor: '#f5ebe0',
      borderRadius: 15,
      padding: 15,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    eatFrogContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    eatFrogTextContainer: {
      flex: 1,
      gap: 8,
    },
    eatFrogTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#364958',
    },
    eatFrogDescription: {
      fontSize: 15,
      fontWeight: '300',
      color: '#364958',
      lineHeight: 20,
    },
    frogButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      padding: 7,
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    frogButtonSelected: {
      backgroundColor: '#a3b18a',
      borderColor: '#9b9b9b',
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    frogButtonUnselected: {
      backgroundColor: '#d9d9d9',
      borderColor: '#9b9b9b',
    },
    frogIcon: {
      width: 20,
      height: 20,
      opacity: 1,
    },

    // Focus History styles (matching pomodoro.tsx aesthetics)
    focusHistoryCard: {
      backgroundColor: '#f5ebe0',
      borderRadius: 20,
      padding: 20,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    focusHistoryCardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#364958',
      marginBottom: 8,
    },
    focusHistoryDescription: {
      fontSize: 15,
      fontWeight: '300',
      color: '#364958',
      lineHeight: 20,
      marginBottom: 20,
    },
    sessionStats: {
      marginBottom: 20,
    },
    sessionStatsText: {
      fontSize: 15,
      color: '#364958',
      marginBottom: 4,
      fontWeight: '400',
    },
    sessionHistorySection: {
      marginTop: 8,
    },
    sessionHistoryTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#364958',
      marginBottom: 12,
    },
    sessionHistoryList: {
      gap: 8,
    },
    sessionHistoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    sessionBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#364958',
    },
    sessionHistoryText: {
      fontSize: 14,
      color: '#364958',
      flex: 1,
      fontWeight: '400',
    },
    // Empty state styles
    emptyStateContainer: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#364958',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateDescription: {
      fontSize: 15,
      fontWeight: '300',
      color: '#364958',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    startPomodoroButton: {
      backgroundColor: '#e9edc9',
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      borderRadius: 15,
      paddingHorizontal: 24,
      paddingVertical: 12,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    startPomodoroButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#364958',
    },
    // Session indicators (matching pomodoro.tsx)
    sessionIndicatorSection: {
      marginBottom: 20,
    },
    sessionIndicatorLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#364958',
      marginBottom: 8,
    },
    sessionIndicators: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 8,
    },
    sessionIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#e0e0e0',
    },
    completedIndicator: {
      backgroundColor: '#bc4b51',
    },

    // Action button styles
    actionButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 40,
      marginBottom: 24,
    },
    actionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
      minHeight: 40,
      borderWidth: 1,
      borderColor: '#9b9b9b',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    cancelButton: {
      backgroundColor: '#bc4b51',
      width: 134,
    },
    saveButton: {
      backgroundColor: '#a3b18a',
      flex: 1,
    },
    actionButtonText: {
      color: '#f5ebe0',
      fontSize: 15,
      fontWeight: '700',
    },

    // Date picker styles
    datePickerContainer: {
      backgroundColor: '#f5ebe0',
      borderRadius: 15,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      padding: 16,
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    datePickerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    datePickerText: {
      fontSize: 15,
      color: '#364958',
      fontWeight: '400',
    },

    // Modal styles (matching manual-task.tsx)
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      backgroundColor: '#f5ebe0',
      borderRadius: 20,
      width: '100%',
      maxWidth: 350,
      alignSelf: 'center',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 8,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
    },
    modalHeader: {
      padding: 20,
      paddingBottom: 10,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#364958',
    },
    datePickerWrapper: {
      backgroundColor: '#e9edc9',
      marginHorizontal: 15,
      borderRadius: 15,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 20,
      gap: 15,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
      backgroundColor: '#bc4b51',
    },
    modalConfirmButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
      backgroundColor: '#a3b18a',
    },
    modalCancelText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalConfirmText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },

    // Goal attachment styles
    goalAttachmentContainer: {
      backgroundColor: '#f5ebe0',
      borderRadius: 20,
      padding: 16,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    goalAttachmentContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    goalAttachmentText: {
      fontSize: 15,
      color: '#364958',
      fontWeight: '400',
      flex: 1,
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
      height: 1.5,
      backgroundColor: '#364958',
      borderRadius: 1,
      transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 1 }],
    },
    chevronLine2: {
      position: 'absolute',
      width: 8,
      height: 1.5,
      backgroundColor: '#364958',
      borderRadius: 1,
      transform: [{ rotate: '-45deg' }, { translateX: 2 }, { translateY: 1 }],
    },
    dropdownContent: {
      marginTop: 8,
    },
    dropdownSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#364958',
      marginTop: 16,
      marginBottom: 12,
    },
    milestoneCard: {
      backgroundColor: '#e9edc9',
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: '#a3b18a',
      marginBottom: 8,
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    },
    milestoneCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    milestoneCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#364958',
      flex: 1,
      marginRight: 12,
    },
    milestoneAddButton: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#a3b18a',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#7c7c7c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
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
  });

// Helper Components
const EatTheFrogSection: React.FC<{ isSelected: boolean; onToggle: () => void }> = ({ 
  isSelected, 
  onToggle 
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.eatFrogContainer}>
      <View style={styles.eatFrogContent}>
        <View style={styles.eatFrogTextContainer}>
          <Text style={styles.eatFrogTitle}>
            {t('taskDetails.sections.eatTheFrog')}
          </Text>
          <Text style={styles.eatFrogDescription}>
            {t('taskDetails.sections.eatTheFrogDescription')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle();
          }}
          style={[
            styles.frogButton,
            isSelected ? styles.frogButtonSelected : styles.frogButtonUnselected
          ]}
        >
          <Image 
            source={require('../assets/frog.png')}
            style={styles.frogIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface GoalMilestoneSelectionProps {
  selectedGoalId: string | undefined;
  selectedMilestoneId: string | undefined;
  onGoalSelect: (goalId: string | undefined) => void;
  onMilestoneSelect: (milestoneId: string | undefined) => void;
}

const GoalMilestoneSelection: React.FC<GoalMilestoneSelectionProps> = ({ 
  selectedGoalId, 
  selectedMilestoneId,
  onGoalSelect, 
  onMilestoneSelect 
}) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  
  // Filter out completed goals and milestones
  const availableGoals = goals.filter(g => !g.isCompleted);
  const availableMilestones = milestones.filter(m => !m.isComplete);

  const handleDropdownPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleGoalSelect = (goalId: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGoalSelect(goalId);
    // Only clear milestone when ADDING a goal (not when removing)
    if (goalId) {
      onMilestoneSelect(undefined);
    }
    setIsDropdownOpen(false);
  };

  const handleMilestoneSelect = (milestoneId: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMilestoneSelect(milestoneId);
    // Only clear goal when ADDING a milestone (not when removing)
    if (milestoneId) {
      onGoalSelect(undefined);
    }
    setIsDropdownOpen(false);
  };

  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  const selectedMilestone = milestones.find(milestone => milestone.id === selectedMilestoneId);
  
  const getDisplayText = () => {
    if (selectedGoal) return selectedGoal.title;
    if (selectedMilestone) return selectedMilestone.title;
    return t('taskDetails.goalMilestoneSelection.selectGoalMilestone');
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('taskDetails.sections.goalMilestone')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('taskDetails.sections.goalMilestoneSubtitle')}
      </Text>
      
      {/* Dropdown Container */}
      <View style={styles.goalAttachmentContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity 
          style={styles.goalAttachmentContent}
          onPress={handleDropdownPress}
        >
          <Text style={styles.goalAttachmentText}>
            {getDisplayText()}
          </Text>
          <View style={[styles.chevronIcon, isDropdownOpen && styles.chevronIconRotated]}>
            <View style={styles.chevronLine1} />
            <View style={styles.chevronLine2} />
          </View>
        </TouchableOpacity>

        {/* Dropdown Content */}
        {isDropdownOpen && (
          <View style={styles.dropdownContent}>
            {/* Goal Section */}
            <Text style={styles.dropdownSectionTitle}>{t('taskDetails.goalMilestoneSelection.goalSection')}</Text>
            {availableGoals.length > 0 ? (
              availableGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={{
                    id: goal.id,
                    title: goal.title,
                    description: goal.notes || '',
                    emotions: goal.feelings || [],
                    visionImages: goal.visionImageUrl ? [goal.visionImageUrl] : [],
                    milestones: [],
                    progress: 0,
                    isCompleted: goal.isCompleted,
                    createdAt: goal.createdAt,
                    updatedAt: goal.updatedAt
                  }}
                  variant="selection-compact"
                  isAttached={selectedGoalId === goal.id}
                  onAttach={() => handleGoalSelect(goal.id)}
                  onDetach={() => handleGoalSelect(undefined)}
                />
              ))
            ) : (
              <GoalCard variant="selection-empty" />
            )}
            
            {/* Milestones Section */}
            <Text style={styles.dropdownSectionTitle}>{t('taskDetails.goalMilestoneSelection.milestonesSection')}</Text>
            {availableMilestones.length > 0 ? (
              availableMilestones.map((milestone) => (
                <TouchableOpacity
                  key={milestone.id}
                  style={styles.milestoneCard}
                  onPress={() => handleMilestoneSelect(selectedMilestoneId === milestone.id ? undefined : milestone.id)}
                >
                  <View style={styles.milestoneCardContent}>
                    <Text style={styles.milestoneCardTitle}>{milestone.title}</Text>
                    <TouchableOpacity
                      style={[
                        styles.milestoneAddButton,
                        {
                          backgroundColor: selectedMilestoneId === milestone.id ? '#BC4B51' : '#A3B18A',
                        }
                      ]}
                      onPress={() => handleMilestoneSelect(selectedMilestoneId === milestone.id ? undefined : milestone.id)}
                    >
                      {selectedMilestoneId === milestone.id ? (
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
                </TouchableOpacity>
              ))
            ) : (
              <GoalCard variant="selection-empty" />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

