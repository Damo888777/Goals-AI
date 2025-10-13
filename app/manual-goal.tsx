import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useGoals } from '../src/hooks/useDatabase';
import { images } from '../src/constants/images';
import VisionPicker from '../src/components/VisionPicker';
import VisionImage from '../src/db/models/VisionImage';

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

// Emotion Selection Component
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

// Vision Section Component
interface VisionSectionProps {
  selectedVisionImage: VisionImage | null;
  onVisionImageSelect: (image: VisionImage | null) => void;
  onVisionPress: () => void;
}

const VisionSection: React.FC<VisionSectionProps> = ({ selectedVisionImage, onVisionImageSelect, onVisionPress }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        Visualize your goal
      </Text>
      <Text style={styles.sectionSubtitle}>
        Choose an image from your Vision Board.
      </Text>
      <TouchableOpacity style={styles.visionButtonTouchable} onPress={onVisionPress}>
        <View style={styles.visionButton}>
          <View style={styles.visionButtonInner}>
            <Image 
              source={{ uri: selectedVisionImage?.imageUri || images.visionPlaceholder }}
              style={styles.visionImage}
              contentFit="cover"
            />
          </View>
          <Text style={styles.visionButtonText}>
            {selectedVisionImage ? 'Change Vision' : 'Choose your Vision'}
          </Text>
        </View>
      </TouchableOpacity>
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

// Main Manual Goal Screen Component
export default function ManualGoalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'task' | 'goal' | 'milestone'>('goal');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedVisionImage, setSelectedVisionImage] = useState<VisionImage | null>(null);
  const [showVisionPicker, setShowVisionPicker] = useState(false);

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSave = () => {
    // Handle saving the manual goal
    console.log('Saving manual goal:', {
      type: selectedType,
      title,
      notes,
      emotions: selectedEmotions,
    });
    
    // Navigate back
    router.back();
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
        resetScrollToCoords={{ x: 0, y: 0 }}
        enableResetScrollToCoords={false}
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
              Create Your Goal
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            This is where a manual becomes a goal. Add the details and bring it to life.
          </Text>
        </View>

        {/* Goal Title */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Goal Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Type here your goal title..."
            placeholderTextColor="#364958"
            style={styles.textInput}
          />
        </View>

        {/* Emotion Selection */}
        <EmotionSelection 
          selectedEmotions={selectedEmotions}
          onEmotionToggle={handleEmotionToggle}
        />

        {/* Vision Board Selection */}
        <VisionSection 
          selectedVisionImage={selectedVisionImage}
          onVisionImageSelect={setSelectedVisionImage}
          onVisionPress={() => setShowVisionPicker(true)}
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
      
      {/* Vision Picker Modal */}
      <VisionPicker
        visible={showVisionPicker}
        onClose={() => setShowVisionPicker(false)}
        onVisionSelect={setSelectedVisionImage}
        selectedVisionImage={selectedVisionImage}
      />
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
    fontWeight: '700' as const,
    color: '#364958',
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '300' as const,
    color: '#364958',
    lineHeight: 20,
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

  // Emotion selection styles
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
