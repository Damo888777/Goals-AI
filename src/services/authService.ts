import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncService } from './syncService'
import database from '../db'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Q } from '@nozbe/watermelondb'

// Shared constants for data migration
const MIGRATION_COLLECTIONS = ['profiles', 'goals', 'milestones', 'tasks', 'vision_images', 'subscriptions', 'subscription_usage'] as const
const USER_DATA_COLLECTIONS = ['goals', 'milestones', 'tasks', 'vision_images'] as const

export interface AuthUser {
  id: string
  email?: string
  isAnonymous: boolean
  persistentAnonymousId?: string // For tracking the original anonymous ID
}

class AuthService {
  private currentUser: AuthUser | null = null
  private retryCount: number = 0
  private maxRetries: number = 3
  private isRetrying: boolean = false
  private persistentAnonymousId: string | null = null
  private static readonly ANONYMOUS_ID_KEY = 'persistent_anonymous_id'

  // Initialize authentication - check for existing session
  async initialize(): Promise<AuthUser | null> {
    // Load persistent anonymous ID first
    await this.loadPersistentAnonymousId()
    
    // If Supabase is not configured, create offline user
    if (!isSupabaseConfigured) {
      console.log('🔄 Creating offline user - Supabase not configured')
      return this.createOfflineUser()
    }

    try {
      const { data: { user } } = await supabase!.auth.getUser()
      
      if (user) {
        this.currentUser = {
          id: user.id,
          email: user.email || undefined,
          isAnonymous: user.is_anonymous || false,
          persistentAnonymousId: this.persistentAnonymousId || undefined
        }
        
        // Ensure profile exists in local database
        await this.ensureLocalProfile(this.currentUser)
        
        // Trigger background sync (non-blocking)
        setTimeout(() => {
          syncService.sync().catch(error => {
            console.log('Background sync failed (non-critical):', error.message)
          })
        }, 100)
        
        return this.currentUser
      }
      
      // No authenticated user - fall back to anonymous
      return this.ensureAnonymousUser()
    } catch (error) {
      console.error('Error initializing auth:', error)
      // Fallback to anonymous user
      return this.ensureAnonymousUser()
    }
  }

  // Ensure anonymous user exists (either from Supabase or offline)
  private async ensureAnonymousUser(): Promise<AuthUser> {
    // Load persistent anonymous ID if not already loaded
    if (!this.persistentAnonymousId) {
      await this.loadPersistentAnonymousId()
    }

    // If we have a persistent anonymous ID, use it for offline mode
    if (this.persistentAnonymousId) {
      this.currentUser = {
        id: this.persistentAnonymousId,
        email: undefined,
        isAnonymous: true,
        persistentAnonymousId: this.persistentAnonymousId
      }
      
      await this.ensureLocalProfile(this.currentUser)
      console.log('✅ Using persistent anonymous user:', this.persistentAnonymousId)
      return this.currentUser
    }

    // Try to create new anonymous user in Supabase
    if (isSupabaseConfigured && this.retryCount < this.maxRetries) {
      try {
        const { data, error } = await supabase!.auth.signInAnonymously()
        
        if (!error && data.user) {
          // Store this as our persistent anonymous ID
          this.persistentAnonymousId = data.user.id
          await this.savePersistentAnonymousId()
          
          this.currentUser = {
            id: data.user.id,
            email: undefined,
            isAnonymous: true,
            persistentAnonymousId: this.persistentAnonymousId
          }

          await this.ensureLocalProfile(this.currentUser)
          console.log('✅ Created new anonymous user:', data.user.id)
          return this.currentUser
        }
      } catch (error) {
        console.log('Failed to create Supabase anonymous user, falling back to offline')
      }
    }

    // Fallback to offline anonymous user
    return this.createOfflineUser()
  }

  // Sign in anonymously (guest mode) - now just ensures anonymous user exists
  async signInAnonymously(): Promise<AuthUser> {
    return this.ensureAnonymousUser()
  }

  // Create offline user for when Supabase is unavailable
  private async createOfflineUser(): Promise<AuthUser> {
    // Use persistent anonymous ID if available, otherwise create new one
    if (!this.persistentAnonymousId) {
      // Generate a UUID-compatible offline ID to avoid Supabase validation errors
      this.persistentAnonymousId = this.generateOfflineUUID()
      await this.savePersistentAnonymousId()
    }
    
    this.currentUser = {
      id: this.persistentAnonymousId,
      email: undefined,
      isAnonymous: true,
      persistentAnonymousId: this.persistentAnonymousId
    }

    // Create profile in local database
    await this.ensureLocalProfile(this.currentUser)
    
    console.log('✅ Created offline user:', this.persistentAnonymousId)
    return this.currentUser
  }

