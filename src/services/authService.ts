import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncService } from './syncService'
import database from '../db'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Q } from '@nozbe/watermelondb'

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
      this.persistentAnonymousId = 'offline-user-' + Date.now()
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

  // Sign out from authenticated session but maintain anonymous user
  async signOut(): Promise<void> {
    try {
      // Sign out from Supabase (only if configured)
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }

      // Don't clear local data - keep it for anonymous user
      // Instead, revert to anonymous user
      await this.ensureAnonymousUser()
      
      this.retryCount = 0
      this.isRetrying = false
      
      console.log('✅ Signed out, reverted to anonymous user')
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
            isAnonymous: session.user.is_anonymous || false
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
      this.persistentAnonymousId = await AsyncStorage.getItem(AuthService.ANONYMOUS_ID_KEY)
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
        const collections = ['goals', 'milestones', 'tasks', 'vision_images']
        
        for (const collectionName of collections) {
          const collection = database!.get(collectionName)
          const anonymousRecords = await collection
            .query(Q.where('user_id', previousAnonymousId || ''))
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
    } catch (error) {
      console.error('Error migrating data to authenticated user:', error)
      // Don't throw - allow sign-in to continue even if migration fails
    }

    this.currentUser = {
      id: appleUser.id,
      email: appleUser.email || undefined,
      isAnonymous: false,
      persistentAnonymousId: previousAnonymousId || undefined
    }

    // Ensure profile exists in local database
    await this.ensureLocalProfile(this.currentUser)
    
    // Trigger immediate sync to upload migrated data to cloud
    setTimeout(() => {
      syncService.sync().catch(error => {
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
