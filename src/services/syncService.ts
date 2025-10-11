import { Database } from '@nozbe/watermelondb'
import { synchronize } from '@nozbe/watermelondb/sync'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
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
    if (!isSupabaseConfigured || !supabase) return false
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  }

  // Pull changes from Supabase
  private async pullChanges(lastPulledAt?: number): Promise<SyncPullResult> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    const userId = await this.getCurrentUserId()
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
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    const userId = await this.getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      // Push profiles
      if (changes.profiles?.created?.length > 0) {
        const { error } = await supabase
          .from('profiles')
          .upsert(changes.profiles.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.profiles?.updated?.length > 0) {
        for (const profile of changes.profiles.updated) {
          const { error } = await supabase
            .from('profiles')
            .update(this.transformLocalToSupabase(profile))
            .eq('id', profile.id)
          if (error) throw error
        }
      }

      // Push goals
      if (changes.goals?.created?.length > 0) {
        const { error } = await supabase
          .from('goals')
          .upsert(changes.goals.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.goals?.updated?.length > 0) {
        for (const goal of changes.goals.updated) {
          const { error } = await supabase
            .from('goals')
            .update(this.transformLocalToSupabase(goal))
            .eq('id', goal.id)
          if (error) throw error
        }
      }

      if (changes.goals?.deleted?.length > 0) {
        const { error } = await supabase
          .from('goals')
          .delete()
          .in('id', changes.goals.deleted)
        if (error) throw error
      }

      // Push milestones
      if (changes.milestones?.created?.length > 0) {
        const { error } = await supabase
          .from('milestones')
          .upsert(changes.milestones.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.milestones?.updated?.length > 0) {
        for (const milestone of changes.milestones.updated) {
          const { error } = await supabase
            .from('milestones')
            .update(this.transformLocalToSupabase(milestone))
            .eq('id', milestone.id)
          if (error) throw error
        }
      }

      if (changes.milestones?.deleted?.length > 0) {
        const { error } = await supabase
          .from('milestones')
          .delete()
          .in('id', changes.milestones.deleted)
        if (error) throw error
      }

      // Push tasks
      if (changes.tasks?.created?.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .upsert(changes.tasks.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (changes.tasks?.updated?.length > 0) {
        for (const task of changes.tasks.updated) {
          const { error } = await supabase
            .from('tasks')
            .update(this.transformLocalToSupabase(task))
            .eq('id', task.id)
          if (error) throw error
        }
      }

      if (changes.tasks?.deleted?.length > 0) {
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

  // Transform Supabase row to local format
  private transformSupabaseToLocal(row: any): any {
    return {
      ...row,
      // Convert snake_case to camelCase for local models
      userId: row.user_id,
      goalId: row.goal_id,
      milestoneId: row.milestone_id,
      visionImageUrl: row.vision_image_url,
      isCompleted: row.is_completed,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      targetDate: row.target_date,
      isComplete: row.is_complete,
      scheduledDate: row.scheduled_date,
      isFrog: row.is_frog,
      creationSource: row.creation_source,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  // Transform WatermelonDB data to Supabase format
  private transformLocalToSupabase(record: any): any {
    return {
      ...record,
      user_id: record.userId,
      goal_id: record.goalId,
      milestone_id: record.milestoneId,
      vision_image_url: record.visionImageUrl,
      is_completed: record.isCompleted,
      completed_at: record.completedAt?.toISOString(),
      target_date: record.targetDate,
      is_complete: record.isComplete,
      scheduled_date: record.scheduledDate,
      is_frog: record.isFrog,
      creation_source: record.creationSource || 'manual',
      created_at: new Date(record.createdAt).toISOString(),
      updated_at: new Date(record.updatedAt).toISOString(),
    }
  }

  // Push-only sync for offline-first architecture
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...')
      return
    }

    if (!this.isOnline) {
      console.log('Device is offline, skipping sync...')
      return
    }

    // Skip sync if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, skipping sync...')
      return
    }

    if (!(await this.isAuthenticated())) {
      console.log('User not authenticated, skipping sync...')
      return
    }

    this.syncInProgress = true

    try {
      // Push-only sync - no pulling from server
      console.log('Pushing local changes to Supabase...')
      
      // Get pending changes from WatermelonDB
      const changes = await this.database.adapter.getLocal('sync_changes') || {
        profiles: { created: [], updated: [], deleted: [] },
        goals: { created: [], updated: [], deleted: [] },
        milestones: { created: [], updated: [], deleted: [] },
        tasks: { created: [], updated: [], deleted: [] }
      }
      
      if (this.hasChangesToPush(changes)) {
        await this.pushChanges(changes as SyncPushChanges)
        console.log('Local changes pushed to Supabase')
      } else {
        console.log('No local changes to push')
      }
    } catch (error) {
      console.error('Push sync failed:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  // Check if there are any changes to push
  private hasChangesToPush(changes: any): boolean {
    return Object.values(changes).some((table: any) => 
      table.created?.length > 0 || table.updated?.length > 0 || table.deleted?.length > 0
    )
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
export const syncService = new SyncService(database!)

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured || !supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}
