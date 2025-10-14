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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGoals, useMilestones } from '../src/hooks/useDatabase';
import type { Goal, Milestone } from '../src/types';
import { GoalCard } from '../src/components/GoalCard';
import { Button } from '../src/components/Button';
import { BackChevronButton } from '../src/components/ChevronButton';
import { spacing } from '../src/constants/spacing';

const styles = StyleSheet.create({
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
  goalAttachmentContainer: {
    backgroundColor: '#f5ebe0',
    borderRadius: 15,
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
  },
  goalAttachmentText: {
    fontSize: 15,
    color: '#364958',
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
  dropdownItem: {
    backgroundColor: '#f5ebe0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: '#a3b18a',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#364958',
  },
  datePickerContainer: {
    backgroundColor: '#f5ebe0',
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  datePickerContent: {
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  datePickerText: {
    fontSize: 15,
    color: '#364958',
    textAlign: 'left',
  },
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
  modalCancelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
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
  deleteButton: {
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
    textAlign: 'center',
  },
});

export default function MilestoneDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals } = useGoals();
  const { milestones, updateMilestone, deleteMilestone } = useMilestones();
  
  const [milestone, setMilestone] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (id && milestones.length > 0) {
      const foundMilestone = milestones.find(m => m.id === id);
      if (foundMilestone) {
        setMilestone(foundMilestone);
        setTitle(foundMilestone.title);
        setNotes('');
        setSelectedGoalId(foundMilestone.goalId || '');
        setTargetDate(foundMilestone.targetDate ? new Date(foundMilestone.targetDate) : undefined);
      }
    }
  }, [id, milestones]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const handleSave = async () => {
    if (!milestone || !title.trim()) {
      Alert.alert('Error', 'Please enter a milestone title');
      return;
    }

    if (!selectedGoalId) {
      Alert.alert('Error', 'Please select a goal for this milestone');
      return;
    }

    try {
      await updateMilestone(milestone.id, {
        title: title.trim(),
        goalId: selectedGoalId,
        targetDate: targetDate?.toISOString(),
      });
      
      Alert.alert(
        'Success',
        'Milestone updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating milestone:', error);
      Alert.alert('Error', 'Failed to update milestone. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Milestone',
      'Are you sure you want to delete this milestone? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilestone(milestone.id);
              Alert.alert(
                'Success',
                'Milestone deleted successfully!',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Error deleting milestone:', error);
              Alert.alert('Error', 'Failed to delete milestone. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDatePickerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(targetDate || new Date());
    setIsDateModalVisible(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const handleDateConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargetDate(tempDate);
    setIsDateModalVisible(false);
  };

  const handleDateCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(targetDate || new Date());
    setIsDateModalVisible(false);
  };

  const handleDropdownPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleGoalSelect = (goalId: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoalId(goalId || '');
    setIsDropdownOpen(false);
  };

  const handleCancel = () => {
    router.back();
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
              onPress={handleCancel}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>
              Edit Milestone
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Review and adjust the details of your milestone.
          </Text>
        </View>

        {/* Milestone Title */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Milestone Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Type here your milestone title..."
            placeholderTextColor="rgba(54,73,88,0.5)"
            style={styles.textInput}
          />
        </View>

        {/* Goal Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            My goal
          </Text>
          <Text style={styles.sectionSubtitle}>
            Attach this milestone to your goal.
          </Text>
          
          {/* Dropdown Container */}
          <View style={styles.goalAttachmentContainer}>
            {/* Dropdown Button */}
            <TouchableOpacity 
              style={styles.goalAttachmentContent}
              onPress={handleDropdownPress}
            >
              <Text style={styles.goalAttachmentText}>
                {selectedGoal ? selectedGoal.title : 'Select your goal'}
              </Text>
              <View style={[styles.chevronIcon, isDropdownOpen && styles.chevronIconRotated]}>
                <View style={styles.chevronLine1} />
                <View style={styles.chevronLine2} />
              </View>
            </TouchableOpacity>

            {/* Dropdown Content */}
            {isDropdownOpen && (
              <View style={styles.dropdownContent}>
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
                  <GoalCard
                    variant="selection-empty"
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Date Picker */}
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
                {targetDate ? formatDate(targetDate) : 'Select date'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Date Modal */}
          <Modal
            visible={isDateModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleDateCancel}
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
                    onPress={handleDateCancel}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalConfirmButton}
                    onPress={handleDateConfirm}
                  >
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

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
        <View style={styles.actionButtonsContainer}>
          <Button
            title="Delete"
            variant="delete"
            onPress={handleDelete}
            style={styles.deleteButton}
          />
          <Button
            title="Save Changes"
            variant="save"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
