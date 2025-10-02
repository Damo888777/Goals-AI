import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SaveIcon, CancelIcon, ChevronDownIcon, FrogIcon, CheckIcon } from './SparkAIIcons';

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
const DatePicker: React.FC = () => {
  return (
    <View style={styles.datePickerContainer}>
      <View style={styles.datePickerContent}>
        <Text style={styles.datePickerText}>
          Select date
        </Text>
        <ChevronDownIcon />
      </View>
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
          onPress={onToggle}
          style={[
            styles.frogButton,
            isSelected ? styles.frogButtonSelected : styles.frogButtonUnselected
          ]}
        >
          <FrogIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Emotion Selection (for goals only)
const EmotionSelection: React.FC = () => {
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

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        How do you feel after you achieved your goal?
      </Text>
      <Text style={styles.sectionSubtitle}>
        Choose up to 3 emotions
      </Text>
      <View style={styles.emotionGrid}>
        {emotions.map((emotion, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.emotionButton,
              {
                backgroundColor: emotion.color,
                borderColor: emotion.textColor,
              }
            ]}
          >
            <Text style={[styles.emotionText, { color: emotion.textColor }]}>
              {emotion.label}
            </Text>
          </TouchableOpacity>
        ))}
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
        <Text style={styles.visionButtonText}>
          Choose your Vision
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Goal/Milestone Attachment (for tasks and milestones)
const GoalMilestoneAttachment: React.FC<{ type: SparkOutputType }> = ({ type }) => {
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
      <View style={styles.goalAttachmentContainer}>
        <View style={styles.goalAttachmentContent}>
          <Text style={styles.goalAttachmentText}>
            Select a main or sub goal
          </Text>
          <ChevronDownIcon />
        </View>
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

  const getSparkSuggestionText = () => {
    switch (selectedType) {
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
            Here's a draft from Spark. Feel free to adjust it.
          </Text>
        </View>

        {/* User Voice Input */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            My voice:
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
          <EatTheFrogSection 
            isSelected={isEatTheFrog} 
            onToggle={() => setIsEatTheFrog(!isEatTheFrog)} 
          />
        )}

        {selectedType === 'goal' && (
          <>
            <EmotionSelection />
            <VisionBoardSection />
          </>
        )}

        {(selectedType === 'task' || selectedType === 'milestone') && (
          <GoalMilestoneAttachment type={selectedType} />
        )}

        {/* Date Picker */}
        <View style={styles.sectionContainer}>
          <DatePicker />
        </View>

        {/* Notes Section */}
        <NotesSection notes={notes} onNotesChange={setNotes} />

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.actionButton, styles.cancelButton]}
          >
            <CancelIcon />
            <Text style={styles.actionButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.actionButton, styles.saveButton]}
          >
            <SaveIcon />
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
    backgroundColor: '#F5F5DC', // Light beige background
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 150,
  },

  // Header styles
  headerContainer: {
    marginBottom: 32,
    marginTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#364958',
    lineHeight: 22,
  },

  // Section styles
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#364958',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Selection card styles
  selectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
  },
  radioButtonSelected: {
    backgroundColor: '#8FBC8F',
    borderColor: '#8FBC8F',
  },
  radioButtonUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D0D0',
  },
  selectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#364958',
    flex: 1,
  },

  // Input styles
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#364958',
    minHeight: 44,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Date picker styles
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: '#364958',
    flex: 1,
  },

  // Eat the frog styles
  eatFrogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  eatFrogContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eatFrogTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  eatFrogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
  },
  eatFrogDescription: {
    fontSize: 14,
    color: '#364958',
    lineHeight: 20,
  },
  frogButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  frogButtonSelected: {
    backgroundColor: '#8FBC8F',
    borderColor: '#8FBC8F',
  },
  frogButtonUnselected: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D0D0D0',
  },

  // Emotion selection styles
  emotionContainer: {
    marginBottom: 24,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  emotionText: {
    fontSize: 14,
  },

  // Vision board styles
  visionContainer: {
    marginBottom: 24,
  },
  visionButton: {
    height: 80,
    backgroundColor: '#8FBC8F',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8FBC8F',
  },
  visionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Goal attachment styles
  goalAttachmentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  goalAttachmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalAttachmentText: {
    fontSize: 16,
    color: '#364958',
    flex: 1,
  },

  // Action button styles
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 44,
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  saveButton: {
    backgroundColor: '#8FBC8F',
    borderColor: '#8FBC8F',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
});

export default SparkAIOutput;
