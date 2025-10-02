import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { images } from '../constants/images';

// Types for the component
export type SparkOutputType = 'task' | 'goal' | 'milestone';

interface SparkAIOutputProps {
  type: SparkOutputType;
  userVoiceInput: string;
  aiTitle?: string;
  aiTimestamp?: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

// Selection Card Component
interface SelectionCardProps {
  selectedType: SparkOutputType;
  onTypeChange: (type: SparkOutputType) => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ selectedType, onTypeChange }) => {
  const options: { type: SparkOutputType; label: string }[] = [
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
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          <View style={styles.chevronIcon}>
            <View style={styles.chevronLine1} />
            <View style={styles.chevronLine2} />
          </View>
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
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmModalButtonText}>Confirm</Text>
              </TouchableOpacity>
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
const VisionBoardSection: React.FC = () => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        Visualize your goal
      </Text>
      <Text style={styles.sectionSubtitle}>
        Choose an image from your Vision Board.
      </Text>
      <TouchableOpacity style={styles.visionButton}>
        <View style={styles.visionButtonInner}>
          <Image 
            source={{ uri: 'https://s3-alpha-sig.figma.com/img/4844/37fc/b6400f851bb8da6b200396353000977b?Expires=1760313600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=emO69LGo3DduCzqcQi-DRANCkwmyO8wdYjyrRFTWCemUf4qDdF9B8OGLefK60-ttBTup1vwxA8EWo7~gMZ6B3~yFpc2odrjkWt0bE1biSsy4NvPn-9tU295Q3vTY9Q3oR8qe4oMZA0Y2AAcUqZ0ambcru7cCLszPwgAzGW5zX4BHx-L0xaQaGtImA8qXmhKy6ZPw~g63UfjooSwFrwwMASaNPwK~9LnwA0ViFccsEqB6REz4UvTvxpIfQ7KIhPXlemOIsF084F~jgLoxhwE3RKzpFOtUPZ8DMUowCfZkNJ64eBH5GBsBK-huceYr14-o3YXQ9Eifz9NmppxBa5X1CQ__' }} 
            style={styles.visionImage}
            contentFit="cover"
          />
        </View>
        <Text style={styles.visionButtonText}>
          Choose your Vision
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Goal/Milestone Attachment (for tasks and milestones)
interface GoalMilestoneAttachmentProps {
  type: SparkOutputType;
  selectedGoal?: string;
  onGoalSelect: (goal: string) => void;
}

const GoalMilestoneAttachment: React.FC<GoalMilestoneAttachmentProps> = ({ type, selectedGoal, onGoalSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availableGoals] = useState<string[]>([]); // Empty for now - would come from props/context

  const handleDropdownPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleGoalSelect = (goal: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGoalSelect(goal);
    setIsDropdownOpen(false);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {type === 'task' ? 'Goal / Milestone' : 'My goal'}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {type === 'task' 
          ? 'Attach either a goal or a milestone to your task.' 
          : 'Attach this milestone to your goal.'
        }
      </Text>
      
      {/* Dropdown Container */}
      <View style={styles.goalAttachmentContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity 
          style={styles.goalAttachmentContent}
          onPress={handleDropdownPress}
        >
          <Text style={styles.goalAttachmentText}>
            {selectedGoal || 'Select a main or sub goal'}
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
              availableGoals.map((goal, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleGoalSelect(goal)}
                >
                  <Text style={styles.dropdownItemText}>{goal}</Text>
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
  onSave, 
  onCancel 
}) => {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<SparkOutputType>(initialType);
  const [title, setTitle] = useState(aiTitle);
  const [notes, setNotes] = useState('');
  const [isEatTheFrog, setIsEatTheFrog] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
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
        return 'Placeholder Title Text';
      case 'goal':
        return 'Placeholder Title Text';
      case 'milestone':
        return 'Placeholder Title Text';
    }
  };

  const handleSave = () => {
    const data = {
      type: selectedType,
      title,
      notes,
      isEatTheFrog: selectedType === 'task' ? isEatTheFrog : undefined,
    };
    onSave(data);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            <VisionBoardSection />
          </>
        )}

        {(selectedType === 'task' || selectedType === 'milestone') && (
          <GoalMilestoneAttachment 
            type={selectedType} 
            selectedGoal={selectedGoal}
            onGoalSelect={handleGoalSelect}
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
          <TouchableOpacity
            onPress={onCancel}
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
              Save changes
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  datePickerText: {
    fontSize: 15,
    color: '#364958',
    flex: 1,
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
  visionButton: {
    height: 80,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  visionButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
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
    textAlignVertical: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
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
    transform: [{ rotate: '45deg' }, { translateX: -2 }],
  },
  chevronLine2: {
    position: 'absolute',
    width: 8,
    height: 1.5,
    backgroundColor: '#364958',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }, { translateX: 2 }],
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#f5ebe0',
    borderRadius: 20,
    margin: 20,
    width: '85%',
    maxWidth: 350,
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
  },
  nativeDatePicker: {
    height: 200,
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
    flexDirection: 'row',
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
    marginLeft: 10,
    textAlign: 'center',
  },
});

export default SparkAIOutput;
