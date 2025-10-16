import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../src/constants/colors';
import { typography } from '../src/constants/typography';
import { spacing, borderRadius } from '../src/constants/spacing';
import { images } from '../src/constants/images';
import { useGoals, useMilestones, useTasks } from '../src/hooks/useDatabase';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { imageGenerationService, StyleOption } from '../src/services/imageGenerationService';
import { ImageGenerationAnimation, ImageGenerationState } from '../src/components/ImageGenerationAnimation';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

interface StyleButtonProps {
  style: StyleOption;
  selected: boolean;
  onPress: () => void;
  imageUri: any;
  label: string;
}

function StyleButton({ style, selected, onPress, imageUri, label }: StyleButtonProps) {
  return (
    <View style={{ width: 150, alignItems: 'center', gap: 8 }}>
      <View style={{
        shadowColor: '#7C7C7C',
        shadowOffset: {
          width: 0,
          height: selected ? 2 : 4,
        },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 8,
        borderRadius: 15,
      }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 15,
            borderWidth: 0.5,
            borderColor: '#A3B18A',
            overflow: 'hidden',
            minHeight: 44,
          }}
        >
          <Image
            source={imageUri}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {selected && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(54, 73, 88, 0.4)',
              borderRadius: 15,
            }} />
          )}
        </Pressable>
      </View>
      <Text style={{
        color: colors.text.primary,
        fontSize: 15,
        textAlign: 'center',
        fontFamily: 'Helvetica',
        width: '100%',
      }}>
        {label}
      </Text>
    </View>
  );
}

type OnboardingStep = 'welcome' | 'name' | 'personalization' | 'vision' | 'goal' | 'milestone' | 'task' | 'complete';

