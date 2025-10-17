import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { useGoals, useMilestones, useTasks, useVisionImages } from '../hooks/useDatabase';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const ONBOARDING_DATA_KEY = 'onboarding_data';
const SPARK_TUTORIAL_KEY = 'spark_tutorial_shown';

export interface OnboardingPreferences {
  name?: string;
  personalization?: 'man' | 'woman' | 'specify';
  genderPreference?: 'man' | 'woman' | 'specify';
}

export interface OnboardingSessionData {
  id?: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  currentStep: number;
  isCompleted: boolean;
  
  // User data
  userName?: string;
  genderPreference?: 'man' | 'woman' | 'specify';
  
  // Vision and goal data
  visionPrompt?: string;
  visionImageUrl?: string;
  visionStyle?: string;
  goalTitle?: string;
  goalEmotions?: string[];
  
  // Milestone and task data
  milestoneTitle?: string;
  firstTaskTitle?: string;
  
  // Generated entity IDs
  createdGoalId?: string;
  createdMilestoneId?: string;
  createdTaskId?: string;
  createdVisionImageId?: string;
}

export interface CompleteOnboardingData {
  userName: string;
  genderPreference: 'man' | 'woman' | 'specify';
  visionPrompt: string;
  visionImageUrl?: string;
  visionStyle: string;
  goalTitle: string;
  goalEmotions: string[];
  milestoneTitle: string;
  firstTaskTitle: string;
}

class OnboardingService {
  private currentSession: OnboardingSessionData | null = null;

  /**
   * Check if the user has completed onboarding
   */
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      // First check local storage for quick response
      const localCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (localCompleted === 'true') {
        return true;
      }

      // Check Supabase for all users (including anonymous)
      if (isSupabaseConfigured && supabase) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const { data, error } = await supabase
            .from('onboarding_sessions')
            .select('is_completed')
            .eq('user_id', currentUser.id)
            .eq('is_completed', true)
            .single();
          
