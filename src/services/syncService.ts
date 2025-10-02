import { Database } from '@nozbe/watermelondb'
import { synchronize } from '@nozbe/watermelondb/sync'
import { supabase } from '../lib/supabase'
import database from '../db'

interface SyncPullResult {
  changes: {
    profiles: any[]
    goals: any[]
    milestones: any[]
    tasks: any[]
  }
  timestamp: number
}

interface SyncPushChanges {
  profiles: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  goals: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  milestones: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  tasks: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
}

class SyncService {
  private database: Database
  private isOnline: boolean = true
  private syncInProgress: boolean = false

  constructor(db: Database) {
    this.database = db
  }

  // Check if user is authenticated
  private async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  }

  // Pull changes from Supabase
  private async pullChanges(lastPulledAt?: number): Promise<SyncPullResult> {
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const timestamp = Date.now()
    const changes = {
      profiles: [] as any[],
      goals: [] as any[],
      milestones: [] as any[],
      tasks: [] as any[]
    }

    // Build timestamp filter for incremental sync
    const timestampFilter = lastPulledAt 
      ? `updated_at.gt.${new Date(lastPulledAt).toISOString()}`
      : undefined

    try {
      // Pull profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .order('updated_at', { ascending: true })

      if (profiles) {
        changes.profiles = profiles.map(this.transformSupabaseToLocal) as any[]
      }

      // Pull goals
      let goalsQuery = supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true })

      if (timestampFilter) {
        goalsQuery = goalsQuery.filter('updated_at', 'gt', new Date(lastPulledAt!).toISOString())
      }

      const { data: goals } = await goalsQuery
      if (goals) {
        changes.goals = goals.map(this.transformSupabaseToLocal) as any[]
      }

      // Pull milestones
      let milestonesQuery = supabase
        .from('milestones')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true })

      if (timestampFilter) {
        milestonesQuery = milestonesQuery.filter('updated_at', 'gt', new Date(lastPulledAt!).toISOString())
      }

      const { data: milestones } = await milestonesQuery
      if (milestones) {
        changes.milestones = milestones.map(this.transformSupabaseToLocal) as any[]
      }

      // Pull tasks
      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true })

      if (timestampFilter) {
        tasksQuery = tasksQuery.filter('updated_at', 'gt', new Date(lastPulledAt!).toISOString())
      }

      const { data: tasks } = await tasksQuery
      if (tasks) {
        changes.tasks = tasks.map(this.transformSupabaseToLocal) as any[]
      }

      return { changes, timestamp }
    } catch (error) {
      console.error('Error pulling changes:', error)
      throw error
    }
  }

  // Push changes to Supabase
  private async pushChanges(changes: SyncPushChanges): Promise<void> {
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      // Push profiles
      if (changes.profiles.created.length > 0) {
        const { error } = await supabase
          .from('profiles')
          .upsert(changes.profiles.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.profiles.updated.length > 0) {
        for (const profile of changes.profiles.updated) {
          const { error } = await supabase
            .from('profiles')
            .update(this.transformLocalToSupabase(profile))
            .eq('id', profile.id)
          if (error) throw error
        }
      }

      // Push goals
      if (changes.goals.created.length > 0) {
        const { error } = await supabase
          .from('goals')
          .upsert(changes.goals.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.goals.updated.length > 0) {
        for (const goal of changes.goals.updated) {
          const { error } = await supabase
            .from('goals')
            .update(this.transformLocalToSupabase(goal))
            .eq('id', goal.id)
          if (error) throw error
        }
      }

      if (changes.goals.deleted.length > 0) {
        const { error } = await supabase
          .from('goals')
          .delete()
          .in('id', changes.goals.deleted)
        if (error) throw error
      }

      // Push milestones
      if (changes.milestones.created.length > 0) {
        const { error } = await supabase
          .from('milestones')
          .upsert(changes.milestones.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.milestones.updated.length > 0) {
        for (const milestone of changes.milestones.updated) {
          const { error } = await supabase
            .from('milestones')
            .update(this.transformLocalToSupabase(milestone))
            .eq('id', milestone.id)
          if (error) throw error
        }
      }

      if (changes.milestones.deleted.length > 0) {
        const { error } = await supabase
          .from('milestones')
          .delete()
          .in('id', changes.milestones.deleted)
        if (error) throw error
      }

      // Push tasks
      if (changes.tasks.created.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .upsert(changes.tasks.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.tasks.updated.length > 0) {
        for (const task of changes.tasks.updated) {
          const { error } = await supabase
            .from('tasks')
            .update(this.transformLocalToSupabase(task))
            .eq('id', task.id)
          if (error) throw error
        }
      }

      if (changes.tasks.deleted.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .in('id', changes.tasks.deleted)
        if (error) throw error
      }

    } catch (error) {
      console.error('Error pushing changes:', error)
      throw error
    }
  }

  // Transform Supabase data to WatermelonDB format
  private transformSupabaseToLocal(record: any): any {
    return {
      ...record,
      created_at: new Date(record.created_at).getTime(),
      updated_at: new Date(record.updated_at).getTime(),
    }
  }

  // Transform WatermelonDB data to Supabase format
  private transformLocalToSupabase(record: any): any {
    return {
      ...record,
      created_at: new Date(record.created_at).toISOString(),
      updated_at: new Date(record.updated_at).toISOString(),
    }
  }

  // Main sync function
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...')
      return
    }

    if (!this.isOnline) {
      console.log('Device is offline, skipping sync...')
      return
    }

    if (!(await this.isAuthenticated())) {
      console.log('User not authenticated, skipping sync...')
      return
    }

    this.syncInProgress = true

    try {
      await synchronize({
        database: this.database,
        pullChanges: async ({ lastPulledAt }) => {
          console.log('Pulling changes from Supabase...')
          return await this.pullChanges(lastPulledAt)
        },
        pushChanges: async ({ changes }) => {
          console.log('Pushing changes to Supabase...')
          await this.pushChanges(changes as SyncPushChanges)
        },
        migrationsEnabledAtVersion: 1,
      })

      console.log('Sync completed successfully')
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  // Set online/offline status
  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline
  }

  // Check if sync is in progress
  get isSyncing(): boolean {
    return this.syncInProgress
  }
}

// Export singleton instance
export const syncService = new SyncService(database)

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}
