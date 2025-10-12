import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncService } from './syncService'
import database from '../db'

export interface AuthUser {
  id: string
  email?: string
  isAnonymous: boolean
}

class AuthService {
  private currentUser: AuthUser | null = null
  private retryCount: number = 0
  private maxRetries: number = 3
  private isRetrying: boolean = false

  // Initialize authentication - check for existing session
  async initialize(): Promise<AuthUser | null> {
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
          isAnonymous: user.is_anonymous || false
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
      
      return null
    } catch (error) {
      console.error('Error initializing auth:', error)
      // Fallback to offline mode
      return this.createOfflineUser()
    }
  }

  // Sign in anonymously (guest mode)
  async signInAnonymously(): Promise<AuthUser> {
    // Prevent infinite retry loop
    if (this.isRetrying) {
      console.log('🔄 Auth retry already in progress, skipping...')
      return this.currentUser || this.createOfflineUser()
    }

    // If Supabase is not configured, create offline user
    if (!isSupabaseConfigured) {
      console.log('🔄 Creating offline user - Supabase not configured')
      return this.createOfflineUser()
    }

    // Check retry limit
    if (this.retryCount >= this.maxRetries) {
      console.log('🔄 Max retries reached, falling back to offline mode')
      return this.createOfflineUser()
    }

    this.isRetrying = true
    this.retryCount++

    try {
      const { data, error } = await supabase!.auth.signInAnonymously()
      
      if (error) throw error
      if (!data.user) throw new Error('No user returned from anonymous sign in')

      this.currentUser = {
        id: data.user.id,
        email: undefined,
        isAnonymous: true
      }

      // Reset retry count on success
      this.retryCount = 0
      this.isRetrying = false

      // Create profile in local database
      await this.ensureLocalProfile(this.currentUser)
      
      // Trigger initial sync
      await syncService.sync()

      return this.currentUser
    } catch (error) {
      this.isRetrying = false
      console.error(`Error signing in anonymously (attempt ${this.retryCount}/${this.maxRetries}):`, error)
      
      // If we've reached max retries, fall back to offline mode
      if (this.retryCount >= this.maxRetries) {
        console.log('🔄 Falling back to offline mode')
        return this.createOfflineUser()
      }
      
      throw error
    }
  }

  // Create offline user for when Supabase is unavailable
  private async createOfflineUser(): Promise<AuthUser> {
    const offlineUserId = 'offline-user-' + Date.now()
    
    this.currentUser = {
      id: offlineUserId,
      email: undefined,
      isAnonymous: true
    }

    // Create profile in local database
    await this.ensureLocalProfile(this.currentUser)
    
    console.log('✅ Created offline user:', offlineUserId)
    return this.currentUser
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      // Clear local database
      await this.clearLocalData()
      
      // Sign out from Supabase (only if configured)
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }

      this.currentUser = null
      this.retryCount = 0
      this.isRetrying = false
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

  // Future: Upgrade anonymous account to Apple Sign-in
  async upgradeToAppleSignIn(): Promise<AuthUser> {
    // This will be implemented when Apple Sign-in is added
    throw new Error('Apple Sign-in not yet implemented')
  }
}

// Export singleton instance
export const authService = new AuthService()
