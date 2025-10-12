import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTasks, useGoals, useMilestones } from '../src/hooks/useDatabase';

// Selection Card Component
interface SelectionCardProps {
  selectedType: 'task' | 'goal' | 'milestone';
  onTypeChange: (type: 'task' | 'goal' | 'milestone') => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ selectedType, onTypeChange }) => {
  const options: { type: 'task' | 'goal' | 'milestone'; label: string }[] = [
    { type: 'task', label: 'Task' },
    { type: 'goal', label: 'Goal' },
    { type: 'milestone', label: 'Milestone' },
  ];

  return (
    <View style={styles.selectionCard}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.type}
          style={[styles.selectionOption, index === options.length - 1 && { marginBottom: 0 }]}
          onPress={() => onTypeChange(option.type)}
        >
          <View style={[
            styles.radioButton,
            selectedType === option.type ? styles.radioButtonSelected : styles.radioButtonUnselected
          ]} />
          <Text style={styles.selectionLabel}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

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

// Goal/Milestone Selection Component
const GoalMilestoneSelection: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [availableItems] = useState<string[]>([]); // Empty for now

  const handleDropdownPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleItemSelect = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    setIsDropdownOpen(false);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        Goal / Milestone
      </Text>
      <Text style={styles.sectionSubtitle}>
        Attach either a goal or a milestone to your task.
      </Text>
      
      {/* Dropdown Container */}
      <View style={styles.goalAttachmentContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity 
          style={styles.goalAttachmentContent}
          onPress={handleDropdownPress}
        >
          <Text style={styles.goalAttachmentText}>
            {selectedItem || 'Select a main or milestone'}
          </Text>
          <View style={[styles.chevronIcon, isDropdownOpen && styles.chevronIconRotated]}>
            <View style={styles.chevronLine1} />
            <View style={styles.chevronLine2} />
          </View>
        </TouchableOpacity>

        {/* Dropdown Content */}
        {isDropdownOpen && (
          <View style={styles.dropdownContent}>
            {availableItems.length > 0 ? (
              availableItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleItemSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateDropdownItem}>
                <Text style={styles.emptyStateTitle}>
                  No goals or milestones yet
                </Text>
                <Text style={styles.emptyStateDescription}>
                  Create your first goal and start your journey
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};


// Notes Section Component
interface NotesSectionProps {
  notes: string;
  onNotesChange: (text: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, onNotesChange }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        Notes & Details
      </Text>
      <Text style={styles.sectionSubtitle}>
        Add any extra thoughts, links, or steps you want to remember.
      </Text>
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Type here your notes and details..."
        placeholderTextColor="rgba(54,73,88,0.5)"
        style={[styles.textInput, styles.textInputMultiline]}
        multiline
        scrollEnabled={false}
        textAlignVertical="top"
      />
    </View>
  );
};

// Main Manual Task Screen Component
export default function ManualTaskScreen() {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<'task' | 'goal' | 'milestone'>('task');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Database hooks
  const { createTask } = useTasks();
  const { createGoal } = useGoals();
  const { createMilestone } = useMilestones();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setIsLoading(true);
    
    try {
      if (selectedType === 'task') {
        await createTask({
          title: title.trim(),
          notes: notes.trim() || undefined,
          scheduledDate: selectedDate,
          creationSource: 'manual'
        });
      } else if (selectedType === 'goal') {
        await createGoal({
          title: title.trim(),
          notes: notes.trim() || undefined,
        });
      } else if (selectedType === 'milestone') {
        // For now, skip milestone creation as it requires a goalId
        Alert.alert('Info', 'Milestone creation requires selecting a goal first. This feature will be added soon.');
        setIsLoading(false);
        return;
      }

      // Show success confirmation
      Alert.alert(
        'Success',
        `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} created successfully!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', `Failed to create ${selectedType}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.backButton}
            >
              <View style={styles.chevronContainer}>
                <View style={styles.chevron} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Create Your Task
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            This is where a manual becomes a task. Add the details and bring it to life.
          </Text>
        </View>

        {/* Task Title */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Task Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Type here your task title..."
            placeholderTextColor="rgba(54,73,88,0.5)"
            style={styles.textInput}
          />
        </View>

        {/* Goal/Milestone Selection */}
        <GoalMilestoneSelection />


        {/* Date Picker */}
        <DatePicker 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {/* Notes Section */}
        <NotesSection 
          notes={notes}
          onNotesChange={setNotes}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={handleCancel}
            style={[styles.actionButton, styles.cancelButton]}
          >
            <Text style={styles.actionButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.actionButton, styles.saveButton]}
          >
            <Text style={styles.actionButtonText}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 43,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 10,
    marginBottom: 8,
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

  // Selection card styles
  selectionCard: {
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
  selectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  radioButton: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 0.5,
    marginRight: 11,
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  radioButtonSelected: {
    backgroundColor: '#A3B18A',
    borderColor: '#a3b18a',
  },
  radioButtonUnselected: {
    backgroundColor: '#d9d9d9',
    borderColor: '#a3b18a',
  },
  selectionLabel: {
    fontSize: 19,
    fontWeight: '700',
    color: '#364958',
    flex: 1,
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
    textAlignVertical: 'top',
  },

  // Date picker styles
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

  // Modal styles
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

  // Goal attachment styles (matching SparkAIOutput)
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

  // Chevron icon styles (matching SparkAIOutput)
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
  emptyStateDropdownItem: {
    backgroundColor: '#e9edc9',
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
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
    textAlign: 'center',
  },
});
