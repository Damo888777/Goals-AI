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

// Date Picker Component
interface DatePickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateSelect }) => {
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

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}.${day}.${year}`;
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        Due Date
      </Text>
      <Text style={styles.sectionSubtitle}>
        Set when you want to complete this.
      </Text>
      <TouchableOpacity 
        style={styles.datePickerContainer}
        onPress={handleDatePickerPress}
      >
        <View style={styles.datePickerContent}>
          <Text style={styles.datePickerText}>
            {selectedDate ? formatDate(selectedDate) : 'Select date'}
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
              <Text style={styles.modalTitle}>Select Date</Text>
            </View>
            
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#364958"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
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
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  const { tasks, updateTask, deleteTask } = useTasks();

  const [task, setTask] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
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
    if (id && tasks.length > 0) {
      const foundTask = tasks.find(t => t.id === id);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setNotes(foundTask.notes || '');
        setIsFrog(foundTask.isFrog || false);
        setSelectedGoalId(foundTask.goalId || '');
        setSelectedMilestoneId(foundTask.milestoneId || '');
        setScheduledDate(foundTask.scheduledDate ? new Date(foundTask.scheduledDate) : new Date());
        setAttachmentType(foundTask.milestoneId ? 'milestone' : 'goal');
      }
    }
  }, [id, tasks]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
  const availableMilestones = selectedGoalId ? milestones.filter(m => m.goalId === selectedGoalId) : milestones;

  const handleGoalSelect = (goalId: string | undefined) => {
    setSelectedGoalId(goalId || '');
  };

  const handleMilestoneSelect = (milestoneId: string | undefined) => {
    setSelectedMilestoneId(milestoneId || '');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!task) {
      Alert.alert('Error', 'Task not found');
      return;
    }

    try {
      await updateTask(task.id, {
        title: title.trim(),
        notes: notes.trim(),
        isFrog: isFrog,
        goalId: selectedGoalId || undefined,
        milestoneId: selectedMilestoneId || undefined,
        scheduledDate: scheduledDate.toISOString(),
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = () => {
    if (!task) {
      Alert.alert('Error', 'Task not found');
      return;
    }

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.headerTitle}>Task Details</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Edit your task information and track your focus sessions.
          </Text>
        </View>

        {/* Task Title Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Task Title</Text>
          <Text style={styles.sectionSubtitle}>
            Give your task a clear and descriptive name.
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor="rgba(54,73,88,0.5)"
            style={styles.textInput}
          />
        </View>

        {/* Eat the Frog Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Eat the Frog</Text>
          <Text style={styles.sectionSubtitle}>
            Mark this task as your most important task of the day.
          </Text>
          <EatTheFrogSection 
            isSelected={isFrog} 
            onToggle={() => setIsFrog(!isFrog)} 
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
              router.push('/pomodoro');
            }}
          />
        )}

        {/* Notes Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Notes & Details
          </Text>
          <Text style={styles.sectionSubtitle}>
            Add any extra thoughts, links, or steps you want to remember.
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Type here your notes and details..."
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
              title="Delete Task"
              variant="delete"
              onPress={handleDelete}
              style={styles.cancelButton}
            />
            <Button
              title="Save Changes"
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
      paddingBottom: 150,
      paddingTop: 20,
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
  return (
    <View style={styles.eatFrogContainer}>
      <View style={styles.eatFrogContent}>
        <View style={styles.eatFrogTextContainer}>
          <Text style={styles.eatFrogTitle}>
            Eat the frog
          </Text>
          <Text style={styles.eatFrogDescription}>
            Choose this task if completing it will make your day a success.
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
            source={{ uri: 'https://s3-alpha-sig.figma.com/img/077f/e118/305b3d191f10f5d5855d5f074942d0d5?Expires=1760313600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=MNj3ZK~tjl3RoKhbiLiUJX46IrmmSdSYBjovP3IP8WLxvj8jX9~CP9c95APsjf27TBc7mpqTjsrZI6VyovnQcFaQ2CqD2wP9ToNmM0rOYWllfHPR2VZy6OmvvCT-WsrgrIRrmYSIBEhOp43d8mRlZQEOmEu8sKm-7t2h0qhFXKDgMreHt9DF6jtbt1H~oJxzPqj2Qh8je2ImAQA-d6vVMrTLr1lm4va2QytH13yFdgeni5TqvaMZNDYnYhrn901gQyNgyJfUSg0A4zxHkNs-DQSA2TKlc2kmERUzwl38iaRT1FfEERIk7da3z9QOPNKyQSpLdLM4gbeDhvXV90OAtQ__' }}
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { goals } = useGoals();
  const { milestones } = useMilestones();

  const handleDropdownPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleGoalSelect = (goalId: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGoalSelect(goalId);
    onMilestoneSelect(undefined); // Clear milestone when goal changes
    setIsDropdownOpen(false);
  };

  const handleMilestoneSelect = (milestoneId: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMilestoneSelect(milestoneId);
    onGoalSelect(undefined); // Clear goal when milestone is selected
    setIsDropdownOpen(false);
  };

  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  const selectedMilestone = milestones.find(milestone => milestone.id === selectedMilestoneId);
  
  const getDisplayText = () => {
    if (selectedGoal) return selectedGoal.title;
    if (selectedMilestone) return selectedMilestone.title;
    return 'Select your main or sub goal';
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        Goal / Milestone
      </Text>
      <Text style={styles.sectionSubtitle}>
        Attach either a goal or milestone to your task.
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
            <Text style={styles.dropdownSectionTitle}>Goal</Text>
            {goals.length > 0 ? (
              goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={{
                    id: goal.id,
                    title: goal.title,
                    description: goal.notes || '',
                    emotions: goal.feelingsArray || [],
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
            <Text style={styles.dropdownSectionTitle}>Milestones</Text>
            {milestones.length > 0 ? (
              milestones.map((milestone) => (
                <TouchableOpacity
                  key={milestone.id}
                  style={styles.milestoneCard}
                  onPress={() => handleMilestoneSelect(milestone.id)}
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
                      onPress={() => handleMilestoneSelect(milestone.id)}
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