  // Generate a UUID-compatible offline ID
  private generateOfflineUUID(): string {
    // Generate a UUID v4 compatible string for offline users
    // This ensures compatibility with Supabase UUID fields
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Validate UUID format
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Migrate existing local data from old user ID to new UUID
  private async migrateUserData(oldUserId: string, newUserId: string): Promise<void> {
    try {
      if (!database) {
        console.log('⚠️ Database not available for user data migration');
        return;
      }

      console.log('🔄 Migrating user data from', oldUserId, 'to', newUserId);

      await database.write(async () => {
        // Update all tables that have user_id field
        for (const collectionName of MIGRATION_COLLECTIONS) {
          try {
            const collection = database!.get(collectionName);
            // CRITICAL: Use database column name 'user_id' (snake_case), not model property 'userId'
            const records = await collection.query(Q.where('user_id', oldUserId)).fetch();
            
            if (records.length > 0) {
              await Promise.all(records.map((record: any) => 
                record.update((r: any) => {
                  r.userId = newUserId;
                })
              ));
              
              console.log(`✅ Migrated ${records.length} records in ${collectionName}`);
            }
          } catch (error) {
            console.error(`❌ Error migrating ${collectionName}:`, error);
          }
        }
      });

      console.log('✅ User data migration completed');
    } catch (error) {
      console.error('❌ User data migration failed:', error);
    }
  }

  // Sign out from authenticated session but maintain anonymous user
  async signOut(): Promise<void> {
    try {
      const previousAuthenticatedId = this.currentUser?.id
      const wasAuthenticated = this.currentUser && !this.currentUser.isAnonymous
      
      // Sign out from Supabase (only if configured)
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }

      // Revert to anonymous user
      await this.ensureAnonymousUser()
      
      // CRITICAL: Migrate data back from authenticated ID to anonymous ID
      if (wasAuthenticated && previousAuthenticatedId && this.persistentAnonymousId) {
        console.log('🔄 Migrating data back from authenticated to anonymous user...')
        await this.migrateUserData(previousAuthenticatedId, this.persistentAnonymousId)
        console.log('✅ Data migrated back to anonymous user')
      }
      
      this.retryCount = 0
      this.isRetrying = false
      
      console.log('✅ Signed out, reverted to anonymous user with data preserved')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }


  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser
  }

  // Check if user is anonymous
  isAnonymous(): boolean {
    return this.currentUser?.isAnonymous || false
  }

  // Ensure profile exists in local database
  private async ensureLocalProfile(user: AuthUser): Promise<void> {
    if (!database) {
      console.log('WatermelonDB not available, skipping profile creation')
      return
    }

    const profilesCollection = database.get('profiles')
    
    try {
      // Try to find existing profile
      const existingProfile = await profilesCollection.find(user.id)
      
      // Profile exists - update it if needed
      if (user.email && (existingProfile as any).email !== user.email) {
        await database.write(async () => {
          await existingProfile.update((profile: any) => {
            profile.email = user.email
          })
        })
        console.log('✅ Updated existing profile with new email')
      } else {
        console.log('✅ Profile already exists and is up to date')
      }
    } catch (error) {
      // Profile doesn't exist - create it
      try {
        await database.write(async () => {
          await profilesCollection.create((profile: any) => {
            profile._raw.id = user.id
            profile.email = user.email || null
          })
        })
        console.log('✅ Created new profile for user')
      } catch (createError) {
        console.error('Failed to create profile:', createError)
        throw createError
      }
    }
  }

