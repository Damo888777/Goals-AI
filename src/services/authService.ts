import { supabase } from '../lib/supabase'
import { syncService } from './syncService'
import database from '../db'

export interface AuthUser {
  id: string
  email?: string
  isAnonymous: boolean
}

class AuthService {
  private currentUser: AuthUser | null = null

  // Initialize authentication - check for existing session
  async initialize(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        this.currentUser = {
          id: user.id,
          email: user.email || undefined,
          isAnonymous: user.is_anonymous || false
        }
        
        // Ensure profile exists in local database
        await this.ensureLocalProfile(this.currentUser)
        
        // Trigger initial sync
        await syncService.sync()
        
        return this.currentUser
      }
      
      return null
    } catch (error) {
      console.error('Error initializing auth:', error)
      return null
    }
  }

  // Sign in anonymously (guest mode)
  async signInAnonymously(): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) throw error
      if (!data.user) throw new Error('No user returned from anonymous sign in')

      this.currentUser = {
        id: data.user.id,
        email: undefined,
        isAnonymous: true
      }

      // Create profile in local database
      await this.ensureLocalProfile(this.currentUser)
      
      // Trigger initial sync
      await syncService.sync()

      return this.currentUser
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      throw error
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      // Clear local database
      await this.clearLocalData()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      this.currentUser = null
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser
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
    try {
      await database.write(async () => {
        const collections = ['profiles', 'goals', 'milestones', 'tasks']
        
        for (const collectionName of collections) {
          const collection = database.get(collectionName)
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

  // Future: Upgrade anonymous account to Apple Sign-in
  async upgradeToAppleSignIn(): Promise<AuthUser> {
    // This will be implemented when Apple Sign-in is added
    throw new Error('Apple Sign-in not yet implemented')
  }
}

// Export singleton instance
export const authService = new AuthService()
