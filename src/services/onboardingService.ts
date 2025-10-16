import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const ONBOARDING_DATA_KEY = 'onboarding_data';
const SPARK_TUTORIAL_KEY = 'spark_tutorial_shown';

export interface OnboardingPreferences {
  name?: string;
  personalization?: 'man' | 'woman' | 'specify';
}

class OnboardingService {
  /**
   * Check if the user has completed onboarding
   */
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  async markOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  }

  /**
   * Reset onboarding status (for testing purposes)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([ONBOARDING_COMPLETED_KEY, ONBOARDING_DATA_KEY, SPARK_TUTORIAL_KEY]);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  /**
   * Save onboarding preferences
   */
  async saveOnboardingData(data: OnboardingPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  }

  /**
   * Get saved onboarding preferences
   */
  async getOnboardingData(): Promise<OnboardingPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  }

  /**
   * Get the user's name from onboarding
   */
  async getUserName(): Promise<string | null> {
    try {
      const data = await this.getOnboardingData();
      return data?.name || null;
    } catch (error) {
      console.error('Error getting user name:', error);
      return null;
    }
  }

  /**
   * Get the user's personalization preference
   */
  async getPersonalizationPreference(): Promise<'man' | 'woman' | 'specify' | null> {
    try {
      const data = await this.getOnboardingData();
      return data?.personalization || null;
    } catch (error) {
      console.error('Error getting personalization preference:', error);
      return null;
    }
  }

  /**
   * Check if the user should see the Spark tutorial
   */
  async shouldShowSparkTutorial(): Promise<boolean> {
    try {
      const sparkTutorialShown = await AsyncStorage.getItem(SPARK_TUTORIAL_KEY);
      return sparkTutorialShown !== 'true';
    } catch (error) {
      console.error('Error checking Spark tutorial status:', error);
      return true; // Default to showing tutorial
    }
  }

  /**
   * Mark Spark tutorial as shown
   */
  async markSparkTutorialShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(SPARK_TUTORIAL_KEY, 'true');
    } catch (error) {
      console.error('Error marking Spark tutorial as shown:', error);
    }
  }
}

export const onboardingService = new OnboardingService();