  // Clear all local data
  private async clearLocalData(): Promise<void> {
    if (!database) {
      console.log('WatermelonDB not available, skipping data clear')
      return
    }

    try {
      await database.write(async () => {
        const collections = ['profiles', 'goals', 'milestones', 'tasks']
        
        for (const collectionName of collections) {
          const collection = database!.get(collectionName)
          const allRecords = await collection.query().fetch()
          
          for (const record of allRecords) {
            await record.markAsDeleted()
          }
        }
      })
    } catch (error) {
      console.error('Error clearing local data:', error)
      throw error
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    // If Supabase is not configured, return a no-op unsubscribe function
    if (!isSupabaseConfigured || !supabase) {
      return () => {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          this.currentUser = {
            id: session.user.id,
            email: session.user.email || undefined,
            isAnonymous: session.user.is_anonymous || false,
            persistentAnonymousId: this.persistentAnonymousId || undefined
          }
          
          await this.ensureLocalProfile(this.currentUser)
          await syncService.sync()
          callback(this.currentUser)
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null
          callback(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }

  // Get current user without triggering auth flow
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  // Load persistent anonymous ID from storage
  private async loadPersistentAnonymousId(): Promise<void> {
    try {
      const storedId = await AsyncStorage.getItem(AuthService.ANONYMOUS_ID_KEY)
      
      // Validate that the stored ID is a proper UUID format
      if (storedId && this.isValidUUID(storedId)) {
        this.persistentAnonymousId = storedId
        console.log('✅ Loaded valid UUID from storage:', storedId)
      } else if (storedId) {
        // Invalid format (likely old nanoid), generate new UUID and replace it
        console.warn('⚠️ Found invalid UUID format in storage:', storedId, 'generating new UUID')
        const oldUserId = storedId
        this.persistentAnonymousId = this.generateOfflineUUID()
        await this.savePersistentAnonymousId()
        console.log('✅ Generated new UUID to replace invalid one:', this.persistentAnonymousId)
        
        // Migrate any existing local data from old user ID to new UUID
        await this.migrateUserData(oldUserId, this.persistentAnonymousId)
      }
      // If no stored ID, persistentAnonymousId remains null and will be generated when needed
    } catch (error) {
      console.error('Error loading persistent anonymous ID:', error)
    }
  }

  // Save persistent anonymous ID to storage
  private async savePersistentAnonymousId(): Promise<void> {
    if (!this.persistentAnonymousId) return
    
    try {
      await AsyncStorage.setItem(AuthService.ANONYMOUS_ID_KEY, this.persistentAnonymousId)
    } catch (error) {
      console.error('Error saving persistent anonymous ID:', error)
    }
  }

  // Upgrade anonymous account to Apple Sign-in (merge data)
  async upgradeToAppleSignIn(appleUser: any): Promise<AuthUser> {
    // Get the current user ID (could be persistentAnonymousId or currentUser.id)
    const previousUserId = this.currentUser?.id || this.persistentAnonymousId
    
    console.log('🔄 Starting Apple Sign-In upgrade...')
    console.log('📋 Previous user ID:', previousUserId)
    console.log('📋 New Apple user ID:', appleUser.id)
    
    if (!database) {
      throw new Error('Database not available for data migration')
    }

    if (!previousUserId) {
      console.warn('⚠️ No previous user ID found - skipping migration')
      this.currentUser = {
        id: appleUser.id,
        email: appleUser.email || undefined,
        isAnonymous: false,
        persistentAnonymousId: this.persistentAnonymousId || undefined
      }
      await this.ensureLocalProfile(this.currentUser)
      return this.currentUser
    }

    try {
      // Migrate all local data from anonymous user to authenticated user
      await database.write(async () => {
        for (const collectionName of USER_DATA_COLLECTIONS) {
          const collection = database!.get(collectionName)
          // CRITICAL: Use database column name 'user_id' (snake_case), not model property 'userId'
          const anonymousRecords = await collection
            .query(Q.where('user_id', previousUserId))
            .fetch()
          
          console.log(`🔍 Found ${anonymousRecords.length} ${collectionName} records to migrate`)
          
          // Update each record to use the new authenticated user ID
          for (const record of anonymousRecords) {
            await record.update(() => {
              ;(record as any).userId = appleUser.id
            })
          }
          
          console.log(`✅ Migrated ${anonymousRecords.length} ${collectionName} records to authenticated user`)
        }
      })
      
      // Only update user state after successful migration
      this.currentUser = {
        id: appleUser.id,
        email: appleUser.email || undefined,
        isAnonymous: false,
        persistentAnonymousId: this.persistentAnonymousId || undefined
      }
      
      console.log('✅ Data migration completed successfully')
    } catch (error) {
      console.error('Error migrating data to authenticated user:', error)
      // Still set user state but log the migration failure
      this.currentUser = {
        id: appleUser.id,
        email: appleUser.email || undefined,
        isAnonymous: false,
        persistentAnonymousId: this.persistentAnonymousId || undefined
      }
      console.warn('⚠️ User authenticated but data migration failed - data may be inconsistent')
    }

    // Ensure profile exists in local database
    await this.ensureLocalProfile(this.currentUser)
    
    // Trigger immediate bidirectional sync: push migrated data + pull any cloud data
    // Use longer delay to allow UI to update first (instant sign-in UX)
    setTimeout(() => {
      syncService.sync(true).catch(error => {
        console.log('Post-upgrade sync failed (non-critical):', error.message)
        // Retry once after 5 seconds if it fails
        setTimeout(() => {
          syncService.sync(true).catch(retryError => {
            console.log('Post-upgrade sync retry failed:', retryError.message)
          })
        }, 5000)
      })
    }, 2000)
    
    console.log('✅ Upgraded to Apple Sign-in with data migration, user ID:', appleUser.id)
    return this.currentUser
  }

  // Get the effective user ID for data operations
  getEffectiveUserId(): string | null {
    return this.currentUser?.id || this.persistentAnonymousId
  }

  // Delete user account and all associated data
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.getCurrentUser()
      
      if (!currentUser) {
        return { success: false, error: 'No user logged in' }
      }

      // Step 1: Delete all local data from WatermelonDB
      console.log('🗑️ Starting local data deletion...')
      
      if (database) {
        try {
          await database.write(async () => {
            // Delete all user data from local database
            // Collections with user_id field
            const userIdCollections = [
              'pomodoro_sessions',
              'task_time_tracking',
              'tasks',
              'milestones',
              'goals',
              'vision_images',
              'subscriptions',
              'subscription_usage'
            ]
            
            for (const collectionName of userIdCollections) {
              try {
                const collection = database!.get(collectionName)
                const records = await collection
                  .query(Q.where('user_id', currentUser.id))
                  .fetch()
                
                for (const record of records) {
                  await record.destroyPermanently()
                }
                
                console.log(`✅ Deleted ${records.length} records from local ${collectionName}`)
              } catch (error) {
                console.warn(`Failed to delete from ${collectionName}:`, error)
              }
            }
            
            // Handle profiles table separately (uses id as user_id)
            try {
              const profilesCollection = database!.get('profiles')
              const profiles = await profilesCollection
                .query(Q.where('id', currentUser.id))
                .fetch()
              
              for (const profile of profiles) {
                await profile.destroyPermanently()
              }
              
              console.log(`✅ Deleted ${profiles.length} records from local profiles`)
            } catch (error) {
              console.warn('Failed to delete from profiles:', error)
            }
          })
        } catch (error) {
          console.error('Error deleting local data:', error)
        }
      }

      // Step 2: Clear AsyncStorage data
      try {
        const keysToRemove = [
          'persistent_anonymous_id',
          'notifications_enabled',
          'user_preferences',
          'last_sync_timestamp',
          'notification_permission_requested',
          'scheduled_notification_morning_kickstart',
          'scheduled_notification_vision_board_reminder',
          'scheduled_notification_evening_checkin',
          'last_activity_timestamp',
          'frog_streak_data'
        ]
        
        await AsyncStorage.multiRemove(keysToRemove)
        console.log('✅ Cleared AsyncStorage data')
      } catch (error) {
        console.warn('Failed to clear AsyncStorage:', error)
      }

      // Step 3: Call Supabase Edge Function to delete server data
      if (isSupabaseConfigured && supabase && !currentUser.isAnonymous) {
        console.log('🌐 Deleting server data...')
        
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
                }
              }
            )
            
            const result = await response.json()
            
            if (!response.ok) {
              console.error('Server deletion failed:', result)
              return { 
                success: false, 
                error: result.error || 'Failed to delete server data' 
              }
            }
            
            console.log('✅ Server data deleted successfully')
          }
        } catch (error) {
          console.error('Error calling delete account function:', error)
          return { 
            success: false, 
            error: 'Failed to delete server data' 
          }
        }
      }

      // Step 4: Clear current user state
      this.currentUser = null
      this.persistentAnonymousId = null
      
      console.log('✅ Account deletion completed successfully')
      return { success: true }
      
    } catch (error) {
      console.error('Account deletion error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