          if (!error && data) {
            // Update local storage to match
            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Start a new onboarding session
   */
  async startOnboardingSession(): Promise<OnboardingSessionData> {
    console.log('🚀 Starting onboarding session...');
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.error('❌ No authenticated user found for onboarding session');
      throw new Error('No authenticated user found');
    }
    console.log('👤 Current user:', { id: currentUser.id, isAnonymous: currentUser.isAnonymous });

    const sessionData: OnboardingSessionData = {
      userId: currentUser.id,
      startedAt: new Date(),
      currentStep: 1,
      isCompleted: false
    };

    // Save to Supabase if available (including anonymous users)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('onboarding_sessions')
          .insert({
            user_id: currentUser.id,
            started_at: sessionData.startedAt.toISOString(),
            current_step: sessionData.currentStep,
            is_completed: sessionData.isCompleted
          })
          .select()
          .single();

        if (!error && data) {
          sessionData.id = data.id;
          console.log('✅ Onboarding session saved to Supabase:', data.id);
        } else if (error) {
          console.error('❌ Error saving onboarding session to Supabase:', error);
        }
      } catch (error) {
        console.error('❌ Exception saving onboarding session to Supabase:', error);
      }
    }

    this.currentSession = sessionData;
    return sessionData;
  }

  /**
   * Update onboarding session step
   */
  async updateOnboardingStep(step: number, data?: Partial<OnboardingSessionData>): Promise<void> {
    console.log('📝 Updating onboarding step:', step, 'with data:', data);
    if (!this.currentSession) {
      console.error('❌ No active onboarding session to update');
      throw new Error('No active onboarding session');
    }

    this.currentSession.currentStep = step;
    if (data) {
      Object.assign(this.currentSession, data);
    }

    // Update in Supabase if available (including anonymous users)
    if (isSupabaseConfigured && supabase && this.currentSession.id) {
      try {
        const updateData: any = {
          current_step: step,
          updated_at: new Date().toISOString()
        };

        if (data?.userName) updateData.user_name = data.userName;
        if (data?.genderPreference) updateData.gender_preference = data.genderPreference;
        if (data?.visionPrompt) updateData.vision_prompt = data.visionPrompt;
        if (data?.visionImageUrl) updateData.vision_image_url = data.visionImageUrl;
        if (data?.visionStyle) updateData.vision_style = data.visionStyle;
        if (data?.goalTitle) updateData.goal_title = data.goalTitle;
        if (data?.goalEmotions) updateData.goal_emotions = data.goalEmotions;
        if (data?.milestoneTitle) updateData.milestone_title = data.milestoneTitle;
        if (data?.firstTaskTitle) updateData.first_task_title = data.firstTaskTitle;

        const { error } = await supabase
          .from('onboarding_sessions')
          .update(updateData)
          .eq('id', this.currentSession.id);
        
        if (error) {
          console.error('❌ Error updating onboarding session in Supabase:', error);
        } else {
          console.log('✅ Onboarding session updated in Supabase');
        }
      } catch (error) {
        console.error('❌ Exception updating onboarding session:', error);
      }
    }
  }

  /**
   * Complete onboarding and create all entities
   */
  async completeOnboarding(data: CompleteOnboardingData): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    try {
      // Get today's date for scheduling
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Create entities directly using database operations to avoid circular dependencies
      const database = (await import('../db')).default;
      if (!database) {
        throw new Error('Database not available');
      }

      let goalId: string = '';
      let milestoneId: string = '';
      let taskId: string = '';
      let visionImageId: string | undefined;

      await database.write(async () => {
        // Create vision image if provided
        if (data.visionImageUrl) {
          const visionImagesCollection = database!.get('vision_images');
          const visionImage = await visionImagesCollection.create((image: any) => {
            image.userId = currentUser.id;
            image.imageUri = data.visionImageUrl;
            image.aspectRatio = 1.0;
            image.source = 'generated';
          });
          visionImageId = visionImage.id;
        }

        // Create goal
        const goalsCollection = database!.get('goals');
        const goal = await goalsCollection.create((goal: any) => {
          goal.userId = currentUser.id;
          goal.title = data.goalTitle;
          goal.setFeelings(data.goalEmotions);
          goal.visionImageUrl = data.visionImageUrl;
          goal.notes = `Created during onboarding with vision: "${data.visionPrompt}"`;
          goal.isCompleted = false;
          goal.creationSource = 'manual';
        });
        goalId = goal.id;

        // Create milestone
        const milestonesCollection = database!.get('milestones');
        const milestone = await milestonesCollection.create((milestone: any) => {
          milestone.userId = currentUser.id;
          milestone.goalId = goalId;
          milestone.title = data.milestoneTitle;
          milestone.setTargetDate(null);
          milestone.isComplete = false;
          milestone.creationSource = 'manual';
        });
        milestoneId = milestone.id;

        // Create task scheduled for today as "Eat the Frog"
        const tasksCollection = database!.get('tasks');
        const task = await tasksCollection.create((task: any) => {
          task.userId = currentUser.id;
          task.title = data.firstTaskTitle;
          task.goalId = goalId;
          task.milestoneId = milestoneId;
          task.setScheduledDate(todayStart);
          task.isFrog = true;
          task.isComplete = false;
          task.creationSource = 'manual';
        });
        taskId = task.id;
      });

      // Update session with created entity IDs
      if (this.currentSession) {
        this.currentSession.createdGoalId = goalId;
        this.currentSession.createdMilestoneId = milestoneId;
        this.currentSession.createdTaskId = taskId;
        this.currentSession.createdVisionImageId = visionImageId;
        this.currentSession.completedAt = new Date();
        this.currentSession.isCompleted = true;
      }

      // Save completion to Supabase
      if (isSupabaseConfigured && supabase && this.currentSession?.id) {
        await supabase
          .from('onboarding_sessions')
          .update({
            completed_at: new Date().toISOString(),
            is_completed: true,
            created_goal_id: goalId,
            created_milestone_id: milestoneId,
            created_task_id: taskId,
            created_vision_image_id: visionImageId,
            user_name: data.userName,
            gender_preference: data.genderPreference,
            vision_prompt: data.visionPrompt,
            vision_image_url: data.visionImageUrl,
            vision_style: data.visionStyle,
            goal_title: data.goalTitle,
            goal_emotions: data.goalEmotions,
            milestone_title: data.milestoneTitle,
            first_task_title: data.firstTaskTitle
          })
          .eq('id', this.currentSession.id);
      }

      // Save preferences locally
      await this.saveOnboardingData({
        name: data.userName,
        personalization: data.genderPreference
      });

      // Mark as completed locally
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      
      console.log('✅ Onboarding completed successfully with entities created');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Mark onboarding as completed (legacy method)
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
      // Clear local storage
      await AsyncStorage.multiRemove([ONBOARDING_COMPLETED_KEY, ONBOARDING_DATA_KEY, SPARK_TUTORIAL_KEY]);
      
      // Clear current session
      this.currentSession = null;
      
      // Clear Supabase data for all users (including anonymous)
      if (isSupabaseConfigured && supabase) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          await supabase
            .from('onboarding_sessions')
            .delete()
            .eq('user_id', currentUser.id);
        }
      }
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  /**
   * Get current onboarding session
   */
  getCurrentSession(): OnboardingSessionData | null {
    return this.currentSession;
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