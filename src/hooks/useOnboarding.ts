import { useState, useEffect } from 'react';
import { onboardingService, OnboardingPreferences, OnboardingSessionData, CompleteOnboardingData } from '../services/onboardingService';

export const useOnboarding = () => {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingPreferences | null>(null);
  const [shouldShowSparkTutorial, setShouldShowSparkTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<OnboardingSessionData | null>(null);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const [completed, data, showTutorial] = await Promise.all([
        onboardingService.isOnboardingCompleted(),
        onboardingService.getOnboardingData(),
        onboardingService.shouldShowSparkTutorial(),
      ]);

      setIsOnboardingCompleted(completed);
      setOnboardingData(data);
      setShouldShowSparkTutorial(showTutorial && completed);
    } catch (error) {
      console.error('Error loading onboarding state:', error);
      setIsOnboardingCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startOnboardingSession = async (): Promise<OnboardingSessionData> => {
    try {
      const session = await onboardingService.startOnboardingSession();
      setCurrentSession(session);
      return session;
    } catch (error) {
      console.error('Error starting onboarding session:', error);
      throw error;
    }
  };

  const updateOnboardingStep = async (step: number, data?: Partial<OnboardingSessionData>) => {
    try {
      await onboardingService.updateOnboardingStep(step, data);
      if (currentSession) {
        setCurrentSession({ ...currentSession, currentStep: step, ...data });
      }
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  };

  const completeOnboarding = async (data: CompleteOnboardingData) => {
    try {
      await onboardingService.completeOnboarding(data);
      setIsOnboardingCompleted(true);
      setOnboardingData({
        name: data.userName,
        personalization: data.genderPreference
      });
      
      // Check if we should show Spark tutorial after onboarding
      const showTutorial = await onboardingService.shouldShowSparkTutorial();
      setShouldShowSparkTutorial(showTutorial);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const completeOnboardingLegacy = async (data?: OnboardingPreferences) => {
    try {
      if (data) {
        await onboardingService.saveOnboardingData(data);
        setOnboardingData(data);
      }
      await onboardingService.markOnboardingCompleted();
      setIsOnboardingCompleted(true);
      
      // Check if we should show Spark tutorial after onboarding
      const showTutorial = await onboardingService.shouldShowSparkTutorial();
      setShouldShowSparkTutorial(showTutorial);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const completeSparkTutorial = async () => {
    try {
      await onboardingService.markSparkTutorialShown();
      setShouldShowSparkTutorial(false);
      
      // Only show paywall if onboarding is not yet completed
      // If onboarding is already completed, this is just a tutorial completion
      if (!isOnboardingCompleted) {
        const { router } = await import('expo-router');
        router.push('/onboarding-paywall');
      }
    } catch (error) {
      console.error('Error completing Spark tutorial:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await onboardingService.resetOnboarding();
      setIsOnboardingCompleted(false);
      setOnboardingData(null);
      setShouldShowSparkTutorial(false);
      setCurrentSession(null);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const getUserName = () => {
    return onboardingData?.name || null;
  };

  const getPersonalizationPreference = () => {
    return onboardingData?.personalization || null;
  };

  const updateUserPreferences = async (preferences: Partial<OnboardingPreferences>) => {
    try {
      const updatedData = { ...onboardingData, ...preferences };
      await onboardingService.saveOnboardingData(updatedData);
      setOnboardingData(updatedData);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  };

  return {
    isOnboardingCompleted,
    onboardingData,
    shouldShowSparkTutorial,
    isLoading,
    currentSession,
    userPreferences: onboardingData,
    startOnboardingSession,
    updateOnboardingStep,
    completeOnboarding,
    completeOnboardingLegacy,
    completeSparkTutorial,
    resetOnboarding,
    getUserName,
    getPersonalizationPreference,
    updateUserPreferences,
    refreshOnboardingState: loadOnboardingState,
  };
};