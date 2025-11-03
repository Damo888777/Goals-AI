import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { useGoals, useMilestones, useTasks, useVisionImages } from '../hooks/useDatabase';
import i18n from './i18next';

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
   * Load incomplete onboarding session from database
   */
  async loadIncompleteSession(): Promise<OnboardingSessionData | null> {
    try {
      // Check Supabase for incomplete sessions ONLY for authenticated users
      if (isSupabaseConfigured && supabase) {
        const currentUser = authService.getCurrentUser();
        
        // CRITICAL: Only load sessions from Supabase for authenticated users
        if (currentUser && !currentUser.isAnonymous) {
          console.log('🔍 [OnboardingService] Loading incomplete session from Supabase for authenticated user');
          
          const { data, error } = await supabase
            .from('onboarding_sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_completed', false)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();
          
          if (!error && data) {
            // Map Supabase data to OnboardingSessionData
            const sessionData: OnboardingSessionData = {
              id: data.id,
              userId: data.user_id,
              startedAt: new Date(data.started_at),
              completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
              currentStep: data.current_step || 1,
              isCompleted: data.is_completed || false,
              userName: data.user_name,
              genderPreference: data.gender_preference,
              visionPrompt: data.vision_prompt,
              visionImageUrl: data.vision_image_url,
              visionStyle: data.vision_style,
              goalTitle: data.goal_title,
              goalEmotions: data.goal_emotions,
              milestoneTitle: data.milestone_title,
              firstTaskTitle: data.first_task_title,
              createdGoalId: data.created_goal_id,
              createdMilestoneId: data.created_milestone_id,
              createdTaskId: data.created_task_id,
              createdVisionImageId: data.created_vision_image_id
            };
            
            this.currentSession = sessionData;
            console.log('✅ Recovered incomplete onboarding session:', sessionData.id);
            return sessionData;
          }
        } else if (currentUser?.isAnonymous) {
          console.log('✅ [OnboardingService] User is anonymous, skipping incomplete session check (local-only mode)');
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading incomplete session:', error);
      return null;
    }
  }

  /**
   * Check if the user has completed onboarding
   */
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      // First check local storage for quick response
      const localCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      console.log('🔍 [OnboardingService] Local AsyncStorage onboarding_completed:', localCompleted);
      
      // DEBUG: Check all AsyncStorage keys to see if onboarding data exists elsewhere
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const onboardingKeys = allKeys.filter(key => key.includes('onboarding') || key.includes('completed'));
        if (onboardingKeys.length > 0) {
          console.log('🔍 [OnboardingService] Found onboarding-related keys:', onboardingKeys);
          for (const key of onboardingKeys) {
            const value = await AsyncStorage.getItem(key);
            console.log(`🔍 [OnboardingService] ${key} = ${value}`);
          }
        }
      } catch (debugError) {
        console.log('Debug error:', debugError);
      }
      
      if (localCompleted === 'true') {
        console.log('✅ [OnboardingService] Onboarding marked complete in AsyncStorage');
        return true;
      }

      // Check Supabase ONLY for authenticated (non-anonymous) users
      if (isSupabaseConfigured && supabase) {
        const currentUser = authService.getCurrentUser();
        console.log('🔍 [OnboardingService] Current user for Supabase check:', currentUser?.id, 'isAnonymous:', currentUser?.isAnonymous);
        
        // CRITICAL: Only check Supabase for authenticated users, never for anonymous users
        if (currentUser && !currentUser.isAnonymous) {
          console.log('🔍 [OnboardingService] User is authenticated, checking Supabase for completed onboarding');
          
          const { data, error } = await supabase
            .from('onboarding_sessions')
            .select('is_completed')
            .eq('user_id', currentUser.id)
            .eq('is_completed', true)
            .single();
          
          console.log('🔍 [OnboardingService] Supabase onboarding check result:', { data, error: error?.message });
          
          if (!error && data) {
            // Update local storage to match
            console.log('⚠️ [OnboardingService] Found completed onboarding in Supabase, updating AsyncStorage');
            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
            return true;
          }
        } else if (currentUser?.isAnonymous) {
          console.log('✅ [OnboardingService] User is anonymous, skipping Supabase check (push-only mode)');
        }
      }
      
      console.log('❌ [OnboardingService] No completed onboarding found - SHOULD SHOW ONBOARDING');
      return false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Start a new onboarding session or recover existing one
   */
  async startOnboardingSession(): Promise<OnboardingSessionData> {
    console.log('🚀 Starting onboarding session...');
    
    // Ensure user is authenticated before creating session
    let currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.log('🔄 No current user, initializing auth...');
      currentUser = await authService.initialize();
    }
    
    if (!currentUser) {
      console.error('❌ No authenticated user found for onboarding session');
      throw new Error('No authenticated user found');
    }
    console.log('👤 Current user:', { id: currentUser.id, isAnonymous: currentUser.isAnonymous });

    // First, try to recover any existing incomplete session
    const existingSession = await this.loadIncompleteSession();
    if (existingSession) {
      console.log('🔄 Recovered existing onboarding session');
      // Clean up any other old sessions
      await this.cleanupOldSessions();
      return existingSession;
    }

    const sessionData: OnboardingSessionData = {
      userId: currentUser.id,
      startedAt: new Date(),
      currentStep: 0,
      isCompleted: false
    };

    // Save to Supabase if available (including anonymous users)
    if (isSupabaseConfigured && supabase) {
      try {
        console.log('💾 Attempting to save session to Supabase with user_id:', currentUser.id);
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
   * Save onboarding data and create entities (but don't mark as completed until subscription)
   */
  async saveOnboardingDataAndEntities(data: CompleteOnboardingData): Promise<void> {
    // Get current user (anonymous or authenticated)
    let currentUser = authService.getCurrentUser();
    
    // If no current user, initialize anonymous user
    if (!currentUser) {
      currentUser = await authService.initialize();
      if (!currentUser) {
        throw new Error('Failed to initialize user for onboarding completion');
      }
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
            image.goalId = null; // Will be set after goal is created
            image.imageUrl = data.visionImageUrl; // Changed from imageUri
            image.imageType = 'generated'; // Changed from source
            image.prompt = data.visionPrompt || null;
            image.fileSize = null;
            image.mimeType = null;
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
          goal.notes = i18n.t('onboarding.goalNotes', { visionPrompt: data.visionPrompt });
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

      // Wait a moment for any immediate sync operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // DON'T mark as completed yet - this happens after successful subscription
      console.log('✅ [OnboardingService] Onboarding data saved - waiting for subscription to complete onboarding');
      
      // Keep session active until subscription is complete
      // this.currentSession = null; // Don't clear yet
      
      // Mark all created records as synced to prevent duplicate sync attempts
      try {
        const { syncService } = await import('./syncService');
        
        // Mark records as already synced to prevent duplicate key violations
        const recordIds = [
          `goals:${goalId}`,
          `milestones:${milestoneId}`,
          `tasks:${taskId}`
        ];
        if (visionImageId) {
          recordIds.push(`vision_images:${visionImageId}`);
        }
        
        // Mark records as synced using the public method
        await syncService.markRecordsAsSynced(recordIds);
        console.log('✅ Marked onboarding records as synced to prevent duplicates');
        
        // Schedule sync after marking records to avoid conflicts
        syncService.scheduleSync(3000); // Sync after 3 seconds to allow for proper completion
        console.log('📤 Scheduled post-onboarding sync to sync profile data');
      } catch (error) {
        console.error('Failed to schedule post-onboarding sync:', error);
      }
      
      console.log('✅ Onboarding data saved successfully with entities created');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  }

  /**
   * Mark onboarding as completed after successful subscription
   */
  async finalizeOnboardingAfterSubscription(): Promise<void> {
    try {
      console.log('✅ [OnboardingService] FINALIZING ONBOARDING AFTER SUBSCRIPTION');
      console.trace('✅ [OnboardingService] Call stack for finalization:');
      
      // Mark as completed locally
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      
      // Clear current session since onboarding is now complete
      this.currentSession = null;
      
      console.log('✅ [OnboardingService] Onboarding finalized - user can access main app');
    } catch (error) {
      console.error('Error finalizing onboarding:', error);
      throw error;
    }
  }

  /**
   * Complete onboarding (wrapper for backward compatibility)
   */
  async completeOnboarding(data: CompleteOnboardingData): Promise<void> {
    return this.saveOnboardingDataAndEntities(data);
  }

  /**
   * Clean up old incomplete sessions (keep only the most recent one)
   */
  async cleanupOldSessions(): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        const currentUser = authService.getCurrentUser();
        
        // CRITICAL: Only cleanup Supabase sessions for authenticated users
        if (currentUser && !currentUser.isAnonymous) {
          console.log('🧹 [OnboardingService] Cleaning up old Supabase sessions for authenticated user');
          
          // Get all incomplete sessions for this user
          const { data: sessions, error } = await supabase
            .from('onboarding_sessions')
            .select('id, started_at')
            .eq('user_id', currentUser.id)
            .eq('is_completed', false)
            .order('started_at', { ascending: false });
          
          if (!error && sessions && sessions.length > 1) {
            // Keep only the most recent, delete the rest
            const sessionsToDelete = sessions.slice(1).map(s => s.id);
            
            if (sessionsToDelete.length > 0) {
              await supabase
                .from('onboarding_sessions')
                .delete()
                .in('id', sessionsToDelete);
              
              console.log('🧹 Cleaned up', sessionsToDelete.length, 'old incomplete sessions');
            }
          }
        } else if (currentUser?.isAnonymous) {
          console.log('✅ [OnboardingService] User is anonymous, skipping Supabase session cleanup (local-only mode)');
        }
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }

  /**
   * Reset onboarding status (for testing purposes)
   */
  async resetOnboarding(): Promise<void> {
    try {
      console.log('🔄 [OnboardingService] RESETTING ONBOARDING - clearing AsyncStorage keys');
      console.trace('🔄 [OnboardingService] Reset call stack:');
      
      // Clear local storage including language preference to default to English
      await AsyncStorage.multiRemove([ONBOARDING_COMPLETED_KEY, ONBOARDING_DATA_KEY, SPARK_TUTORIAL_KEY, 'user-language']);
      console.log('✅ [OnboardingService] AsyncStorage keys cleared');
      
      // Clear sync tracking to allow fresh sync attempts
      try {
        const { syncService } = await import('./syncService');
        await syncService.clearSyncTracking();
      } catch (error) {
        console.error('Failed to clear sync tracking:', error);
      }
      
      // Clear current session
      this.currentSession = null;
      
      // Clear Supabase data (for reset purposes, we allow this for all users)
      if (isSupabaseConfigured && supabase) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          console.log('🧹 [OnboardingService] Clearing Supabase onboarding data for user:', currentUser.id, 'isAnonymous:', currentUser.isAnonymous);
          await supabase
            .from('onboarding_sessions')
            .delete()
            .eq('user_id', currentUser.id);
        }
      }
      
      // Re-initialize auth to ensure user is properly authenticated after reset
      await authService.initialize();
      
      // Reset language to English by default
      try {
        const i18n = (await import('./i18next')).default;
        await i18n.changeLanguage('en');
        console.log('✅ Language reset to English');
      } catch (error) {
        console.warn('Failed to reset language to English:', error);
      }
      
      console.log('✅ Onboarding reset completed');
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