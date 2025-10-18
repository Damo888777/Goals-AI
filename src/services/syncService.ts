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
    vision_images: any[]
    pomodoro_sessions: any[]
    task_time_tracking: any[]
    subscriptions: any[]
    subscription_usage: any[]
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
  vision_images: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  pomodoro_sessions: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  task_time_tracking: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  subscriptions: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  subscription_usage: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
}

class SyncService {
  private database: Database
  private isOnline: boolean = true
  private syncInProgress: boolean = false
  private lastSyncTime: Date | null = null
  private syncCooldown: number = 5000 // 5 seconds between syncs
  private pendingSyncTimeout: NodeJS.Timeout | null = null

  constructor(db: Database) {
    this.database = db
  }

  // Check if user is authenticated (not anonymous)
  private async isAuthenticated(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false
    const { data: { user } } = await supabase.auth.getUser()
    // Only return true for real authenticated users, not anonymous
    return !!user && !user.is_anonymous
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
      tasks: [] as any[],
      vision_images: [] as any[],
      pomodoro_sessions: [] as any[],
      task_time_tracking: [] as any[],
      subscriptions: [] as any[],
      subscription_usage: [] as any[]
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

      changes.profiles = (profiles && Array.isArray(profiles)) 
        ? profiles.map(this.transformSupabaseToLocal) 
        : []

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
      changes.goals = (goals && Array.isArray(goals)) 
        ? goals.map(this.transformSupabaseToLocal) 
        : []

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
      changes.milestones = (milestones && Array.isArray(milestones)) 
        ? milestones.map(this.transformSupabaseToLocal) 
        : []

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
      changes.tasks = (tasks && Array.isArray(tasks)) 
        ? tasks.map(this.transformSupabaseToLocal) 
        : []

      // Pull subscriptions
      let subscriptionsQuery = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true })

      if (timestampFilter) {
        subscriptionsQuery = subscriptionsQuery.filter('updated_at', 'gt', new Date(lastPulledAt!).toISOString())
      }

      const { data: subscriptions } = await subscriptionsQuery
      changes.subscriptions = (subscriptions && Array.isArray(subscriptions)) 
        ? subscriptions.map(this.transformSupabaseToLocal) 
        : []

      // Pull subscription usage
      let subscriptionUsageQuery = supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true })

      if (timestampFilter) {
        subscriptionUsageQuery = subscriptionUsageQuery.filter('updated_at', 'gt', new Date(lastPulledAt!).toISOString())
      }

      const { data: subscriptionUsage } = await subscriptionUsageQuery
      changes.subscription_usage = (subscriptionUsage && Array.isArray(subscriptionUsage)) 
        ? subscriptionUsage.map(this.transformSupabaseToLocal) 
        : []

      // Initialize remaining tables as empty arrays (these tables don't sync from Supabase)
      changes.vision_images = []
      changes.pomodoro_sessions = []
      changes.task_time_tracking = []

      return { changes, timestamp }
    } catch (error) {
      console.error('Error pulling changes:', error)
      throw error
    }
  }

  // Push changes to Supabase
  private async pushChanges(changes: SyncPushChanges): Promise<void> {
    console.log('🔍 [SYNC DEBUG] pushChanges - entry point, changes:', changes)
    
    if (!isSupabaseConfigured || !supabase) {
      console.log('🔍 [SYNC DEBUG] pushChanges - Supabase not configured')
      throw new Error('Supabase not configured')
    }

    console.log('🔍 [SYNC DEBUG] pushChanges - getting current user ID...')
    const userId = await this.getCurrentUserId()
    console.log('🔍 [SYNC DEBUG] pushChanges - userId:', userId)
    
    if (!userId) {
      console.log('🔍 [SYNC DEBUG] pushChanges - User not authenticated')
      throw new Error('User not authenticated')
    }

    // Validate changes structure and ensure all arrays are defined
    if (!changes || typeof changes !== 'object') {
      console.warn('⚠️ Invalid changes object received:', changes)
      return
    }

    // Ensure all table changes have proper structure with empty arrays as fallback
    const safeChanges = {
      profiles: changes.profiles || { created: [], updated: [], deleted: [] },
      goals: changes.goals || { created: [], updated: [], deleted: [] },
      milestones: changes.milestones || { created: [], updated: [], deleted: [] },
      tasks: changes.tasks || { created: [], updated: [], deleted: [] },
      vision_images: changes.vision_images || { created: [], updated: [], deleted: [] },
      pomodoro_sessions: changes.pomodoro_sessions || { created: [], updated: [], deleted: [] },
      task_time_tracking: changes.task_time_tracking || { created: [], updated: [], deleted: [] },
      subscriptions: changes.subscriptions || { created: [], updated: [], deleted: [] },
      subscription_usage: changes.subscription_usage || { created: [], updated: [], deleted: [] }
    }

    // Ensure each table's arrays are properly initialized
    Object.keys(safeChanges).forEach(table => {
      const tableChanges = safeChanges[table as keyof typeof safeChanges]
      if (!tableChanges.created || !Array.isArray(tableChanges.created)) {
        tableChanges.created = []
      }
      if (!tableChanges.updated || !Array.isArray(tableChanges.updated)) {
        tableChanges.updated = []
      }
      if (!tableChanges.deleted || !Array.isArray(tableChanges.deleted)) {
        tableChanges.deleted = []
      }
    })

    try {
      // Push profiles
      if (safeChanges.profiles.created.length > 0) {
        const { error } = await supabase
          .from('profiles')
          .upsert(safeChanges.profiles.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (safeChanges.profiles.updated.length > 0) {
        for (const profile of safeChanges.profiles.updated) {
          const { error } = await supabase
            .from('profiles')
            .update(this.transformLocalToSupabase(profile))
            .eq('id', profile.id)
          if (error) throw error
        }
      }

      // Push goals
      if (safeChanges.goals.created.length > 0) {
        const transformedGoals = safeChanges.goals.created.map(this.transformLocalToSupabase.bind(this))
        console.log('Pushing goals:', transformedGoals.length)
        
        const { error } = await supabase
          .from('goals')
          .upsert(transformedGoals, { onConflict: 'id' })
        if (error) {
          console.error('Error pushing goals:', error)
          throw error
        }
      }

      if (safeChanges.goals.updated.length > 0) {
        for (const goal of safeChanges.goals.updated) {
          const { error } = await supabase
            .from('goals')
            .update(this.transformLocalToSupabase(goal))
            .eq('id', goal.id)
          if (error) throw error
        }
      }

      if (safeChanges.goals.deleted.length > 0) {
        const { error } = await supabase
          .from('goals')
          .delete()
          .in('id', safeChanges.goals.deleted)
        if (error) throw error
      }

      // Push milestones
      if (safeChanges.milestones.created.length > 0) {
        const transformedMilestones = safeChanges.milestones.created.map(this.transformLocalToSupabase.bind(this))
        console.log('Pushing milestones:', transformedMilestones.length)
        
        const { error } = await supabase
          .from('milestones')
          .upsert(transformedMilestones, { onConflict: 'id' })
        if (error) {
          console.error('Error pushing milestones:', error)
          throw error
        }
      }

      if (safeChanges.milestones.updated.length > 0) {
        for (const milestone of safeChanges.milestones.updated) {
          const { error } = await supabase
            .from('milestones')
            .update(this.transformLocalToSupabase(milestone))
            .eq('id', milestone.id)
          if (error) throw error
        }
      }

      if (safeChanges.milestones.deleted.length > 0) {
        const { error } = await supabase
          .from('milestones')
          .delete()
          .in('id', safeChanges.milestones.deleted)
        if (error) throw error
      }

      // Push tasks
      if (safeChanges.tasks.created.length > 0) {
        const transformedTasks = safeChanges.tasks.created.map(this.transformLocalToSupabase.bind(this))
        console.log('Pushing tasks:', transformedTasks.length)
        
        const { error } = await supabase
          .from('tasks')
          .upsert(transformedTasks, { onConflict: 'id' })
        if (error) {
          console.error('Error pushing tasks:', error)
          throw error
        }
      }

      if (safeChanges.tasks.updated.length > 0) {
        for (const task of safeChanges.tasks.updated) {
          const { error } = await supabase
            .from('tasks')
            .update(this.transformLocalToSupabase(task))
            .eq('id', task.id)
          if (error) throw error
        }
      }

      if (safeChanges.tasks.deleted.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .in('id', safeChanges.tasks.deleted)
        if (error) throw error
      }

      // Push subscriptions (usually managed by RevenueCat, but sync for consistency)
      if (safeChanges.subscriptions.created.length > 0) {
        const { error } = await supabase
          .from('subscriptions')
          .upsert(safeChanges.subscriptions.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (safeChanges.subscriptions.updated.length > 0) {
        for (const subscription of safeChanges.subscriptions.updated) {
          const { error } = await supabase
            .from('subscriptions')
            .update(this.transformLocalToSupabase(subscription))
            .eq('id', subscription.id)
          if (error) throw error
        }
      }

      // Push subscription usage
      if (safeChanges.subscription_usage.created.length > 0) {
        const { error } = await supabase
          .from('subscription_usage')
          .upsert(safeChanges.subscription_usage.created.map(this.transformLocalToSupabase))
        if (error) throw error
      }

      if (safeChanges.subscription_usage.updated.length > 0) {
        for (const usage of safeChanges.subscription_usage.updated) {
          const { error } = await supabase
            .from('subscription_usage')
            .update(this.transformLocalToSupabase(usage))
            .eq('id', usage.id)
          if (error) throw error
        }
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
      created_at: record.createdAt,
      updated_at: record.updatedAt,
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
        completed_at: record.completedAt ? (record.completedAt instanceof Date ? record.completedAt.getTime() : new Date(record.completedAt).getTime()) : null,
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
        completed_at: record.completedAt ? (record.completedAt instanceof Date ? record.completedAt.getTime() : new Date(record.completedAt).getTime()) : null,
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
      const subscriptionsCollection = this.database.get('subscriptions')
      const subscriptionUsageCollection = this.database.get('subscription_usage')

      const [profiles, goals, milestones, tasks, subscriptions, subscriptionUsage] = await Promise.all([
        profilesCollection.query().fetch(),
        goalsCollection.query().fetch(),
        milestonesCollection.query().fetch(), 
        tasksCollection.query().fetch(),
        subscriptionsCollection.query().fetch(),
        subscriptionUsageCollection.query().fetch()
      ])

      // Filter to only user's records and unsynchronized ones
      const userProfiles = profiles.filter(p => (p as any).userId === userId || (p as any).id === userId)
      const userGoals = goals.filter(g => (g as any).userId === userId)
      const userMilestones = milestones.filter(m => (m as any).userId === userId)
      const userTasks = tasks.filter(t => (t as any).userId === userId)
      const userSubscriptions = subscriptions.filter(s => (s as any).userId === userId)
      const userSubscriptionUsage = subscriptionUsage.filter(u => (u as any).userId === userId)

      // For simplicity, treat all local records as "created" since we're doing push-only sync
      // In a full implementation, you'd track sync state per record
      return {
        profiles: {
          created: Array.isArray(userProfiles) ? userProfiles : [],
          updated: [],
          deleted: []
        },
        goals: {
          created: Array.isArray(userGoals) ? userGoals : [],
          updated: [],
          deleted: []
        },
        milestones: {
          created: Array.isArray(userMilestones) ? userMilestones : [],
          updated: [],
          deleted: []
        },
        tasks: {
          created: Array.isArray(userTasks) ? userTasks : [],
          updated: [],
          deleted: []
        },
        vision_images: {
          created: [],
          updated: [],
          deleted: []
        },
        pomodoro_sessions: {
          created: [],
          updated: [],
          deleted: []
        },
        task_time_tracking: {
          created: [],
          updated: [],
          deleted: []
        },
        subscriptions: {
          created: Array.isArray(userSubscriptions) ? userSubscriptions : [],
          updated: [],
          deleted: []
        },
        subscription_usage: {
          created: Array.isArray(userSubscriptionUsage) ? userSubscriptionUsage : [],
          updated: [],
          deleted: []
        }
      }
    } catch (error) {
      console.error('Error getting local changes:', error)
      throw error
    }
  }

  // Main sync function with intelligent scheduling and error handling
  async sync(force: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('⏭️ Skipping sync - Supabase not configured')
      return
    }

    if (this.syncInProgress) {
      console.log('⏭️ Sync already in progress, skipping')
      return
    }

    // Check cooldown period unless forced
    if (!force && this.lastSyncTime) {
      const timeSinceLastSync = Date.now() - this.lastSyncTime.getTime()
      if (timeSinceLastSync < this.syncCooldown) {
        console.log(`⏭️ Sync cooldown active (${Math.round((this.syncCooldown - timeSinceLastSync) / 1000)}s remaining)`)
        return
      }
    }

    const isAuth = await this.isAuthenticated()
    
    // For anonymous users: push-only sync (no pulling)
    if (!isAuth) {
      console.log('🔄 Anonymous user - push-only sync (no pulling from Supabase)')
      await this.pushOnlySync()
      return
    }

    this.syncInProgress = true
    console.log('🔄 Starting sync...')

    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        await synchronize({
          database: this.database,
          pullChanges: async ({ lastPulledAt }) => {
            try {
              const result = await this.pullChanges(lastPulledAt)
              console.log('🔄 Pull changes result:', {
                timestamp: result.timestamp,
                profiles: result.changes?.profiles?.length || 0,
                goals: result.changes?.goals?.length || 0,
                milestones: result.changes?.milestones?.length || 0,
                tasks: result.changes?.tasks?.length || 0,
                vision_images: result.changes?.vision_images?.length || 0,
                pomodoro_sessions: result.changes?.pomodoro_sessions?.length || 0,
                task_time_tracking: result.changes?.task_time_tracking?.length || 0,
                subscriptions: result.changes?.subscriptions?.length || 0,
                subscription_usage: result.changes?.subscription_usage?.length || 0
              })
              return result
            } catch (error) {
              console.error('❌ Error in pullChanges:', error)
              throw error
            }
          },
          pushChanges: async ({ changes, lastPulledAt }) => {
            try {
              console.log('🔍 [SYNC DEBUG] Raw changes object:', JSON.stringify(changes, null, 2))
              console.log('🔍 [SYNC DEBUG] Changes type:', typeof changes)
              console.log('🔍 [SYNC DEBUG] Changes keys:', changes ? Object.keys(changes) : 'null/undefined')
              
              // Log each table before accessing
              console.log('🔍 [SYNC DEBUG] profiles raw:', (changes as any)?.profiles)
              console.log('🔍 [SYNC DEBUG] goals raw:', (changes as any)?.goals)
              console.log('🔍 [SYNC DEBUG] milestones raw:', (changes as any)?.milestones)
              console.log('🔍 [SYNC DEBUG] tasks raw:', (changes as any)?.tasks)
              console.log('🔍 [SYNC DEBUG] subscriptions raw:', (changes as any)?.subscriptions)
              console.log('🔍 [SYNC DEBUG] subscription_usage raw:', (changes as any)?.subscription_usage)
              
              // Transform WatermelonDB changes to our format
              const syncChanges: SyncPushChanges = {
                profiles: (changes as any).profiles || { created: [], updated: [], deleted: [] },
                goals: (changes as any).goals || { created: [], updated: [], deleted: [] },
                milestones: (changes as any).milestones || { created: [], updated: [], deleted: [] },
                tasks: (changes as any).tasks || { created: [], updated: [], deleted: [] },
                vision_images: (changes as any).vision_images || { created: [], updated: [], deleted: [] },
                pomodoro_sessions: (changes as any).pomodoro_sessions || { created: [], updated: [], deleted: [] },
                task_time_tracking: (changes as any).task_time_tracking || { created: [], updated: [], deleted: [] },
                subscriptions: (changes as any).subscriptions || { created: [], updated: [], deleted: [] },
                subscription_usage: (changes as any).subscription_usage || { created: [], updated: [], deleted: [] }
              }
              
              console.log('🔍 [SYNC DEBUG] syncChanges created successfully:', {
                profiles: syncChanges.profiles ? 'defined' : 'undefined',
                goals: syncChanges.goals ? 'defined' : 'undefined',
                milestones: syncChanges.milestones ? 'defined' : 'undefined',
                tasks: syncChanges.tasks ? 'defined' : 'undefined',
                subscriptions: syncChanges.subscriptions ? 'defined' : 'undefined',
                subscription_usage: syncChanges.subscription_usage ? 'defined' : 'undefined'
              })
              
              // Check if there are actually changes to push
              console.log('🔍 [SYNC DEBUG] About to call hasChangesToPush...')
              const hasChanges = this.hasChangesToPush(syncChanges)
              console.log('🔍 [SYNC DEBUG] hasChangesToPush result:', hasChanges)
              
              if (!hasChanges) {
                console.log('🔄 No changes to push, skipping...')
                return
              }
              
              console.log('🔍 [SYNC DEBUG] About to log push changes details...')
              try {
                console.log('🔄 Push changes:', {
                  profiles: {
                    created: syncChanges.profiles?.created?.length || 0,
                    updated: syncChanges.profiles?.updated?.length || 0,
                    deleted: syncChanges.profiles?.deleted?.length || 0
                  },
                  goals: {
                    created: syncChanges.goals?.created?.length || 0,
                    updated: syncChanges.goals?.updated?.length || 0,
                    deleted: syncChanges.goals?.deleted?.length || 0
                  },
                  milestones: {
                    created: syncChanges.milestones?.created?.length || 0,
                    updated: syncChanges.milestones?.updated?.length || 0,
                    deleted: syncChanges.milestones?.deleted?.length || 0
                  },
                  tasks: {
                    created: syncChanges.tasks?.created?.length || 0,
                    updated: syncChanges.tasks?.updated?.length || 0,
                    deleted: syncChanges.tasks?.deleted?.length || 0
                  },
                  subscriptions: {
                    created: syncChanges.subscriptions?.created?.length || 0,
                    updated: syncChanges.subscriptions?.updated?.length || 0,
                    deleted: syncChanges.subscriptions?.deleted?.length || 0
                  },
                  subscription_usage: {
                    created: syncChanges.subscription_usage?.created?.length || 0,
                    updated: syncChanges.subscription_usage?.updated?.length || 0,
                    deleted: syncChanges.subscription_usage?.deleted?.length || 0
                  }
                })
                console.log('🔍 [SYNC DEBUG] Push changes log completed, calling pushChanges...')
              } catch (logError) {
                console.error('🔍 [SYNC DEBUG] Error in push changes logging:', logError)
              }
              
              await this.pushChanges(syncChanges)
              console.log('🔍 [SYNC DEBUG] pushChanges completed successfully')
            } catch (error) {
              console.error('❌ Error in pushChanges:', error)
              throw error
            }
          },
        })

        this.lastSyncTime = new Date()
        console.log('✅ Sync completed successfully')
        return // Success, exit retry loop
      } catch (error: any) {
        retryCount++
        
        // Check if it's a network error
        const isNetworkError = error.message?.includes('Network') || 
                              error.message?.includes('fetch') ||
                              error.message?.includes('unavailable') ||
                              error.code === 'NETWORK_ERROR'
        
        if (isNetworkError && retryCount < maxRetries) {
          const backoffDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
          console.log(`🔄 Network error during sync, retrying in ${backoffDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        } else {
          console.error(`❌ Sync failed (attempt ${retryCount}/${maxRetries}):`, error)
          if (retryCount >= maxRetries) {
            // Don't throw error to prevent app crashes, just log and continue
            console.log('🔄 Sync failed after all retries, continuing without sync')
            break
          }
        }
      }
    }
    
    this.syncInProgress = false
  }

  // Schedule a delayed sync (debounced)
  scheduleSync(delayMs: number = 2000): void {
    if (this.pendingSyncTimeout) {
      clearTimeout(this.pendingSyncTimeout)
    }
    
    this.pendingSyncTimeout = setTimeout(() => {
      this.sync().catch(error => {
        console.log('Scheduled sync failed (non-critical):', error.message)
      })
    }, delayMs)
  }

  // Check if there are any changes to push
  private hasChangesToPush(changes: any): boolean {
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - input changes:', changes)
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - changes type:', typeof changes)
    
    if (!changes || typeof changes !== 'object') {
      console.log('🔍 [SYNC DEBUG] hasChangesToPush - changes is null/undefined or not object, returning false')
      return false
    }
    
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - Object.keys(changes):', Object.keys(changes))
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - Object.values(changes):', Object.values(changes))
    
    try {
      const result = Object.values(changes).some((table: any, index: number) => {
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - processing table ${index}:`, table)
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table type:`, typeof table)
        
        if (!table || typeof table !== 'object') {
          console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${index} is null/undefined or not object`)
          return false
        }
        
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${index} keys:`, Object.keys(table))
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${index} created:`, table.created)
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${index} updated:`, table.updated)
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${index} deleted:`, table.deleted)
        
        const created = Array.isArray(table.created) ? table.created : []
        const updated = Array.isArray(table.updated) ? table.updated : []
        const deleted = Array.isArray(table.deleted) ? table.deleted : []
        
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${index} lengths: created=${created.length}, updated=${updated.length}, deleted=${deleted.length}`)
        
        const hasChanges = created.length > 0 || updated.length > 0 || deleted.length > 0
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${index} hasChanges:`, hasChanges)
        
        return hasChanges
      })
      
      console.log('🔍 [SYNC DEBUG] hasChangesToPush - final result:', result)
      return result
    } catch (error) {
      console.error('🔍 [SYNC DEBUG] hasChangesToPush - error occurred:', error)
      return false
    }
  }

  // Push-only sync for anonymous users (no pulling)
  private async pushOnlySync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('⏭️ Push-only sync already in progress, skipping')
      return
    }

    this.syncInProgress = true
    
    try {
      // Get local changes to push
      const localChanges = await this.getLocalChanges()
      
      // Check if there are changes to push
      if (!this.hasChangesToPush(localChanges)) {
        console.log('🔄 No local changes to push for anonymous user')
        return
      }
      
      console.log('🔄 Pushing anonymous user data to Supabase...')
      await this.pushChanges(localChanges)
      
      this.lastSyncTime = new Date()
      console.log('✅ Anonymous push-only sync completed')
      
    } catch (error) {
      console.error('❌ Anonymous push-only sync failed:', error)
      // Don't throw error to prevent app crashes for anonymous users
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
export const syncService = new SyncService(database!)

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    // First check if we have an authenticated user via authService
    const { authService } = await import('./authService')
    const currentUser = authService.getCurrentUser()
    
    if (currentUser) {
      return currentUser.id
    }

    // Try to get effective user ID (includes persistent anonymous)
    const effectiveUserId = authService.getEffectiveUserId()
    if (effectiveUserId) {
      return effectiveUserId
    }

    // Try to initialize auth if no current user
    const user = await authService.initialize()
    return user?.id || null
  } catch (error) {
    console.error('Failed to get user ID:', error)
    return null
  }
}
