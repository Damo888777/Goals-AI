import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '../constants/images';
import { useTasks, useGoals, useMilestones } from '../hooks/useDatabase';
import { GoalCard } from './GoalCard';
import VisionImage from '../db/models/VisionImage';
import VisionPicker from './VisionPicker';
import { SelectionCard } from './SelectionCard';
import { typography } from '../constants/typography';
import { emptyStateSpacing } from '../constants/spacing';
import { Button } from './Button';
import { formatDate as formatDateUtil } from '../utils/dateFormatter';

// Types for the component
export type SparkOutputType = 'task' | 'goal' | 'milestone';

interface SparkAIOutputProps {
  type: SparkOutputType;
  userVoiceInput: string;
  aiTitle?: string;
  aiTimestamp?: string;
  linkedGoalId?: string | null;
  linkedMilestoneId?: string | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

// Date Picker Component
interface DatePickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateSelect }) => {
  const { t } = useTranslation();
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate || new Date());

  // Update tempDate when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  }, [selectedDate]);

  const handleDatePickerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Set tempDate to selectedDate when opening picker
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
    return formatDateUtil(date, t);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('components.sparkAIOutput.dateSelection.title')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('components.sparkAIOutput.dateSelection.subtitle')}
      </Text>
      <TouchableOpacity 
        style={styles.datePickerContainer}
        onPress={handleDatePickerPress}
      >
        <View style={styles.datePickerContent}>
          <Text style={styles.datePickerText}>
            {selectedDate ? formatDate(selectedDate) : t('components.sparkAIOutput.dateSelection.selectDate')}
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
              <Text style={styles.modalTitle}>{t('components.sparkAIOutput.datePicker.modalTitle')}</Text>
            </View>
            
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#364958"
                locale={t('localeCode')}
                style={styles.nativeDatePicker}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title={t('components.sparkAIOutput.datePicker.cancel')}
                variant="cancel"
                onPress={handleCancel}
                style={styles.modalButton}
              />
              <Button
                title={t('components.sparkAIOutput.datePicker.confirm')}
                variant="confirm"
                onPress={handleConfirm}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
            {t('components.sparkAIOutput.eatTheFrog.title')}
          </Text>
          <Text style={styles.eatFrogDescription}>
            {t('components.sparkAIOutput.eatTheFrog.description')}
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
            source={require('../../assets/frog.png')}
            style={styles.frogIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Emotion Selection (for goals only)
interface EmotionSelectionProps {
  selectedEmotions: string[];
  onEmotionToggle: (emotion: string) => void;
}

const EmotionSelection: React.FC<EmotionSelectionProps> = ({ selectedEmotions, onEmotionToggle }) => {
  const { t } = useTranslation();
  const emotions = [
    { label: t('goalDetails.emotions.confident'), color: '#f7e1d7', textColor: '#a4133c' },
    { label: t('goalDetails.emotions.grateful'), color: '#a1c181', textColor: '#081c15' },
    { label: t('goalDetails.emotions.proud'), color: '#cdb4db', textColor: '#3d405b' },
    { label: t('goalDetails.emotions.calm'), color: '#dedbd2', textColor: '#335c67' },
    { label: t('goalDetails.emotions.energized'), color: '#eec170', textColor: '#780116' },
    { label: t('goalDetails.emotions.happy'), color: '#bde0fe', textColor: '#023047' },
    { label: t('goalDetails.emotions.empowered'), color: '#eae2b7', textColor: '#bb3e03' },
    { label: t('goalDetails.emotions.excited'), color: '#f4a261', textColor: '#b23a48' },
    { label: t('goalDetails.emotions.fulfilled'), color: '#f8ad9d', textColor: '#e07a5f' },
  ];

  const handleEmotionPress = (emotion: string) => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedEmotions.includes(emotion)) {
      onEmotionToggle(emotion);
    } else if (selectedEmotions.length < 5) {
      onEmotionToggle(emotion);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('components.sparkAIOutput.emotions.title')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('components.sparkAIOutput.emotions.subtitle')}
      </Text>
      <View style={styles.emotionGrid}>
        {emotions.map((emotion, index) => {
          const isSelected = selectedEmotions.includes(emotion.label);
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleEmotionPress(emotion.label)}
              style={[
                styles.emotionButton,
                {
                  backgroundColor: emotion.color,
                  borderColor: emotion.textColor,
                  opacity: selectedEmotions.length >= 5 && !isSelected ? 0.5 : 1,
                },
                isSelected && styles.emotionButtonSelected
              ]}
            >
              {isSelected && <View style={styles.emotionButtonOverlay} />}
              <Text style={[styles.emotionText, { color: emotion.textColor }]}>
                {emotion.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Vision Board Section (for goals only)
interface VisionBoardSectionProps {
  selectedVisionImage?: VisionImage | null;
  onVisionImageSelect: (image: VisionImage | null) => void;
}

const VisionBoardSection: React.FC<VisionBoardSectionProps> = ({ 
  selectedVisionImage, 
  onVisionImageSelect 
}) => {
  const { t } = useTranslation();
  const [showVisionPicker, setShowVisionPicker] = useState(false);
  const { goals } = useGoals();

  // No need to filter vision images here - VisionPicker handles this

  const handleVisionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowVisionPicker(true);
  };

  const handleVisionSelect = (image: VisionImage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVisionImageSelect(image);
  };

  const handleRemoveVision = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVisionImageSelect(null);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('components.sparkAIOutput.vision.title')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('components.sparkAIOutput.vision.subtitle')}
      </Text>
      
      <TouchableOpacity 
        style={styles.visionButtonTouchable}
        onPress={handleVisionPress}
      >
        <View style={[styles.visionButton, selectedVisionImage ? styles.visionButtonWithImage : null]}>
          <View style={styles.visionButtonInner}>
            <Image 
              source={selectedVisionImage?.imageUrl ? 
                { uri: selectedVisionImage.imageUrl } : 
                images.icons.createVision
              }
              style={styles.visionImage}
              contentFit="cover"
            />
          </View>
          {!selectedVisionImage && (
            <Text style={styles.visionButtonText}>
              {t('components.sparkAIOutput.vision.chooseVision')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Vision Management Buttons - only show when there's an image */}
      {selectedVisionImage && (
        <View style={styles.visionButtonsContainer}>
          <TouchableOpacity
            onPress={handleRemoveVision}
            style={[styles.visionActionButton, { backgroundColor: '#bc4b51', width: 134 }]}
          >
            <Text style={styles.visionActionButtonText}>
              {t('goalDetails.vision.remove')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleVisionPress}
            style={[styles.visionActionButton, { backgroundColor: '#a3b18a', flex: 1 }]}
          >
            <Text style={styles.visionActionButtonText}>
              {t('components.sparkAIOutput.vision.changeVision')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Vision Picker Modal */}
      <VisionPicker
        visible={showVisionPicker}
        onClose={() => setShowVisionPicker(false)}
        onVisionSelect={handleVisionSelect}
        selectedVisionImage={selectedVisionImage}
      />
    </View>
  );
};

// Goal Selection Component for Milestones  
interface GoalSelectionProps {
  selectedGoalId?: string;
  onGoalSelect: (goalId?: string) => void;
  onDropdownToggle?: (isOpen: boolean) => void;
}

const GoalSelection: React.FC<GoalSelectionProps> = ({ selectedGoalId, onGoalSelect, onDropdownToggle }) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { goals } = useGoals();
  
  // Filter out completed goals
  const availableGoals = goals.filter(g => !g.isCompleted);

  console.log('🎯 [GoalSelection] Component props:', { selectedGoalId });
  console.log('🎯 [GoalSelection] Available goals:', availableGoals.map(g => ({ id: g.id, title: g.title })));

  // Auto-open dropdown if there's a preselected goal
  useEffect(() => {
    console.log('🎯 [GoalSelection] useEffect triggered with selectedGoalId:', selectedGoalId);
    if (selectedGoalId) {
      console.log('🎯 [GoalSelection] Opening dropdown for preselected goal');
      setIsDropdownOpen(true);
      onDropdownToggle?.(true);
    }
  }, [selectedGoalId, onDropdownToggle]);

  const handleDropdownPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = !isDropdownOpen;
    setIsDropdownOpen(newState);
    onDropdownToggle?.(newState);
  };

  const handleGoalSelect = (goalId: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGoalSelect(goalId);
    setIsDropdownOpen(false);
    onDropdownToggle?.(false);
  };

  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  
  console.log('🎯 [GoalSelection] Selected goal found:', selectedGoal ? { id: selectedGoal.id, title: selectedGoal.title } : 'NONE');
  console.log('🎯 [GoalSelection] Dropdown state:', { isDropdownOpen });

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('components.sparkAIOutput.goalSelection.title')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('components.sparkAIOutput.goalSelection.subtitle')}
      </Text>
      
      {/* Dropdown Container */}
      <View style={styles.goalAttachmentContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity 
          style={styles.goalAttachmentContent}
          onPress={handleDropdownPress}
        >
          <Text style={styles.goalAttachmentText}>
            {selectedGoal ? selectedGoal.title : t('components.sparkAIOutput.goalSelection.selectGoal')}
          </Text>
          <View style={[styles.chevronIcon, isDropdownOpen && styles.chevronIconRotated]}>
            <View style={styles.chevronLine1} />
            <View style={styles.chevronLine2} />
          </View>
        </TouchableOpacity>

        {/* Dropdown Content */}
        {isDropdownOpen && (
          <View style={styles.dropdownContent}>
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
                  onDetach={() => onGoalSelect(undefined)}
                />
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

// Goal/Milestone Selection Component (for tasks only)
interface GoalMilestoneSelectionProps {
  selectedGoalId?: string;
  selectedMilestoneId?: string;
  onGoalSelect: (goalId?: string) => void;
  onMilestoneSelect: (milestoneId?: string) => void;
}

const GoalMilestoneSelection: React.FC<GoalMilestoneSelectionProps> = ({ 
  selectedGoalId, 
  selectedMilestoneId, 
  onGoalSelect, 
  onMilestoneSelect 
}) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(Boolean(selectedGoalId || selectedMilestoneId));
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  
  // Filter out completed goals and milestones
  const availableGoals = goals.filter(g => !g.isCompleted);
  const availableMilestones = milestones.filter(m => !m.isComplete);

  // Auto-open dropdown if there's a preselected goal or milestone
  useEffect(() => {
    if (selectedGoalId || selectedMilestoneId) {
      setIsDropdownOpen(true);
    }
  }, [selectedGoalId, selectedMilestoneId]);

  const handleDropdownPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleGoalSelect = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedGoalId === goalId) {
      onGoalSelect(undefined);
    } else {
      onGoalSelect(goalId);
      onMilestoneSelect(undefined); // Clear milestone selection
    }
  };

  const handleMilestoneSelect = (milestoneId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMilestoneId === milestoneId) {
      onMilestoneSelect(undefined);
    } else {
      onMilestoneSelect(milestoneId);
      onGoalSelect(undefined); // Clear goal selection
    }
  };

  const getDropdownButtonText = () => {
    if (selectedGoalId) {
      const goal = goals.find(g => g.id === selectedGoalId);
      return goal ? goal.title : t('components.sparkAIOutput.goalMilestoneSelection.selectGoalMilestone');
    }
    if (selectedMilestoneId) {
      const milestone = milestones.find(m => m.id === selectedMilestoneId);
      return milestone ? milestone.title : t('components.sparkAIOutput.goalMilestoneSelection.selectGoalMilestone');
    }
    return t('components.sparkAIOutput.goalMilestoneSelection.selectGoalMilestone');
  };

  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  const selectedMilestone = milestones.find(milestone => milestone.id === selectedMilestoneId);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('components.sparkAIOutput.goalMilestoneSelection.title')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('components.sparkAIOutput.goalMilestoneSelection.subtitle')}
      </Text>
      
      {/* Dropdown Container */}
      <View style={styles.goalAttachmentContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity 
          style={styles.goalAttachmentContent}
          onPress={handleDropdownPress}
        >
          <Text style={styles.goalAttachmentText}>
            {getDropdownButtonText()}
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
            <Text style={styles.dropdownSectionTitle}>{t('components.sparkAIOutput.goalMilestoneSelection.goalSection')}</Text>
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
                  onDetach={() => onGoalSelect(undefined)}
                />
              ))
            ) : (
              <GoalCard variant="selection-empty" />
            )}
            
            {/* Milestones Section */}
            <Text style={styles.dropdownSectionTitle}>{t('components.sparkAIOutput.goalMilestoneSelection.milestonesSection')}</Text>
            {availableMilestones.length > 0 ? (
              availableMilestones.map((milestone) => (
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

// Notes Section
const NotesSection: React.FC<{ notes: string; onNotesChange: (text: string) => void }> = ({ 
  notes, 
  onNotesChange 
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('components.sparkAIOutput.notesSection.title')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('components.sparkAIOutput.notesSection.subtitle')}
      </Text>
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder={t('components.sparkAIOutput.placeholders.notesDetails')}
        placeholderTextColor="rgba(54,73,88,0.5)"
        style={[styles.textInput, styles.textInputMultiline]}
        multiline
        scrollEnabled={false}
      />
    </View>
  );
};

// Main SparkAI Output Component
const SparkAIOutput: React.FC<SparkAIOutputProps> = ({ 
  type: initialType, 
  userVoiceInput, 
  aiTitle = '',
  aiTimestamp = '',
  linkedGoalId = null,
  linkedMilestoneId = null,
  onSave, 
  onCancel 
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<SparkOutputType>(initialType);
  const [title, setTitle] = useState(aiTitle);
  const [notes, setNotes] = useState('');
  const [isEatTheFrog, setIsEatTheFrog] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(
    linkedGoalId && linkedGoalId !== '' ? linkedGoalId : undefined
  );
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(
    linkedMilestoneId && linkedMilestoneId !== '' ? linkedMilestoneId : undefined
  );

  // Debug logs for linked IDs
  console.log('🎯 [SparkAIOutput] Props received:', {
    type: initialType,
    linkedGoalId,
    linkedMilestoneId,
    aiTitle
  });
  
  console.log('🎯 [SparkAIOutput] Initial state set:', {
    selectedGoalId,
    selectedMilestoneId
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedVisionImage, setSelectedVisionImage] = useState<VisionImage | null>(null);

  // Database hooks
  const { createTask } = useTasks();
  const { createGoal } = useGoals();
  const { createMilestone } = useMilestones();

  // Parse AI timestamp on component mount
  useEffect(() => {
    if (aiTimestamp && aiTimestamp !== 'null' && aiTimestamp !== '') {
      try {
        const parsedDate = new Date(aiTimestamp);
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
        }
      } catch (error) {
        console.log('Failed to parse AI timestamp:', aiTimestamp);
      }
    }
  }, [aiTimestamp]);

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleGoalIdSelect = (goalId?: string) => {
    setSelectedGoalId(goalId);
  };

  const handleMilestoneIdSelect = (milestoneId?: string) => {
    setSelectedMilestoneId(milestoneId);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleVisionImageSelect = (image: VisionImage | null) => {
    setSelectedVisionImage(image);
  };

  const getSparkSuggestionText = () => {
    switch (initialType) {
      case 'task':
        return t('components.sparkAIOutput.sparkSuggestions.task');
      case 'goal':
        return t('components.sparkAIOutput.sparkSuggestions.goal');
      case 'milestone':
        return t('components.sparkAIOutput.sparkSuggestions.milestone');
    }
  };

  const getTitlePlaceholder = () => {
    switch (selectedType) {
      case 'task':
        return t('components.sparkAIOutput.placeholders.taskTitle');
      case 'goal':
        return t('components.sparkAIOutput.placeholders.goalTitle');
      case 'milestone':
        return t('components.sparkAIOutput.placeholders.milestoneTitle');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('components.sparkAIOutput.alerts.error'), t('components.sparkAIOutput.alerts.pleaseEnterTitle'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const scheduledDate = selectedDate ? selectedDate.toISOString() : null;

      switch (selectedType) {
        case 'task':
          // Enforce mutual exclusivity: task can only be attached to EITHER goal OR milestone
          await createTask({
            title: title.trim(),
            notes: notes.trim(),
            scheduledDate: selectedDate,
            isFrog: isEatTheFrog,
            goalId: selectedMilestoneId ? undefined : (selectedGoalId || undefined),
            milestoneId: selectedMilestoneId || undefined,
            creationSource: 'spark'
          });
          break;

        case 'goal':
          await createGoal({
            title: title.trim(),
            notes: notes.trim(),
            feelings: selectedEmotions,
            visionImageUrl: selectedVisionImage?.imageUrl || undefined,
            creationSource: 'spark'
          });
          break;

        case 'milestone':
          if (!selectedGoalId) {
            Alert.alert(t('components.sparkAIOutput.alerts.error'), t('components.sparkAIOutput.alerts.pleaseSelectGoal'));
            return;
          }
          await createMilestone({
            title: title.trim(),
            goalId: selectedGoalId,
            targetDate: selectedDate,
            creationSource: 'spark'
          });
          break;
      }

      // Show success confirmation
      const successMessage = selectedType === 'task' ? t('components.sparkAIOutput.alerts.taskSavedSuccessfully') :
                            selectedType === 'goal' ? t('components.sparkAIOutput.alerts.goalSavedSuccessfully') :
                            t('components.sparkAIOutput.alerts.milestoneSavedSuccessfully');
      
      Alert.alert(
        t('components.sparkAIOutput.alerts.success'),
        successMessage,
        [
          {
            text: t('components.sparkAIOutput.alerts.ok'),
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSave({
                type: selectedType,
                title,
                notes,
                isEatTheFrog: selectedType === 'task' ? isEatTheFrog : undefined,
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert(t('components.sparkAIOutput.alerts.error'), t('components.sparkAIOutput.alerts.failedToSave'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        resetScrollToCoords={{ x: 0, y: 0 }}
        enableResetScrollToCoords={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            {t('components.sparkAIOutput.header.title')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('components.sparkAIOutput.header.subtitle')}
          </Text>
        </View>

        {/* User Voice Input */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {t('components.sparkAIOutput.sections.whatISaid')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {userVoiceInput || t('components.sparkAIOutput.placeholders.voiceInputPlaceholder')}
          </Text>
        </View>

        {/* Spark's Suggestion */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {t('components.sparkAIOutput.sections.sparkSuggestion')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {getSparkSuggestionText()}
          </Text>
          <SelectionCard 
            selectedType={selectedType} 
            onTypeChange={setSelectedType} 
          />
        </View>

        {/* Title Input */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {selectedType === 'task' ? t('components.sparkAIOutput.sections.taskTitle') : 
             selectedType === 'goal' ? t('components.sparkAIOutput.sections.goalTitle') : 
             t('components.sparkAIOutput.sections.milestoneTitle')}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={getTitlePlaceholder()}
            placeholderTextColor="#364958"
            style={styles.textInput}
          />
        </View>

        {/* Conditional Sections based on type */}
        {selectedType === 'task' && (
          <View style={styles.sectionContainer}>
            <EatTheFrogSection 
              isSelected={isEatTheFrog} 
              onToggle={() => setIsEatTheFrog(!isEatTheFrog)} 
            />
          </View>
        )}

        {selectedType === 'goal' && (
          <>
            <EmotionSelection 
              selectedEmotions={selectedEmotions}
              onEmotionToggle={handleEmotionToggle}
            />
            <VisionBoardSection 
              selectedVisionImage={selectedVisionImage}
              onVisionImageSelect={handleVisionImageSelect}
            />
          </>
        )}

        {selectedType === 'task' && (
          <GoalMilestoneSelection 
            selectedGoalId={selectedGoalId}
            selectedMilestoneId={selectedMilestoneId}
            onGoalSelect={handleGoalIdSelect}
            onMilestoneSelect={handleMilestoneIdSelect}
          />
        )}

        {selectedType === 'milestone' && (
          <GoalSelection 
            selectedGoalId={selectedGoalId}
            onGoalSelect={handleGoalIdSelect}
          />
        )}

        {/* Date Picker - only for tasks and milestones */}
        {selectedType !== 'goal' && (
          <DatePicker 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        )}

        {/* Notes Section */}
        <NotesSection notes={notes} onNotesChange={setNotes} />

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title={t('components.sparkAIOutput.buttons.cancel')}
            variant="cancel"
            onPress={onCancel}
            style={styles.cancelButton}
          />
          <Button
            title={t('components.sparkAIOutput.buttons.saveChanges')}
            variant="save"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // KeyboardAvoidingView styles
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#e9edc9', // Figma background color
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 36,
  },
  scrollContent: {
    paddingBottom: 50,
    paddingTop: 20,
  },

  // Header styles
  headerContainer: {
    marginBottom: 43,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
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
    backgroundColor: '#d9d9d9', // Default background for shadow efficiency
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

  // Emotion selection styles
  emotionContainer: {
    marginBottom: 24,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    columnGap: 8,
  },
  emotionButton: {
    width: 100,
    height: 30,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    position: 'relative',
  },
  emotionButtonSelected: {
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emotionButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#9b9b9b',
    borderRadius: 5,
    opacity: 0.7,
  },
  emotionText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    zIndex: 1,
  },

  // Vision board styles
  visionContainer: {
    marginBottom: 24,
  },
  visionButtonTouchable: {
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    borderRadius: 15,
  },
  visionButton: {
    height: 80,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    backgroundColor: '#f5ebe0',
    position: 'relative',
    overflow: 'hidden',
  },
  visionButtonWithImage: {
    height: 200, // Make it taller to show more of the image
  },
  visionButtonInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
  },
  visionImage: {
    width: '100%',
    height: '100%',
  },
  visionButtonText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: '#f5ebe0',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    lineHeight: 80,
  },
  // Vision button management styles
  visionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 15,
  },
  visionActionButton: {
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
  visionActionButtonText: {
    color: '#f5ebe0',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // Vision Modal Styles
  visionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  visionModalContainer: {
    borderRadius: 20,
    width: '100%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  visionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 235, 224, 0.2)',
  },
  visionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5EBE0',
  },
  visionModalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(245, 235, 224, 0.1)',
  },
  visionModalCloseText: {
    fontSize: 24,
    color: '#F5EBE0',
    fontWeight: 'bold',
    lineHeight: 24,
  },
  visionModalContent: {
    flex: 1,
    padding: 24,
  },
  visionScrollView: {
    flex: 1,
  },
  visionScrollContent: {
    paddingBottom: 20,
  },
  visionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  visionGridItem: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  visionGridItemSelected: {
    borderColor: '#F5EBE0',
    shadowColor: '#F5EBE0',
    shadowOpacity: 0.4,
  },
  visionGridImage: {
    width: '100%',
    height: '100%',
  },
  visionGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 235, 224, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  visionGridCheckmark: {
    fontSize: 32,
    color: '#4a4e69',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  visionEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  visionEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5EBE0',
    marginBottom: 12,
    textAlign: 'center',
  },
  visionEmptySubtitle: {
    fontSize: 16,
    color: 'rgba(245, 235, 224, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Goal attachment styles
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

  // Chevron icon styles
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

  // Dropdown styles
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

  // Empty state styles
  emptyStateCard: {
    backgroundColor: '#f5ebe0',
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    borderRadius: 20,
    padding: 20,
    minHeight: 100,
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyStateInner: {
    backgroundColor: '#e9edc9',
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
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
    ...typography.emptyTitle,
    marginBottom: emptyStateSpacing.titleMarginBottom,
  },
  emptyStateDescription: {
    ...typography.emptyDescription,
    lineHeight: 20,
  },

  // Dropdown section styles
  dropdownSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
    marginTop: 8,
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
  },
  milestoneAddButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  
  // Plus icon styles
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

  // X icon styles
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
  nativeDatePicker: {
    height: 200,
    width: '100%',
    alignSelf: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 15,
  },
  modalButton: {
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
  },
  cancelModalButton: {
    backgroundColor: '#bc4b51',
  },
  confirmModalButton: {
    backgroundColor: '#a3b18a',
  },
  cancelModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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

export default SparkAIOutput;
