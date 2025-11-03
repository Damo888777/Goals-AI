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
        // Update all tables that have userId field
        for (const collectionName of MIGRATION_COLLECTIONS) {
          try {
            const collection = database!.get(collectionName);
            // Fix: Query using the correct WatermelonDB field name 'userId' not 'user_id'
            const records = await collection.query(Q.where('userId', oldUserId)).fetch();
            
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

    try {
      const profilesCollection = database.get('profiles')
      
      // Check if profile already exists
      try {
        await profilesCollection.find(user.id)
        return // Profile already exists
      } catch {
        // Profile doesn't exist, create it
      }

      await database.write(async () => {
        await profilesCollection.create((profile: any) => {
          profile._raw.id = user.id
          profile.email = user.email || null
        })
      })
    } catch (error) {
      console.error('Error ensuring local profile:', error)
      throw error
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
    const previousAnonymousId = this.persistentAnonymousId
    
    if (!database) {
      throw new Error('Database not available for data migration')
    }

    try {
      // Migrate all local data from anonymous user to authenticated user
      await database.write(async () => {
        for (const collectionName of USER_DATA_COLLECTIONS) {
          const collection = database!.get(collectionName)
          // Fix: Query using correct WatermelonDB field name 'userId' not 'user_id'
          const anonymousRecords = await collection
            .query(Q.where('userId', previousAnonymousId || ''))
            .fetch()
          
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
        persistentAnonymousId: previousAnonymousId || undefined
      }
      
      console.log('✅ Data migration completed successfully')
    } catch (error) {
      console.error('Error migrating data to authenticated user:', error)
      // Still set user state but log the migration failure
      this.currentUser = {
        id: appleUser.id,
        email: appleUser.email || undefined,
        isAnonymous: false,
        persistentAnonymousId: previousAnonymousId || undefined
      }
      console.warn('⚠️ User authenticated but data migration failed - data may be inconsistent')
    }

    // Ensure profile exists in local database
    await this.ensureLocalProfile(this.currentUser)
    
    // Trigger immediate bidirectional sync: push migrated data + pull any cloud data
    setTimeout(() => {
      syncService.sync(true).catch(error => {
        console.log('Post-upgrade sync failed (non-critical):', error.message)
      })
    }, 1000)
    
    console.log('✅ Upgraded to Apple Sign-in with data migration, user ID:', appleUser.id)
    return this.currentUser
  }

  // Get the effective user ID for data operations
  getEffectiveUserId(): string | null {
    return this.currentUser?.id || this.persistentAnonymousId
  }
}

// Export singleton instance
export const authService = new AuthService()
