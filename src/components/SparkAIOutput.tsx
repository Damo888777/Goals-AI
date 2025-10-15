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
                style={styles.nativeDatePicker}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="cancel"
                onPress={handleCancel}
                style={styles.modalButton}
              />
              <Button
                title="Confirm"
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

// Emotion Selection (for goals only)
interface EmotionSelectionProps {
  selectedEmotions: string[];
  onEmotionToggle: (emotion: string) => void;
}

const EmotionSelection: React.FC<EmotionSelectionProps> = ({ selectedEmotions, onEmotionToggle }) => {
  const emotions = [
    { label: 'Confident', color: '#f7e1d7', textColor: '#a4133c' },
    { label: 'Grateful', color: '#a1c181', textColor: '#081c15' },
    { label: 'Proud', color: '#cdb4db', textColor: '#3d405b' },
    { label: 'Calm', color: '#dedbd2', textColor: '#335c67' },
    { label: 'Energized', color: '#eec170', textColor: '#780116' },
    { label: 'Happy', color: '#bde0fe', textColor: '#023047' },
    { label: 'Empowered', color: '#eae2b7', textColor: '#bb3e03' },
    { label: 'Excited', color: '#f4a261', textColor: '#b23a48' },
    { label: 'Fulfilled', color: '#f8ad9d', textColor: '#e07a5f' },
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
        How do you feel after you achieved your goal?
      </Text>
      <Text style={styles.sectionSubtitle}>
        Choose up to 5 emotions
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
        Visualize your goal
      </Text>
      <Text style={styles.sectionSubtitle}>
        Choose an image from your Vision Board.
      </Text>
      
      <TouchableOpacity 
        style={styles.visionButtonTouchable}
        onPress={handleVisionPress}
      >
        <View style={styles.visionButton}>
          <View style={styles.visionButtonInner}>
            <Image 
              source={{ 
                uri: selectedVisionImage?.imageUri || images.visionPlaceholder 
              }}
              style={styles.visionImage}
              contentFit="cover"
            />
          </View>
          {selectedVisionImage && (
            <TouchableOpacity 
              style={styles.removeVisionButton}
              onPress={handleRemoveVision}
            >
              <Text style={styles.removeVisionText}>×</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.visionButtonText}>
            {selectedVisionImage ? 'Change Vision' : 'Choose your Vision'}
          </Text>
        </View>
      </TouchableOpacity>

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { goals } = useGoals();

  // Auto-open dropdown if there's a preselected goal
  useEffect(() => {
    if (selectedGoalId) {
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

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        My Goals
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(Boolean(selectedGoalId || selectedMilestoneId));
  const { goals } = useGoals();
  const { milestones } = useMilestones();

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
      return goal ? goal.title : 'Select your goal or milestone';
    }
    if (selectedMilestoneId) {
      const milestone = milestones.find(m => m.id === selectedMilestoneId);
      return milestone ? milestone.title : 'Select your goal or milestone';
    }
    return 'Select your goal or milestone';
  };

  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  const selectedMilestone = milestones.find(milestone => milestone.id === selectedMilestoneId);

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
            {/* Goals Section */}
            <Text style={styles.dropdownSectionTitle}>Goals</Text>
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
                  onDetach={() => handleGoalSelect(goal.id)}
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
              <View style={styles.emptyStateDropdownItem}>
                <Text style={styles.emptyStateTitle}>No milestones yet</Text>
                <Text style={styles.emptyStateDescription}>Create your first milestone to get started</Text>
              </View>
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
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<SparkOutputType>(initialType);
  const [title, setTitle] = useState(aiTitle);
  const [notes, setNotes] = useState('');
  const [isEatTheFrog, setIsEatTheFrog] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(linkedGoalId || undefined);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(linkedMilestoneId || undefined);
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
        return "Spark thinks this is a Task. Change it if that's not right.";
      case 'goal':
        return "Spark thinks this is a Goal. Change it if that's not right.";
      case 'milestone':
        return "Spark thinks this is a Milestone. Change it if that's not right.";
    }
  };

  const getTitlePlaceholder = () => {
    switch (selectedType) {
      case 'task':
        return 'Type here your task title...';
      case 'goal':
        return 'Type here your goal title...';
      case 'milestone':
        return 'Type here your milestone title...';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const scheduledDate = selectedDate ? selectedDate.toISOString() : null;

      switch (selectedType) {
        case 'task':
          await createTask({
            title: title.trim(),
            notes: notes.trim(),
            scheduledDate: selectedDate,
            isFrog: isEatTheFrog,
            goalId: selectedGoalId || undefined,
            milestoneId: selectedMilestoneId || undefined,
            creationSource: 'spark'
          });
          break;

        case 'goal':
          await createGoal({
            title: title.trim(),
            notes: notes.trim(),
            feelings: selectedEmotions,
            visionImageUrl: selectedVisionImage?.imageUri || undefined,
            creationSource: 'spark'
          });
          break;

        case 'milestone':
          if (!selectedGoalId) {
            Alert.alert('Error', 'Please select a goal first to create a milestone.');
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
      Alert.alert(
        'Success!',
        `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} saved successfully`,
        [
          {
            text: 'OK',
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
      Alert.alert('Error', 'Failed to save. Please try again.');
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
            Review your Spark
          </Text>
          <Text style={styles.headerSubtitle}>
            Here's your personalized draft from Spark. Review and customize it to match your vision perfectly.
          </Text>
        </View>

        {/* User Voice Input */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            What I've said:
          </Text>
          <Text style={styles.sectionSubtitle}>
            {userVoiceInput || '[Placeholder Body Text Voice Input of User]'}
          </Text>
        </View>

        {/* Spark's Suggestion */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Spark's Suggestion:
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
            {selectedType === 'task' ? 'Task Title' : 
             selectedType === 'goal' ? 'Goal Title' : 
             'Milestone Title'}
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

        {/* Date Picker */}
        <DatePicker 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {/* Notes Section */}
        <NotesSection notes={notes} onNotesChange={setNotes} />

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title="Cancel"
            variant="cancel"
            onPress={onCancel}
            style={styles.cancelButton}
          />
          <Button
            title="Save changes"
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
    paddingBottom: 150,
    paddingTop: 63,
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
  removeVisionButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(188, 75, 81, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  removeVisionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