interface OnboardingData {
  name: string;
  personalization: 'man' | 'woman' | 'specify' | null;
  visionPrompt: string;
  visionImageUrl: string | null;
  selectedStyle: StyleOption;
  goalTitle: string;
  emotions: string[];
  milestoneTitle: string;
  taskTitle: string;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { createGoal } = useGoals();
  const { createMilestone } = useMilestones();
  const { createTask } = useTasks();
  const { completeOnboarding } = useOnboarding();
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    personalization: null,
    visionPrompt: '',
    visionImageUrl: null,
    selectedStyle: 'photorealistic',
    goalTitle: '',
    emotions: [],
    milestoneTitle: '',
    taskTitle: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationState, setGenerationState] = useState<ImageGenerationState>('idle');

  const styleOptions = [
    {
      id: 'photorealistic' as StyleOption,
      label: 'Photorealistic',
      imageUri: require('../assets/styles/style_photorealistic.png')
    },
    {
      id: 'anime' as StyleOption,
      label: 'Anime',
      imageUri: require('../assets/styles/style_anime.png')
    },
    {
      id: 'watercolour' as StyleOption,
      label: 'Watercolour',
      imageUri: require('../assets/styles/style_watercolour.png')
    },
    {
      id: 'cyberpunk' as StyleOption,
      label: 'Cyberpunk',
      imageUri: require('../assets/styles/style_cyberpunk.png')
    }
  ];

  const handleGenerateVision = async () => {
    if (!data.visionPrompt.trim()) {
      Alert.alert('Missing Vision', 'Please describe your vision before generating an image.');
      return;
    }

    if (isGenerating) {
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationState('generating');
      
      // Haptic feedback for start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await imageGenerationService.generateImage({
        userText: data.visionPrompt,
        style: data.selectedStyle
      });

      if (result.success && result.imageBase64) {
        const filename = `onboarding-vision-${Date.now()}.png`;
        const fileUri = FileSystem.cacheDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, result.imageBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        setData(prev => ({ 
          ...prev, 
          visionImageUrl: fileUri,
          goalTitle: prev.visionPrompt 
        }));
        
        setGenerationState('preview');
        
        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
      } else {
        setGenerationState('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        Alert.alert(
          'Generation Failed', 
          result.error || 'Unable to generate your vision. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => setGenerationState('idle')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setGenerationState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Generation Error',
        'An unexpected error occurred. Please check your internet connection and try again.',
        [
          {
            text: 'OK',
            onPress: () => setGenerationState('idle')
          }
        ]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'personalization', 'vision', 'goal', 'milestone', 'task', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };


  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Create goal
      await createGoal({
        title: data.goalTitle,
        feelings: data.emotions,
        visionImageUrl: data.visionImageUrl || undefined,
        creationSource: 'manual',
      });

      // TODO: Create milestone and task after getting goalId
      // For now, we'll just navigate to the app
      
      // Mark onboarding as completed with user preferences
      await completeOnboarding({
        name: data.name,
        personalization: data.personalization,
      });
      
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your goal. Please try again.');
      console.error('Onboarding completion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcomeScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.sparkImageContainer}>
        <Image
          source={require('../assets/SparkAI_Dark.png')}
          style={styles.sparkImage}
          contentFit="contain"
        />
      </View>
      
      <View style={styles.welcomeContent}>
        <Text style={[typography.title, styles.headline]}>
          Vision to Victory. Simplified.
        </Text>
        <Text style={[typography.body, styles.subheadline]}>
          Transform your dreams into achievable goals with AI-powered planning
        </Text>
      </View>
      
      <Pressable
        style={[
          styles.primaryButton,
          isPressed === 'start' && styles.buttonPressed
        ]}
        onPress={handleNext}
        onPressIn={() => setIsPressed('start')}
        onPressOut={() => setIsPressed(null)}
      >
        <Text style={[typography.button, styles.primaryButtonText]}>
          Start Your Journey
        </Text>
      </Pressable>
    </View>
  );

  const renderNameScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <Text style={[typography.title, styles.headline]}>
          First, what's your name?
        </Text>
        <Text style={[typography.body, styles.subheadline]}>
          Goals AI will use it to make your journey more personal.
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.name}
            onChangeText={(text) => setData(prev => ({ ...prev, name: text }))}
            placeholder="Enter your name"
            placeholderTextColor="rgba(54,73,88,0.5)"
            autoFocus
            scrollEnabled={false}
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.primaryButton,
            (!data.name.trim() ? styles.buttonDisabled : null),
            isPressed === 'continue' && styles.buttonPressed
          ]}
          onPress={data.name.trim() ? handleNext : undefined}
          onPressIn={() => setIsPressed('continue')}
          onPressOut={() => setIsPressed(null)}
          disabled={!data.name.trim()}
        >
          <Text style={[typography.button, styles.primaryButtonText]}>
            Continue
          </Text>
        </Pressable>
        
      </View>
    </View>
  );

  const renderPersonalizationScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <Text style={[typography.title, styles.headline]}>
          Personalize Your Visions
        </Text>
        <Text style={[typography.body, styles.subheadline]}>
          To save you time, Spark can automatically add a subject to your prompts. What should be your default?
        </Text>
        
        <View style={styles.optionsContainer}>
          {[
            { key: 'man', label: 'As a man' },
            { key: 'woman', label: 'As a woman' },
            { key: 'specify', label: "I'll specify in each prompt" },
          ].map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.optionButton,
                data.personalization === option.key && styles.optionButtonSelected,
                isPressed === option.key && styles.buttonPressed
              ]}
              onPress={() => setData(prev => ({ ...prev, personalization: option.key as any }))}
              onPressIn={() => setIsPressed(option.key)}
              onPressOut={() => setIsPressed(null)}
            >
              <Text style={[
                styles.optionButtonText,
                data.personalization === option.key && styles.optionButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.primaryButton,
            (!data.personalization ? styles.buttonDisabled : null),
            isPressed === 'continue' && styles.buttonPressed
          ]}
          onPress={data.personalization ? handleNext : undefined}
          onPressIn={() => setIsPressed('continue')}
          onPressOut={() => setIsPressed(null)}
          disabled={!data.personalization}
        >
          <Text style={[typography.button, styles.primaryButtonText]}>
            Continue
          </Text>
        </Pressable>
        
      </View>
    </View>
  );

  const renderVisionScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <View>
          <Text style={[typography.title, styles.headline]}>
            Welcome{data.name ? `, ${data.name}` : ''}. Every great journey starts with a single image.
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            What's the one dream you want to bring to life? Let's visualize it.
          </Text>
        </View>
        
        {generationState === 'idle' && (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={data.visionPrompt}
                onChangeText={(text) => setData(prev => ({ ...prev, visionPrompt: text }))}
                placeholder="Describe your vision..."
                placeholderTextColor="rgba(54,73,88,0.5)"
                multiline
                numberOfLines={3}
                autoFocus
                scrollEnabled={true}
              />
            </View>

            {/* Style Selection */}
            <View style={styles.styleSection}>
              <Text style={[typography.body, styles.styleTitle]}>
                Choose your style
              </Text>
              
              <View style={styles.styleGrid}>
                {styleOptions.map((option) => (
                  <StyleButton
                    key={option.id}
                    style={option.id}
                    selected={data.selectedStyle === option.id}
                    onPress={() => setData(prev => ({ ...prev, selectedStyle: option.id }))}
                    imageUri={option.imageUri}
                    label={option.label}
                  />
                ))}
              </View>
            </View>
          </>
        )}
        
        {generationState === 'preview' && data.visionImageUrl && (
          <View style={styles.visionPreview}>
            <Image
              source={{ uri: data.visionImageUrl }}
              style={styles.visionImage}
              contentFit="cover"
            />
          </View>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        {generationState === 'idle' && !data.visionImageUrl && (
          <Pressable
            style={[
              styles.primaryButton,
              styles.sparkButton,
              (!data.visionPrompt.trim() || isGenerating ? styles.buttonDisabled : null),
              isPressed === 'generate' && styles.buttonPressed
            ]}
            onPress={handleGenerateVision}
            onPressIn={() => setIsPressed('generate')}
            onPressOut={() => setIsPressed(null)}
            disabled={!data.visionPrompt.trim() || isGenerating}
          >
            <Image 
              source={{ uri: images.icons.createVision }} 
              style={styles.sparkIcon}
              contentFit="contain"
            />
            <Text style={[typography.button, styles.primaryButtonText]}>
              {isGenerating ? 'Creating...' : 'Generate Vision'}
            </Text>
          </Pressable>
        )}
        
        {generationState === 'preview' && data.visionImageUrl && (
          <Pressable
            style={[
              styles.primaryButton,
              isPressed === 'continue' && styles.buttonPressed
            ]}
            onPress={handleNext}
            onPressIn={() => setIsPressed('continue')}
            onPressOut={() => setIsPressed(null)}
          >
            <Text style={[typography.button, styles.primaryButtonText]}>
              Looks great, let's continue
            </Text>
          </Pressable>
        )}
        
      </View>
    </View>
  );

  const renderGoalScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <View>
          <Text style={[typography.title, styles.headline]}>
            Now, let's give your vision a clear name.
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            This will be the spark that ignites your plan.
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.goalTitle}
            onChangeText={(text) => setData(prev => ({ ...prev, goalTitle: text }))}
            placeholder="Enter your goal title"
            placeholderTextColor="rgba(54,73,88,0.5)"
            autoFocus
            scrollEnabled={false}
          />
        </View>
        
        <View style={[styles.emotionSection, { marginTop: 40 }]}>
          <Text style={[typography.title, styles.emotionTitle]}>
            And how will you feel when you achieve it?
          </Text>
          <Text style={[typography.body, styles.emotionSubtitle]}>
            Choose up to 5 emotions
          </Text>
          
          <View style={styles.emotionGrid}>
            {[
              { label: 'Confident', color: '#f7e1d7', textColor: '#a4133c' },
              { label: 'Grateful', color: '#a1c181', textColor: '#081c15' },
              { label: 'Proud', color: '#cdb4db', textColor: '#3d405b' },
              { label: 'Calm', color: '#dedbd2', textColor: '#335c67' },
              { label: 'Energized', color: '#eec170', textColor: '#780116' },
              { label: 'Happy', color: '#bde0fe', textColor: '#023047' },
              { label: 'Empowered', color: '#eae2b7', textColor: '#bb3e03' },
              { label: 'Excited', color: '#f4a261', textColor: '#b23a48' },
              { label: 'Fulfilled', color: '#f8ad9d', textColor: '#e07a5f' },
            ].map((emotion, index) => {
              const isSelected = data.emotions.includes(emotion.label);
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    setData(prev => ({
                      ...prev,
                      emotions: prev.emotions.includes(emotion.label)
                        ? prev.emotions.filter(e => e !== emotion.label)
                        : prev.emotions.length < 5 
                          ? [...prev.emotions, emotion.label]
                          : prev.emotions
                    }));
                  }}
                  style={[
                    styles.emotionButtonNew,
                    {
                      backgroundColor: emotion.color,
                      borderColor: emotion.textColor,
                      opacity: data.emotions.length >= 5 && !isSelected ? 0.5 : 1,
                    },
                    isSelected && styles.emotionButtonNewSelected
                  ]}
                >
                  {isSelected && <View style={styles.emotionButtonOverlay} />}
                  <Text style={[styles.emotionTextNew, { color: emotion.textColor }]}>
                    {emotion.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.primaryButton,
            (!data.goalTitle.trim() ? styles.buttonDisabled : null),
            isPressed === 'setgoal' && styles.buttonPressed
          ]}
          onPress={data.goalTitle.trim() ? handleNext : undefined}
          onPressIn={() => setIsPressed('setgoal')}
          onPressOut={() => setIsPressed(null)}
          disabled={!data.goalTitle.trim()}
        >
          <Text style={[typography.button, styles.primaryButtonText]}>
            Set Goal
          </Text>
        </Pressable>
        
      </View>
    </View>
  );

  const renderMilestoneScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <View>
          <Text style={[typography.title, styles.headline]}>
            A vision is reached one step at a time.
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            What is the very first milestone on your journey to "{data.goalTitle}"?
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.milestoneTitle}
            onChangeText={(text) => setData(prev => ({ ...prev, milestoneTitle: text }))}
            placeholder="e.g., Research and create a business plan"
            placeholderTextColor="rgba(54,73,88,0.5)"
            autoFocus
            scrollEnabled={false}
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.primaryButton,
            (!data.milestoneTitle.trim() ? styles.buttonDisabled : null),
            isPressed === 'createmilestone' && styles.buttonPressed
          ]}
          onPress={data.milestoneTitle.trim() ? handleNext : undefined}
          onPressIn={() => setIsPressed('createmilestone')}
          onPressOut={() => setIsPressed(null)}
          disabled={!data.milestoneTitle.trim()}
        >
          <Text style={[typography.button, styles.primaryButtonText]}>
            Create First Milestone
          </Text>
        </Pressable>
        
      </View>
    </View>
  );

  const renderTaskScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <View>
          <Text style={[typography.title, styles.headline]}>
            Let's Make It Real.
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            Turn this milestone into your first focused action.
          </Text>
        </View>
        
        <Text style={[typography.body, styles.taskQuestion]}>
          What is the one task you can do today to start this milestone?
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.taskTitle}
            onChangeText={(text) => setData(prev => ({ ...prev, taskTitle: text }))}
            placeholder="e.g., Spend 30 minutes researching competitors"
            placeholderTextColor="rgba(54,73,88,0.5)"
            autoFocus
            scrollEnabled={false}
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.primaryButton,
            styles.frogButton,
            (!data.taskTitle.trim() ? styles.buttonDisabled : null),
            isPressed === 'makefrog' && styles.buttonPressed
          ]}
          onPress={data.taskTitle.trim() ? handleComplete : undefined}
          onPressIn={() => setIsPressed('makefrog')}
          onPressOut={() => setIsPressed(null)}
          disabled={!data.taskTitle.trim() || isLoading}
        >
          <Image 
            source={{ uri: images.icons.frog }}
            style={styles.frogIcon}
            contentFit="contain"
          />
          <Text style={[typography.button, styles.primaryButtonText]}>
            {isLoading ? 'Creating...' : "Make it Today's Priority"}
          </Text>
        </Pressable>
        
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeScreen();
      case 'name':
        return renderNameScreen();
      case 'personalization':
        return renderPersonalizationScreen();
      case 'vision':
        return renderVisionScreen();
      case 'goal':
        return renderGoalScreen();
      case 'milestone':
        return renderMilestoneScreen();
      case 'task':
        return renderTaskScreen();
      default:
        return renderWelcomeScreen();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: 50 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>
        
        {/* Image Generation Animation Overlay */}
        {currentStep === 'vision' && generationState !== 'idle' && generationState !== 'preview' && (
          <ImageGenerationAnimation 
            state={generationState}
            progress={0.5} // You can implement actual progress tracking if needed
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDC9', // Green background
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: 'transparent',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: 'transparent',
  },
  welcomeContent: {
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: 75,
  },
  sparkImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 75,
  },
  sparkImage: {
    width: 160,
    height: 160,
  },
  sparkIcon: {
    width: 16,
    height: 16,
  },
  headline: {
    textAlign: 'center',
    color: colors.text.primary,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 10,
  },
  subheadline: {
    textAlign: 'center',
    color: colors.text.primary,
    opacity: 0.8,
    lineHeight: 22,
  },
  inputContainer: {
    gap: spacing.sm,
    marginTop: 20,
  },
  textInput: {
    backgroundColor: '#F5EBE0', // Cream background (exact match from completed-goal-details)
    borderRadius: 15,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    fontSize: 15,
    color: '#364958',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    textAlignVertical: 'top',
  },
  multilineInput: {
    minHeight: 80,
    maxHeight: 120,
    paddingTop: 16,
    paddingBottom: 16,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  sparkButton: {
    backgroundColor: colors.accent.frog,
  },
  frogButton: {
    backgroundColor: colors.accent.frog,
  },
  frogIcon: {
    width: 20,
    height: 20,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  optionButton: {
    backgroundColor: colors.secondary, // Cream background
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  optionButtonSelected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  optionButtonText: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  optionButtonTextSelected: {
    color: colors.secondary,
  },
  visionPreview: {
    backgroundColor: colors.secondary, // Cream background
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  visionImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  emotionQuestion: {
    textAlign: 'center',
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  emotionButton: {
    backgroundColor: colors.secondary, // Cream background
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 2,
  },
  emotionButtonSelected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  emotionButtonText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  emotionButtonTextSelected: {
    color: colors.secondary,
  },
  taskQuestion: {
    textAlign: 'center',
    color: colors.text.primary,
    fontWeight: '600',
  },
  
  // Style selection styles
  styleSection: {
    gap: 20,
  },
  styleTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    width: '100%',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    rowGap: 20,
    width: '100%',
  },
  
  // New emotion section styles
  emotionSection: {
    gap: spacing.lg,
  },
  emotionTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  emotionSubtitle: {
    color: colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 15,
    fontWeight: '300',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    columnGap: 8,
  },
  emotionButtonNew: {
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
  emotionButtonNewSelected: {
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
  emotionTextNew: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    zIndex: 1,
  },
});