import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useGoals, useMilestones, useTasks } from '../src/hooks/useDatabase';
import { images } from '../src/constants/images';
import VisionPicker from '../src/components/VisionPicker';
import { Button } from '../src/components/Button';
import { BackChevronButton, ChevronButton } from '../src/components/ChevronButton';
import { spacing } from '../src/constants/spacing';

// Emotions will be translated dynamically using t() function
const getEmotions = (t: any) => [
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

// Emotion Selection Component
interface EmotionSelectionProps {
  selectedEmotions: string[];
  onEmotionToggle: (emotion: string) => void;
}

const EmotionSelection: React.FC<EmotionSelectionProps> = ({ selectedEmotions, onEmotionToggle }) => {
  const { t } = useTranslation();
  const emotions = getEmotions(t);
  
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
        {t('goalDetails.sections.emotions')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('goalDetails.sections.emotionsSubtitle')}
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

// Vision Board Selection Component
interface VisionBoardSelectionProps {
  visionImageUrl: string;
  onChangeVision: () => void;
  onRemoveVision: () => void;
}

const VisionBoardSelection: React.FC<VisionBoardSelectionProps> = ({ visionImageUrl, onChangeVision, onRemoveVision }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('goalDetails.sections.vision')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('goalDetails.sections.visionSubtitle')}
      </Text>
      <TouchableOpacity style={styles.visionButtonTouchable} onPress={onChangeVision}>
        <View style={[styles.visionButton, visionImageUrl ? styles.visionButtonWithImage : null]}>
          <View style={styles.visionButtonInner}>
            <Image 
              source={{ uri: visionImageUrl || images.visionPlaceholder }}
              style={styles.visionImage}
              contentFit="cover"
            />
          </View>
          {!visionImageUrl && (
            <Text style={styles.visionButtonText}>
              {t('goalDetails.vision.chooseVision')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Vision Management Buttons - only show when there's an image */}
      {visionImageUrl && (
        <View style={styles.visionButtonsContainer}>
          <TouchableOpacity
            onPress={onRemoveVision}
            style={[styles.actionButton, { backgroundColor: '#bc4b51', width: 134 }]}
          >
            <Text style={styles.actionButtonText}>
              {t('goalDetails.vision.remove')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onChangeVision}
            style={[styles.actionButton, { backgroundColor: '#a3b18a', flex: 1 }]}
          >
            <Text style={styles.actionButtonText}>
              {t('goalDetails.vision.changeVision')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// MilestoneCard Component for dropdown
interface MilestoneCardProps {
  milestone: any;
  goal?: any;
  onMilestoneComplete?: (milestoneId: string) => void;
  onMilestonePress: (milestoneId: string) => void;
  onMilestoneDelete?: (milestoneId: string) => void;
  isLast?: boolean;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, goal, onMilestoneComplete, onMilestonePress, onMilestoneDelete, isLast }) => {
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const isDeleting = useRef(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('goalDetails.milestones.noDateSet');
    const date = new Date(dateString);
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = t(`calendar.months.${monthKeys[date.getMonth()]}`);
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}.${day}.${year}`;
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -20 && !isDeleting.current) {
        Animated.spring(translateX, {
          toValue: -80,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleDelete = () => {
    if (milestone?.id && onMilestoneDelete) {
      isDeleting.current = true;
      onMilestoneDelete(milestone.id);
    }
  };

  return (
    <View style={styles.milestoneCardContainer}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={[styles.milestoneCardWrapper, { transform: [{ translateX }] }]}>
          <Pressable
            onPress={() => onMilestonePress(milestone.id)}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={[
              styles.milestoneCard,
              {
                backgroundColor: isPressed ? '#D4E2B8' : '#E9EDC9',
                transform: [{ scale: isPressed ? 0.98 : 1 }],
              }
            ]}
          >
            {/* Milestone Content */}
            <View style={styles.milestoneContent}>
              <Text style={styles.milestoneTitle}>
                {milestone.title}
              </Text>
              <Text style={styles.milestoneGoal}>
                {goal?.title}
              </Text>
              <View style={styles.milestoneDateContainer}>
                <Text style={styles.milestoneDateIcon}>📅</Text>
                <Text style={styles.milestoneDateText}>
                  {formatDate(milestone.targetDate)}
                </Text>
              </View>
            </View>

            {/* Complete Button */}
            <Pressable
              onPress={() => onMilestoneComplete?.(milestone.id)}
              style={styles.milestoneCompleteButton}
            >
              <Text style={styles.milestoneCompleteText}>
                ✓
              </Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Delete State - Full Card Transform */}
      <Animated.View style={[
        styles.milestoneDeleteState,
        {
          opacity: translateX.interpolate({
            inputRange: [-80, -40, 0],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
          }),
        }
      ]}>
        <Pressable onPress={handleDelete} style={styles.milestoneDeleteButton}>
          <Icon name="delete" size={32} color="#B23A48" />
        </Pressable>
      </Animated.View>
    </View>
  );
};

// Milestones Section Component
interface MilestonesSectionProps {
  goalId: string;
  milestones: any[];
  goal: any;
  onMilestonePress: (milestoneId: string) => void;
  onMilestoneComplete?: (milestoneId: string) => void;
}

const MilestonesSection: React.FC<MilestonesSectionProps> = ({ goalId, milestones, goal, onMilestonePress, onMilestoneComplete }) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const goalMilestones = milestones.filter(m => m.goalId === goalId);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('goalDetails.sections.milestones')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('goalDetails.sections.milestonesSubtitle')}
      </Text>
      
      {/* Dropdown Container - wraps both button and content */}
      <View style={styles.milestonesDropdownContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity
          onPress={() => setShowDropdown(!showDropdown)}
          style={styles.milestonesDropdownButton}
        >
          <Text style={styles.milestonesDropdownText}>
            {goalMilestones.length > 0 ? t('goalDetails.milestones.milestonesCount', { count: goalMilestones.length }) : t('goalDetails.milestones.noMilestonesYet')}
          </Text>
          <ChevronButton
            direction={showDropdown ? "up" : "down"}
            onPress={() => setShowDropdown(!showDropdown)}
            size="medium"
          />
        </TouchableOpacity>

        {/* Dropdown Content */}
        {showDropdown && (
          <View style={styles.milestonesDropdownContent}>
            {goalMilestones.length > 0 ? (
              goalMilestones.map((milestone, index) => (
                <View key={milestone.id} style={index < goalMilestones.length - 1 ? { marginBottom: 20 } : undefined}>
                  <MilestoneCard
                    milestone={milestone}
                    goal={goal}
                    onMilestonePress={(milestoneId) => {
                      onMilestonePress(milestoneId);
                      setShowDropdown(false);
                    }}
                    onMilestoneComplete={onMilestoneComplete}
                    onMilestoneDelete={(milestoneId) => {
                      Alert.alert(
                        t('goalDetails.alerts.deleteMilestoneTitle'),
                        t('goalDetails.alerts.deleteMilestoneMessage', { title: milestone.title }),
                        [
                          { text: t('goalDetails.alerts.cancel'), style: 'cancel' },
                          {
                            text: t('goalDetails.alerts.delete'),
                            style: 'destructive',
                            onPress: () => {
                              // Handle delete - you'll need to implement this
                              console.log('Delete milestone:', milestoneId);
                            }
                          }
                        ]
                      );
                    }}
                    isLast={index === goalMilestones.length - 1}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyMilestoneContainer}>
                <Text style={styles.emptyMilestoneTitle}>
                  {t('goalDetails.milestones.emptyTitle')}
                </Text>
                <Text style={styles.emptyMilestoneDescription}>
                  {t('goalDetails.milestones.emptyDescription')}
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
  const { t } = useTranslation();
  
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('goalDetails.sections.notesDetails')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('goalDetails.sections.notesSubtitle')}
      </Text>
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder={t('goalDetails.placeholders.notesDetails')}
        placeholderTextColor="rgba(54,73,88,0.5)"
        style={[styles.textInput, styles.textInputMultiline]}
        multiline
        scrollEnabled={false}
      />
    </View>
  );
};

// Main Goal Details Screen Component
export default function GoalDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { goals, updateGoal, deleteGoal } = useGoals();
  const { milestones } = useMilestones();
  
  const [goal, setGoal] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [visionImageUrl, setVisionImageUrl] = useState(goal?.visionImageUrl || '');
  const [showVisionPicker, setShowVisionPicker] = useState(false);

  useEffect(() => {
    if (id && goals.length > 0) {
      const foundGoal = goals.find(g => g.id === id);
      if (foundGoal) {
        setGoal(foundGoal);
        setTitle(foundGoal.title);
        setNotes(foundGoal.notes || '');
        setSelectedEmotions(foundGoal.feelings || []);
        setVisionImageUrl(foundGoal.visionImageUrl || '');
      }
    }
  }, [id, goals]);

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSave = async () => {
    if (!goal) return;

    try {
      await updateGoal(goal.id, {
        title,
        notes,
        feelings: selectedEmotions,
        visionImageUrl,
      });
      router.back();
    } catch (error) {
      Alert.alert(t('goalDetails.alerts.error'), t('goalDetails.alerts.failedToSaveGoal'));
    }
  };

  const handleDelete = () => {
    if (!goal) return;

    Alert.alert(
      t('goalDetails.alerts.deleteGoalTitle'),
      t('goalDetails.alerts.deleteGoalMessage'),
      [
        { text: t('goalDetails.alerts.cancel'), style: 'cancel' },
        {
          text: t('goalDetails.alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              router.back();
            } catch (error) {
              Alert.alert(t('goalDetails.alerts.error'), t('goalDetails.alerts.failedToDeleteGoal'));
            }
          },
        },
      ]
    );
  };

  const handleMilestonePress = (milestoneId: string) => {
    router.push(`/milestone-details?id=${milestoneId}`);
  };

  const handleMilestoneComplete = async (milestoneId: string) => {
    // TODO: Implement milestone completion logic
    console.log('Complete milestone:', milestoneId);
  };

  const handleChangeVision = () => {
    setShowVisionPicker(true);
  };

  const handleVisionSelect = (visionImage: any) => {
    setVisionImageUrl(visionImage.imageUri);
  };

  const handleRemoveVision = () => {
    setVisionImageUrl('');
  };

  const handleCancel = () => {
    router.back();
  };

  if (!goal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 100 }]}>
        <Text style={styles.loadingText}>{t('goalDetails.loading')}</Text>
      </View>
    );
  }

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
        resetScrollToCoords={{ x: 0, y: 0 }}
        enableResetScrollToCoords={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <BackChevronButton
              onPress={handleCancel}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>
              {t('goalDetails.header.title')}
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('goalDetails.header.subtitle')}
          </Text>
        </View>

        {/* Goal Title */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {t('goalDetails.sections.goalTitle')}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('goalDetails.placeholders.goalTitle')}
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
        <VisionBoardSelection 
          visionImageUrl={visionImageUrl} 
          onChangeVision={handleChangeVision}
          onRemoveVision={handleRemoveVision}
        />

        {/* Milestones Section */}
        <MilestonesSection 
          goalId={goal.id}
          milestones={milestones}
          goal={goal}
          onMilestonePress={handleMilestonePress}
          onMilestoneComplete={handleMilestoneComplete}
        />

        {/* Notes Section */}
        <NotesSection 
          notes={notes}
          onNotesChange={setNotes}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title={t('goalDetails.buttons.delete')}
            variant="delete"
            onPress={handleDelete}
          />
          <Button
            title={t('goalDetails.buttons.save')}
            variant="save"
            onPress={handleSave}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Vision Picker Modal */}
      <VisionPicker
        visible={showVisionPicker}
        onClose={() => setShowVisionPicker(false)}
        onVisionSelect={handleVisionSelect}
        selectedVisionImage={null}
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
    paddingBottom: 50,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#364958',
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
    fontWeight: '300',
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

  // Dropdown styles
  dropdownButton: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#364958',
    flex: 1,
  },
  dropdownChevron: {
    width: 12,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#364958',
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  dropdownChevronUp: {
    transform: [{ rotate: '-135deg' }],
  },
  dropdownContainer: {
    backgroundColor: '#f5ebe0',
    borderRadius: 15,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
    paddingVertical: 0,
  },
  // Milestones dropdown styles (matching manual-milestone.tsx pattern)
  milestonesDropdownContainer: {
    backgroundColor: '#f5ebe0',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  milestonesDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestonesDropdownText: {
    fontSize: 15,
    color: '#364958',
    flex: 1,
  },
  // Chevron icon styles (matching manual-milestone.tsx)
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
  milestonesDropdownContent: {
    marginTop: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#a3b18a',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#364958',
    flex: 1,
  },
  milestoneArrow: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronRight: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#364958',
    transform: [{ rotate: '-45deg' }],
    borderRadius: 1,
  },
  emptyMilestoneContainer: {
    backgroundColor: '#e9edc9',
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 91,
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyMilestoneTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#364958',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMilestoneDescription: {
    fontSize: 12,
    color: '#364958',
    textAlign: 'center',
  },

  // MilestoneCard styles
  milestoneCardContainer: {
    position: 'relative',
    overflow: 'visible',
  },
  milestoneCardWrapper: {
    zIndex: 1,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    minHeight: 91,
    padding: 15,
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
  milestoneDeleteState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2CCC3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  milestoneDeleteButton: {
    width: '100%',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 12,
    paddingRight: 25,
  },
  milestoneContent: {
    flex: 1,
    gap: 8,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  milestoneGoal: {
    fontSize: 12,
    fontWeight: '300',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  milestoneDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneDateIcon: {
    fontSize: 12,
  },
  milestoneDateText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  milestoneCompleteButton: {
    backgroundColor: '#d9d9d9',
    borderWidth: 1,
    borderColor: '#7C7C7C',
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  milestoneCompleteText: {
    fontSize: 16,
    color: '#f5ebe0',
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
  visionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 15,
  },
});
