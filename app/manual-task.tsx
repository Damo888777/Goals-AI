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
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTasks, useGoals, useMilestones } from '../src/hooks/useDatabase';
import { GoalCard } from '../src/components/GoalCard';
import { SelectionCard } from '../src/components/SelectionCard';
import { Button } from '../src/components/Button';
import { BackChevronButton, ChevronButton } from '../src/components/ChevronButton';
import { spacing } from '../src/constants/spacing';
import { formatDate as formatDateUtil } from '../src/utils/dateFormatter';

// Eat the Frog Section (for tasks only)
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
            {t('manualTask.sections.eatTheFrog')}
          </Text>
          <Text style={styles.eatFrogDescription}>
            {t('manualTask.sections.eatTheFrogDescription')}
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

// Date Picker Component
interface DatePickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
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
        {t('manualTask.sections.dueDate')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('manualTask.sections.dueDateSubtitle')}
      </Text>
      <TouchableOpacity 
        style={styles.datePickerContainer}
        onPress={handleDatePickerPress}
      >
        <View style={styles.datePickerContent}>
          <Text style={styles.datePickerText}>
            {selectedDate ? formatDateUtil(selectedDate, t) : t('manualTask.datePicker.selectDate')}
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
              <Text style={styles.modalTitle}>{t('manualTask.datePicker.modalTitle')}</Text>
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
                <Text style={styles.modalCancelText}>{t('manualTask.datePicker.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.modalConfirmText}>{t('manualTask.datePicker.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Goal/Milestone Selection Component
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
    return t('manualTask.goalMilestoneSelection.selectGoalMilestone');
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('manualTask.sections.goalMilestone')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('manualTask.sections.goalMilestoneSubtitle')}
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
            <Text style={styles.dropdownSectionTitle}>{t('manualTask.goalMilestoneSelection.goalSection')}</Text>
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
            <Text style={styles.dropdownSectionTitle}>{t('manualTask.goalMilestoneSelection.milestonesSection')}</Text>
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


// Notes Section Component
interface NotesSectionProps {
  notes: string;
  onNotesChange: (text: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, onNotesChange }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('manualTask.sections.notesDetails')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('manualTask.sections.notesSubtitle')}
      </Text>
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder={t('manualTask.placeholders.notesDetails')}
        placeholderTextColor="rgba(54,73,88,0.5)"
        style={[styles.textInput, styles.textInputMultiline]}
        multiline
        scrollEnabled={false}
      />
    </View>
  );
};

// Main Manual Task Screen Component
export default function ManualTaskScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<'task' | 'goal' | 'milestone'>('task');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(undefined);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(undefined);
  const [isEatTheFrog, setIsEatTheFrog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Database hooks
  const { createTask, checkExistingFrogTask } = useTasks();
  const { createGoal } = useGoals();
  const { createMilestone, milestones } = useMilestones();
  const { goals } = useGoals();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('manualTask.alerts.error'), t('manualTask.alerts.pleaseEnterTitle'));
      return;
    }

    try {
      if (selectedType === 'task') {
        // Enforce mutual exclusivity: task can only be attached to EITHER goal OR milestone
        await createTask({
          title: title.trim(),
          notes: notes.trim(),
          scheduledDate: selectedDate,
          isFrog: isEatTheFrog,
          goalId: selectedMilestoneId ? undefined : selectedGoalId,
          milestoneId: selectedMilestoneId,
          creationSource: 'manual'
        });
      } else if (selectedType === 'goal') {
        await createGoal({
          title: title.trim(),
          notes: notes.trim() || undefined,
        });
      } else if (selectedType === 'milestone') {
        if (!selectedGoalId) {
          Alert.alert(t('manualTask.alerts.error'), t('manualTask.alerts.pleaseSelectGoalFirst'));
          setIsLoading(false);
          return;
        }
        
        await createMilestone({
          goalId: selectedGoalId,
          title: title.trim(),
          targetDate: selectedDate,
          creationSource: 'manual'
        });
      }

      // Show success confirmation
      Alert.alert(
        t('manualTask.alerts.success'),
        t('manualTask.alerts.taskCreatedSuccessfully'),
        [{ text: t('manualTask.alerts.ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert(t('manualTask.alerts.error'), t('manualTask.alerts.failedToCreateTask'));
    }
  };

  const handleCancel = () => {
    router.back();
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
          <View style={styles.titleContainer}>
            <BackChevronButton
              onPress={handleCancel}
              style={styles.chevronButton}
            />
            <Text style={styles.headerTitle}>
              {t('manualTask.header.title')}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.headerSubtitle}>
              {t('manualTask.header.subtitle')}
            </Text>
          </View>
        </View>

        {/* Task Title */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {t('manualTask.sections.taskTitle')}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('manualTask.placeholders.taskTitle')}
            placeholderTextColor="rgba(54,73,88,0.5)"
            style={styles.textInput}
          />
        </View>

        {/* Eat the Frog Section (for tasks only) */}
        {selectedType === 'task' && (
          <View style={styles.sectionContainer}>
            <EatTheFrogSection 
              isSelected={isEatTheFrog} 
              onToggle={async () => {
                if (!isEatTheFrog) {
                  // Check if there's already an active frog task
                  const existingFrogTask = await checkExistingFrogTask();
                  if (existingFrogTask) {
                    Alert.alert(
                      t('manualTask.alerts.replaceFrogTaskTitle'),
                      t('manualTask.alerts.replaceFrogTaskMessage', { title: existingFrogTask.title }),
                      [
                        {
                          text: t('manualTask.alerts.replaceFrogCancel'),
                          style: 'cancel',
                          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        },
                        {
                          text: t('manualTask.alerts.replaceFrogConfirm'),
                          onPress: () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setIsEatTheFrog(true);
                          }
                        }
                      ]
                    );
                  } else {
                    setIsEatTheFrog(true);
                  }
                } else {
                  setIsEatTheFrog(false);
                }
              }} 
            />
          </View>
        )}

        {/* Goal/Milestone Selection */}
        <GoalMilestoneSelection 
          selectedGoalId={selectedGoalId}
          selectedMilestoneId={selectedMilestoneId}
          onGoalSelect={setSelectedGoalId}
          onMilestoneSelect={setSelectedMilestoneId}
        />

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
              {t('manualTask.buttons.cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.actionButton, styles.saveButton]}
          >
            <Text style={styles.actionButtonText}>
              {t('manualTask.buttons.save')}
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
    paddingBottom: 50,
  },

  // Header styles
  headerContainer: {
    marginBottom: 43,
  },
  titleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  chevronButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: -12,
  },
  descriptionContainer: {
    alignItems: 'flex-start' as const,
    width: '100%',
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
    paddingTop: 16,
    paddingBottom: 16,
    lineHeight: 20,
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

  // Dropdown section styles
  dropdownSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#364958',
    marginTop: 16,
    marginBottom: 12,
  },

  // Milestone card styles
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
  milestoneAddButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
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

  // Eat the frog styles
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
