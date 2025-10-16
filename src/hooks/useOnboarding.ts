import { useState, useEffect } from 'react';
import { onboardingService, OnboardingPreferences } from '../services/onboardingService';

export const useOnboarding = () => {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingPreferences | null>(null);
  const [shouldShowSparkTutorial, setShouldShowSparkTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const completeOnboarding = async (data?: OnboardingPreferences) => {
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

  return {
    isOnboardingCompleted,
    onboardingData,
    shouldShowSparkTutorial,
    isLoading,
    completeOnboarding,
    completeSparkTutorial,
    resetOnboarding,
    getUserName,
    getPersonalizationPreference,
    refreshOnboardingState: loadOnboardingState,
  };
};