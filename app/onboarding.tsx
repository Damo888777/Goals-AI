import React, { useState, useEffect } from 'react';
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
import { useOnboarding } from '../src/hooks/useOnboarding';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import i18n from '../src/services/i18next';
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

type OnboardingStep = 'language' | 'welcome' | 'name' | 'personalization' | 'vision' | 'goal' | 'milestone' | 'task' | 'complete';

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
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { availableLanguages, currentLanguage, changeLanguage } = useLanguage();
  
  const { 
    currentSession,
    startOnboardingSession,
    updateOnboardingStep,
    completeOnboarding,
    isLoading: onboardingLoading 
  } = useOnboarding();
  
  const [data, setData] = useState<OnboardingData>({
    name: currentSession?.userName || '',
    personalization: currentSession?.genderPreference || null,
    visionPrompt: currentSession?.visionPrompt || '',
    visionImageUrl: currentSession?.visionImageUrl || null,
    selectedStyle: (currentSession?.visionStyle as StyleOption) || 'photorealistic',
    goalTitle: currentSession?.goalTitle || '',
    emotions: currentSession?.goalEmotions || [],
    milestoneTitle: currentSession?.milestoneTitle || '',
    taskTitle: currentSession?.firstTaskTitle || '',
  });

  // Initialize onboarding session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!currentSession) {
        await startOnboardingSession();
      }
    };
    initializeSession();
  }, []);

  // Handle session recovery and step restoration
  useEffect(() => {
    if (currentSession) {
      console.log('🔄 Processing current session:', currentSession);
      
      // Restore current step from session
      const stepMap: { [key: number]: OnboardingStep } = {
        0: 'language',
        1: 'welcome',
        2: 'name', 
        3: 'personalization',
        4: 'vision',
        5: 'goal',
        6: 'milestone',
        7: 'task'
      };
      
      const restoredStep = stepMap[currentSession.currentStep] || 'language';
      setCurrentStep(restoredStep);
      console.log('🔄 Restored to step:', restoredStep, 'from currentStep:', currentSession.currentStep);
      
      // Restore all session data to local state
      setData({
        name: currentSession.userName || '',
        personalization: currentSession.genderPreference || null,
        visionPrompt: currentSession.visionPrompt || '',
        visionImageUrl: currentSession.visionImageUrl || null,
        selectedStyle: (currentSession.visionStyle as StyleOption) || 'photorealistic',
        goalTitle: currentSession.goalTitle || '',
        emotions: currentSession.goalEmotions || [],
        milestoneTitle: currentSession.milestoneTitle || '',
        taskTitle: currentSession.firstTaskTitle || '',
      });
      
      console.log('✅ Session data restored:', {
        step: restoredStep,
        hasName: !!currentSession.userName,
        hasVisionPrompt: !!currentSession.visionPrompt,
        hasVisionImage: !!currentSession.visionImageUrl,
        hasGoalTitle: !!currentSession.goalTitle,
        emotionsCount: currentSession.goalEmotions?.length || 0
      });
    }
  }, [currentSession]);

  // Update session data when local data changes
  useEffect(() => {
    if (currentSession && currentSession.id && data.name !== currentSession.userName && data.name) {
      const stepNumber = ['language', 'welcome', 'name', 'personalization', 'vision', 'goal', 'milestone', 'task'].indexOf(currentStep);
      updateOnboardingStep(stepNumber, { userName: data.name }).catch(error => {
        console.log('Session update failed (non-critical):', error.message);
      });
    }
  }, [data.name, currentSession?.userName, currentStep]);

  useEffect(() => {
    if (currentSession && currentSession.id && data.personalization !== currentSession.genderPreference && data.personalization) {
      const stepNumber = ['language', 'welcome', 'name', 'personalization', 'vision', 'goal', 'milestone', 'task'].indexOf(currentStep);
      updateOnboardingStep(stepNumber, { genderPreference: data.personalization }).catch(error => {
        console.log('Session update failed (non-critical):', error.message);
      });
    }
  }, [data.personalization, currentSession?.genderPreference, currentStep]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationState, setGenerationState] = useState<ImageGenerationState>('idle');

  const styleOptions = [
    {
      id: 'photorealistic' as StyleOption,
      label: t('onboarding.vision.styles.photorealistic'),
      imageUri: require('../assets/styles/style_photorealistic.png')
    },
    {
      id: 'anime' as StyleOption,
      label: t('onboarding.vision.styles.anime'),
      imageUri: require('../assets/styles/style_anime.png')
    },
    {
      id: 'watercolour' as StyleOption,
      label: t('onboarding.vision.styles.watercolour'),
      imageUri: require('../assets/styles/style_watercolour.png')
    },
    {
      id: 'cyberpunk' as StyleOption,
      label: t('onboarding.vision.styles.cyberpunk'),
      imageUri: require('../assets/styles/style_cyberpunk.png')
    }
  ];

  const optimizeGoalTitle = async (visionPrompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: visionPrompt,
          language: i18n.language,
          mode: 'optimize_goal_title',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize goal title');
      }

      const result = await response.json();
      
      // If Gemini successfully optimized the title, use it; otherwise fall back to original
      if (result.title && result.title.trim() && result.title !== 'Failed to process') {
        return result.title;
      }
      
      return visionPrompt; // Fallback to original
    } catch (error) {
      console.error('Goal title optimization error:', error);
      return visionPrompt; // Fallback to original
    }
  };

  const handleGenerateVision = async () => {
    if (!data.visionPrompt.trim()) {
      Alert.alert(t('onboarding.alerts.missingVision'), t('onboarding.alerts.missingVisionMessage'));
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
        style: data.selectedStyle,
        genderPreference: data.personalization || undefined
      });

      if (result.success && result.imageBase64) {
        const filename = `onboarding-vision-${Date.now()}.png`;
        const fileUri = FileSystem.cacheDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, result.imageBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Optimize the vision prompt into a proper goal title
        const optimizedGoalTitle = await optimizeGoalTitle(data.visionPrompt);
        
        setData(prev => ({ 
          ...prev, 
          visionImageUrl: fileUri,
          goalTitle: optimizedGoalTitle 
        }));
        
        // Update session with vision data
        await updateOnboardingStep(3, {
          visionPrompt: data.visionPrompt,
          visionImageUrl: fileUri,
          visionStyle: data.selectedStyle,
          goalTitle: optimizedGoalTitle
        });
        
        setGenerationState('preview');
        
        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
      } else {
        setGenerationState('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        Alert.alert(
          t('onboarding.alerts.generationFailed'), 
          result.error || t('onboarding.alerts.generationFailedMessage'),
          [
            {
              text: t('onboarding.alerts.ok'),
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
        t('onboarding.alerts.generationError'),
        t('onboarding.alerts.generationErrorMessage'),
        [
          {
            text: t('onboarding.alerts.ok'),
            onPress: () => setGenerationState('idle')
          }
        ]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = async () => {
    console.log('🔄 handleNext called, currentStep:', currentStep);
    try {
      const steps: OnboardingStep[] = ['language', 'welcome', 'name', 'personalization', 'vision', 'goal', 'milestone', 'task', 'complete'];
      const currentIndex = steps.indexOf(currentStep);
      console.log('🔄 Current index:', currentIndex, 'Next step will be:', steps[currentIndex + 1]);
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        
        // Update session with current step and relevant data
        const stepData: any = {};
        if (currentStep === 'name') stepData.userName = data.name;
        if (currentStep === 'personalization') stepData.genderPreference = data.personalization;
        if (currentStep === 'vision') {
          stepData.visionPrompt = data.visionPrompt;
          stepData.visionImageUrl = data.visionImageUrl;
          stepData.visionStyle = data.selectedStyle;
        }
        if (currentStep === 'goal') {
          stepData.goalTitle = data.goalTitle;
          stepData.goalEmotions = data.emotions;
        }
        if (currentStep === 'milestone') stepData.milestoneTitle = data.milestoneTitle;
        if (currentStep === 'task') stepData.firstTaskTitle = data.taskTitle;
        
        // Try to update session but don't block progression if it fails
        try {
          const nextStepNumber = steps.indexOf(nextStep);
          await updateOnboardingStep(nextStepNumber, stepData);
        } catch (sessionError) {
          console.error('Session update failed, but continuing:', sessionError);
        }
        
        // Always update the UI step regardless of session update
        setCurrentStep(nextStep);
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      // Still try to proceed to prevent blocking
      const steps: OnboardingStep[] = ['language', 'welcome', 'name', 'personalization', 'vision', 'goal', 'milestone', 'task', 'complete'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };


  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Complete onboarding with all collected data
      await completeOnboarding({
        userName: data.name,
        genderPreference: data.personalization || 'specify',
        visionPrompt: data.visionPrompt,
        visionImageUrl: data.visionImageUrl || undefined,
        visionStyle: data.selectedStyle,
        goalTitle: data.goalTitle,
        goalEmotions: data.emotions,
        milestoneTitle: data.milestoneTitle,
        firstTaskTitle: data.taskTitle,
      });
      
      // Navigate to onboarding paywall
      router.replace('/onboarding-paywall');
    } catch (error) {
      Alert.alert(t('onboarding.alerts.error'), t('onboarding.alerts.onboardingFailed'));
      console.error('Onboarding completion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanguageScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.welcomeContent}>
        <View style={styles.textContainer}>
          <Text style={[typography.title, styles.headline]}>
            {t('onboarding.language.title')}
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            {t('onboarding.language.subtitle')}
          </Text>
        </View>
        
        <View style={styles.languageContainer}>
          {availableLanguages.map((language) => (
            <Pressable
              key={language.code}
              style={[
                styles.languageButton,
                currentLanguage === language.code && styles.languageButtonSelected
              ]}
              onPress={async () => {
                await changeLanguage(language.code);
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.languageFlag}>{language.flag}</Text>
              <Text style={[
                styles.languageText,
                currentLanguage === language.code && styles.languageTextSelected
              ]}>
                {language.name}
              </Text>
              {currentLanguage === language.code && (
                <Ionicons name="checkmark" size={24} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.primaryButton]}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {t('onboarding.buttons.continue')}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderWelcomeScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.welcomeContent}>
        <View style={styles.sparkImageContainer}>
          <Image
            source={require('../assets/SparkAI_Dark.png')}
            style={styles.sparkImage}
            contentFit="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[typography.title, styles.headline]}>
            {t('onboarding.welcome.title')}
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            {t('onboarding.welcome.subtitle')}
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.primaryButton,
            isPressed === 'start' && styles.buttonPressed
          ]}
          onPress={() => {
            console.log('🔄 Button pressed!');
            handleNext();
          }}
          onPressIn={() => {
            console.log('🔄 Button press in');
            setIsPressed('start');
          }}
          onPressOut={() => {
            console.log('🔄 Button press out');
            setIsPressed(null);
          }}
        >
          <Text style={[typography.button, styles.primaryButtonText]}>
            {t('onboarding.welcome.startJourney')}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderNameScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <Text style={[typography.title, styles.headline]}>
          {t('onboarding.name.title')}
        </Text>
        <Text style={[typography.body, styles.subheadline]}>
          {t('onboarding.name.subtitle')}
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.name}
            onChangeText={(text) => setData(prev => ({ ...prev, name: text }))}
            placeholder={t('onboarding.name.placeholder')}
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
            {t('onboarding.buttons.continue')}
          </Text>
        </Pressable>
        
      </View>
    </View>
  );

  const renderPersonalizationScreen = () => (
    <View style={styles.centerContent}>
      <View style={styles.content}>
        <Text style={[typography.title, styles.headline]}>
          {t('onboarding.personalization.title')}
        </Text>
        <Text style={[typography.body, styles.subheadline]}>
          {t('onboarding.personalization.subtitle')}
        </Text>
        
        <View style={styles.optionsContainer}>
          {[
            { key: 'man', label: t('onboarding.personalization.options.man') },
            { key: 'woman', label: t('onboarding.personalization.options.woman') },
            { key: 'specify', label: t('onboarding.personalization.options.specify') },
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
            {t('onboarding.buttons.continue')}
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
            {t('onboarding.vision.title', { name: data.name || '' })}
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            {t('onboarding.vision.subtitle')}
          </Text>
        </View>
        
        {generationState === 'idle' && (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={data.visionPrompt}
                onChangeText={(text) => setData(prev => ({ ...prev, visionPrompt: text }))}
                placeholder={t('onboarding.vision.placeholder')}
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
                {t('onboarding.vision.chooseStyle')}
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
              source={require('../assets/sparkle.png')} 
              style={styles.sparkIcon}
              contentFit="contain"
            />
            <Text style={[typography.button, styles.primaryButtonText]}>
              {isGenerating ? t('onboarding.vision.creating') : t('onboarding.vision.generateVision')}
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
              {t('onboarding.vision.looksGreat')}
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
            {t('onboarding.goal.title')}
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            {t('onboarding.goal.subtitle')}
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.goalTitle}
            onChangeText={(text) => setData(prev => ({ ...prev, goalTitle: text }))}
            placeholder={t('onboarding.goal.placeholder')}
            placeholderTextColor="rgba(54,73,88,0.5)"
            autoFocus
            scrollEnabled={false}
          />
        </View>
        
        <View style={[styles.emotionSection, { marginTop: 40 }]}>
          <Text style={[typography.title, styles.emotionTitle]}>
            {t('onboarding.goal.emotionTitle')}
          </Text>
          <Text style={[typography.body, styles.emotionSubtitle]}>
            {t('onboarding.goal.emotionSubtitle')}
          </Text>
          
          <View style={styles.emotionGrid}>
            {[
              { label: t('onboarding.goal.emotions.confident'), color: '#f7e1d7', textColor: '#a4133c' },
              { label: t('onboarding.goal.emotions.grateful'), color: '#a1c181', textColor: '#081c15' },
              { label: t('onboarding.goal.emotions.proud'), color: '#cdb4db', textColor: '#3d405b' },
              { label: t('onboarding.goal.emotions.calm'), color: '#dedbd2', textColor: '#335c67' },
              { label: t('onboarding.goal.emotions.energized'), color: '#eec170', textColor: '#780116' },
              { label: t('onboarding.goal.emotions.happy'), color: '#bde0fe', textColor: '#023047' },
              { label: t('onboarding.goal.emotions.empowered'), color: '#eae2b7', textColor: '#bb3e03' },
              { label: t('onboarding.goal.emotions.excited'), color: '#f4a261', textColor: '#b23a48' },
              { label: t('onboarding.goal.emotions.fulfilled'), color: '#f8ad9d', textColor: '#e07a5f' },
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
            {t('onboarding.goal.setGoal')}
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
            {t('onboarding.milestone.title')}
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            {t('onboarding.milestone.subtitle', { goalTitle: data.goalTitle })}
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.milestoneTitle}
            onChangeText={(text) => setData(prev => ({ ...prev, milestoneTitle: text }))}
            placeholder={t('onboarding.milestone.placeholder')}
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
            {t('onboarding.milestone.createMilestone')}
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
            {t('onboarding.task.title')}
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            {t('onboarding.task.subtitle')}
          </Text>
        </View>
        
        <Text style={[typography.body, styles.taskQuestion]}>
          {t('onboarding.task.question')}
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={data.taskTitle}
            onChangeText={(text) => setData(prev => ({ ...prev, taskTitle: text }))}
            placeholder={t('onboarding.task.placeholder')}
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
          disabled={!data.taskTitle.trim() || isLoading || onboardingLoading}
        >
          <Image 
            source={{ uri: images.icons.frog }}
            style={styles.frogIcon}
            contentFit="contain"
          />
          <Text style={[typography.button, styles.primaryButtonText]}>
            {(isLoading || onboardingLoading) ? t('onboarding.task.creating') : t('onboarding.task.makePriority')}
          </Text>
        </Pressable>
        
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'language':
        return renderLanguageScreen();
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
        return renderLanguageScreen();
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30, // 30px gap between logo and text
  },
  sparkImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: 10, // 10px gap between title and description
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
  
  // Language selection styles
  languageContainer: {
    gap: spacing.md,
    width: '100%',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 44, // Apple HIG compliance
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 2,
  },
  languageButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  languageTextSelected: {
    color: colors.secondary,
  },
});