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
        const transformedGoals = changes.goals.created.map(this.transformLocalToSupabase.bind(this))
        console.log('Pushing goals:', transformedGoals.length)
        
        const { error } = await supabase
          .from('goals')
          .upsert(transformedGoals, { onConflict: 'id' })
        if (error) {
          console.error('Error pushing goals:', error)
          throw error
        }
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
        const transformedMilestones = changes.milestones.created.map(this.transformLocalToSupabase.bind(this))
        console.log('Pushing milestones:', transformedMilestones.length)
        
        const { error } = await supabase
          .from('milestones')
          .upsert(transformedMilestones, { onConflict: 'id' })
        if (error) {
          console.error('Error pushing milestones:', error)
          throw error
        }
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
        const transformedTasks = changes.tasks.created.map(this.transformLocalToSupabase.bind(this))
        console.log('Pushing tasks:', transformedTasks.length)
        
        const { error } = await supabase
          .from('tasks')
          .upsert(transformedTasks, { onConflict: 'id' })
        if (error) {
          console.error('Error pushing tasks:', error)
          throw error
        }
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
    const base = {
      id: record.id,
      created_at: new Date(record.createdAt).toISOString(),
      updated_at: new Date(record.updatedAt).toISOString(),
    }

    // Handle profile records
    if (record.email !== undefined) {
      return {
        ...base,
        email: record.email
      }
    }

    // Handle goal records (check for goal-specific fields)
    if (record.table === 'goals' || (record.title !== undefined && (record.feelingsArray !== undefined || record.feelings !== undefined || record.visionImageUrl !== undefined))) {
      return {
        ...base,
        user_id: record.userId,
        title: record.title,
        feelings: JSON.stringify(record.feelingsArray || record.feelings || []),
        vision_image_url: record.visionImageUrl || null,
        notes: record.notes || null,
        is_completed: record.isCompleted || false,
        completed_at: record.completedAt ? new Date(record.completedAt).toISOString() : null,
        creation_source: record.creationSource || 'manual'
      }
    }

    // Handle task records first (more specific detection)
    if (record.table === 'tasks' || (record.title !== undefined && record.isComplete !== undefined && (record.isFrog !== undefined || record.scheduledDate !== undefined || record.milestoneId !== undefined))) {
      return {
        ...base,
        user_id: record.userId,
        goal_id: record.goalId || null,
        milestone_id: record.milestoneId || null,
        title: record.title,
        notes: record.notes || null,
        scheduled_date: record.scheduledDate || null,
        is_frog: record.isFrog || false,
        is_complete: record.isComplete || false,
        completed_at: record.completedAt ? new Date(record.completedAt).toISOString() : null,
        creation_source: record.creationSource || 'manual'
      }
    }

    // Handle milestone records
    if (record.table === 'milestones' || (record.title !== undefined && record.goalId !== undefined && record.isComplete !== undefined)) {
      return {
        ...base,
        user_id: record.userId,
        goal_id: record.goalId,
        title: record.title,
        target_date: record.targetDate || null,
        is_complete: record.isComplete || false,
        creation_source: record.creationSource || 'manual'
      }
    }

    // Fallback for unknown record types (basic fields only)
    return {
      ...base,
      user_id: record.userId,
      title: record.title || null,
      notes: record.notes || null,
      creation_source: record.creationSource || 'manual'
    }
  }

  // Get local changes that need to be synced
  private async getLocalChanges(): Promise<SyncPushChanges> {
    const userId = await this.getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Get the last sync timestamp
    const lastSyncTime = await this.database.adapter.getLocal('last_sync_timestamp') || 0
    const lastSyncDate = new Date(lastSyncTime)

    try {
      // Get all records modified since last sync
      const profilesCollection = this.database.get('profiles')
      const goalsCollection = this.database.get('goals') 
      const milestonesCollection = this.database.get('milestones')
      const tasksCollection = this.database.get('tasks')

      // Get all records for this user (since we don't have complex sync state tracking)
      const [profiles, goals, milestones, tasks] = await Promise.all([
        profilesCollection.query().fetch(),
        goalsCollection.query().fetch(),
        milestonesCollection.query().fetch(), 
        tasksCollection.query().fetch()
      ])

      // Filter to only user's records and unsynchronized ones
      const userProfiles = profiles.filter(p => (p as any).userId === userId || (p as any).id === userId)
      const userGoals = goals.filter(g => (g as any).userId === userId)
      const userMilestones = milestones.filter(m => (m as any).userId === userId)
      const userTasks = tasks.filter(t => (t as any).userId === userId)

      // For simplicity, treat all local records as "created" since we're doing push-only sync
      // In a full implementation, you'd track sync state per record
      return {
        profiles: {
          created: userProfiles,
          updated: [],
          deleted: []
        },
        goals: {
          created: userGoals,
          updated: [],
          deleted: []
        },
        milestones: {
          created: userMilestones,
          updated: [],
          deleted: []
        },
        tasks: {
          created: userTasks,
          updated: [],
          deleted: []
        }
      }
    } catch (error) {
      console.error('Error getting local changes:', error)
      throw error
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
      console.log('Starting sync to Supabase...')
      
      // Get local changes
      const changes = await this.getLocalChanges()
      
      if (this.hasChangesToPush(changes)) {
        console.log('Found local changes to push:', {
          profiles: changes.profiles.created.length,
          goals: changes.goals.created.length,
          milestones: changes.milestones.created.length,
          tasks: changes.tasks.created.length
        })
        
        await this.pushChanges(changes)
        
        // Update last sync timestamp
        await this.database.adapter.setLocal('last_sync_timestamp', Date.now().toString())
        
        console.log('✅ Local changes successfully synced to Supabase')
      } else {
        console.log('No local changes found to push')
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
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
  // First check if we have an authenticated user via authService
  const { authService } = await import('./authService')
  const currentUser = authService.getCurrentUser()
  
  if (currentUser) {
    return currentUser.id
  }
  
  // Fallback to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  }
  
  // If no user found, try to initialize auth
  try {
    const user = await authService.initialize()
    return user?.id || null
  } catch (error) {
    console.error('Failed to get user ID:', error)
    return null
  }
}
