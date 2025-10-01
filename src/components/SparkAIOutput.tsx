import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SaveIcon, CancelIcon, ChevronDownIcon, FrogIcon, CheckIcon } from './SparkAIIcons';

// Types for the component
export type SparkOutputType = 'task' | 'goal' | 'milestone';

interface SparkAIOutputProps {
  type: SparkOutputType;
  userVoiceInput: string;
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
    <View className="bg-bg-secondary border border-border-primary rounded-card p-5">
      {options.map((option) => (
        <TouchableOpacity
          key={option.type}
          className="flex-row items-center mb-4 last:mb-0"
          onPress={() => onTypeChange(option.type)}
        >
          <View className={`w-7 h-7 rounded-small border border-border-primary mr-3 ${
            selectedType === option.type ? 'bg-bg-primary' : 'bg-gray-300'
          }`} />
          <Text className="text-text-primary font-helvetica-bold text-lg flex-1">
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
    <View className="bg-bg-secondary border border-border-primary rounded-2xl">
      <View className="flex-row items-center justify-between p-4 border-b border-border-primary">
        <Text className="text-text-primary font-helvetica text-xl flex-1">
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
    <View className="bg-bg-secondary border border-border-primary rounded-2xl p-4">
      <View className="flex-row items-center">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary font-helvetica-bold text-lg mb-2">
            Eat the frog
          </Text>
          <Text className="text-text-primary font-helvetica text-sm">
            Choose this task if completing it will make your day a success.
          </Text>
        </View>
        <TouchableOpacity
          onPress={onToggle}
          className={`w-10 h-10 rounded-button border border-border-secondary items-center justify-center ${
            isSelected ? 'bg-accent-frog' : 'bg-gray-300'
          }`}
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
    <View className="mb-6">
      <Text className="text-text-primary font-helvetica-bold text-xl mb-2">
        How do you feel after you achieved your goal?
      </Text>
      <Text className="text-text-primary font-helvetica text-sm mb-4">
        Choose up to 3 emotions
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {emotions.map((emotion, index) => (
          <TouchableOpacity
            key={index}
            className="px-2 py-1 rounded-small border"
            style={{ 
              backgroundColor: emotion.color,
              borderColor: emotion.textColor,
              borderWidth: 0.3
            }}
          >
            <Text style={{ color: emotion.textColor }} className="text-sm font-helvetica">
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
    <View className="mb-6">
      <Text className="text-text-primary font-helvetica-bold text-xl mb-2">
        Visualize your goal
      </Text>
      <Text className="text-text-primary font-helvetica text-sm mb-4">
        Choose an image from your Vision Board.
      </Text>
      <TouchableOpacity className="h-20 bg-bg-secondary border border-bg-secondary rounded-2xl items-center justify-center">
        <Text className="text-bg-secondary font-helvetica-bold text-center">
          Choose your Vision
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Goal/Milestone Attachment (for tasks and milestones)
const GoalMilestoneAttachment: React.FC<{ type: SparkOutputType }> = ({ type }) => {
  return (
    <View className="mb-6">
      <Text className="text-text-primary font-helvetica-bold text-xl mb-2">
        {type === 'task' ? 'Goal / Milestone' : 'My goal'}
      </Text>
      <Text className="text-text-primary font-helvetica text-sm mb-4">
        {type === 'task' 
          ? 'Attach either a goal or a milestone to your task.' 
          : 'Attach this milestone to your goal.'
        }
      </Text>
      <View className="bg-bg-secondary border border-border-primary rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-text-primary font-helvetica flex-1">
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
    <View className="mb-6">
      <Text className="text-text-primary font-helvetica-bold text-xl mb-2">
        Notes & Details
      </Text>
      <Text className="text-text-primary font-helvetica text-sm mb-4">
        Add any extra thoughts, links, or steps you want to remember.
      </Text>
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Type here your notes and details..."
        placeholderTextColor="rgba(54,73,88,0.5)"
        className="bg-bg-secondary border border-border-primary rounded-2xl p-4 h-15 font-helvetica text-base"
        multiline
        style={{ minHeight: 60 }}
      />
    </View>
  );
};

// Main SparkAI Output Component
const SparkAIOutput: React.FC<SparkAIOutputProps> = ({ 
  type: initialType, 
  userVoiceInput, 
  onSave, 
  onCancel 
}) => {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<SparkOutputType>(initialType);
  const [title, setTitle] = useState('');
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
    <View className="flex-1 bg-bg-primary" style={{ paddingTop: insets.top }}>
      <ScrollView 
        className="flex-1 px-9"
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-11 mt-16">
          <Text className="text-text-primary font-helvetica-bold text-xl mb-2">
            Review your Spark
          </Text>
          <Text className="text-text-primary font-helvetica text-sm">
            Here's a draft from Spark. Feel free to adjust it.
          </Text>
        </View>

        {/* User Voice Input */}
        <View className="mb-11">
          <Text className="text-text-primary font-helvetica-bold text-xl mb-2">
            My voice:
          </Text>
          <Text className="text-text-primary font-helvetica text-sm">
            {userVoiceInput || '[Placeholder Body Text Voice Input of User]'}
          </Text>
        </View>

        {/* Spark's Suggestion */}
        <View className="mb-11">
          <Text className="text-text-primary font-helvetica-bold text-xl mb-2">
            Spark's Suggestion:
          </Text>
          <Text className="text-text-primary font-helvetica text-sm mb-4">
            {getSparkSuggestionText()}
          </Text>
          <SelectionCard 
            selectedType={selectedType} 
            onTypeChange={setSelectedType} 
          />
        </View>

        {/* Title Input */}
        <View className="mb-11">
          <Text className="text-text-primary font-helvetica-bold text-xl mb-4">
            {selectedType === 'task' ? 'Task Title' : 
             selectedType === 'goal' ? 'Goal Title' : 
             'Milestone Title'}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={getTitlePlaceholder()}
            placeholderTextColor="#364958"
            className="bg-bg-secondary border border-border-primary rounded-2xl p-4 font-helvetica text-base"
          />
        </View>

        {/* Conditional Sections based on type */}
        {selectedType === 'task' && (
          <View className="mb-6">
            <EatTheFrogSection 
              isSelected={isEatTheFrog} 
              onToggle={() => setIsEatTheFrog(!isEatTheFrog)} 
            />
          </View>
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
        <View className="mb-6">
          <DatePicker />
        </View>

        {/* Notes Section */}
        <NotesSection notes={notes} onNotesChange={setNotes} />

        {/* Action Buttons */}
        <View className="flex-row justify-between items-center mb-6 gap-4">
          <TouchableOpacity
            onPress={onCancel}
            className="bg-red-600 border border-border-secondary rounded-button px-4 py-3 flex-row items-center flex-1"
            style={{ minHeight: 44 }}
          >
            <CancelIcon />
            <Text className="text-bg-secondary font-helvetica-bold text-sm ml-2 text-center flex-1">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            className="bg-accent-frog border border-border-secondary rounded-button px-4 py-3 flex-row items-center flex-1"
            style={{ minHeight: 44 }}
          >
            <SaveIcon />
            <Text className="text-bg-secondary font-helvetica-bold text-sm ml-2 text-center flex-1">
              Save changes
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SparkAIOutput;
