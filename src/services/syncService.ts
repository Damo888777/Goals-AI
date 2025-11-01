import { Database } from '@nozbe/watermelondb'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
  private syncTimeout: NodeJS.Timeout | null = null

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

  // Get current user ID (consistent with authService)
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { authService } = await import('./authService')
      return authService.getEffectiveUserId()
    } catch (error) {
      console.error('Error getting effective user ID:', error)
      return null
    }
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
    const { authService } = await import('./authService')
    const userId = authService.getEffectiveUserId()
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
      // Check if user is authenticated (not anonymous) for profile operations
      const { authService } = await import('./authService');
      const currentUser = authService.getCurrentUser();
      const isAuthenticated = currentUser && !currentUser.isAnonymous;
      
      // Push profiles (ONLY for authenticated users to avoid RLS policy issues)
      if (isAuthenticated) {
        if (safeChanges.profiles.created.length > 0) {
          const { error } = await supabase
            .from('profiles')
            .upsert(safeChanges.profiles.created.map(this.transformLocalToSupabase.bind(this)))
          if (error) throw error
        }

        if (safeChanges.profiles.updated.length > 0) {
          for (const profile of safeChanges.profiles.updated) {
            const { error } = await supabase
              .from('profiles')
              .update(this.transformLocalToSupabase.bind(this)(profile))
              .eq('id', profile.id)
            if (error) throw error
          }
        }
      } else {
        console.log('⏸️ Skipping profile sync for anonymous user (RLS policy restriction)');
        // Clear profile changes to prevent them from being retried
        safeChanges.profiles.created = [];
        safeChanges.profiles.updated = [];
      }

      // Push goals first and wait for completion
      if (safeChanges.goals.created.length > 0) {
        // Filter out already synced goal records
        const syncedIds = await this.getSyncedRecordIds()
        const unsyncedGoals = safeChanges.goals.created.filter(g => 
          !syncedIds.has(`goals:${g.id}`)
        )
        
        if (unsyncedGoals.length > 0) {
          const transformedGoals = unsyncedGoals.map(this.transformLocalToSupabase.bind(this))
          console.log('Pushing goals:', transformedGoals.length)
          
          const { error } = await supabase
            .from('goals')
            .upsert(transformedGoals, { onConflict: 'id' })
          
          if (error) {
            console.error('Error pushing goals:', error)
            throw error
          }
          
          // Mark goal records as synced to prevent duplicates
          const goalIds = unsyncedGoals.map(g => `goals:${g.id}`)
          await this.markRecordsAsSynced(goalIds)
          
          // Wait a moment to ensure goals are committed before pushing dependent records
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          console.log('🔄 All goal records already synced, skipping')
        }
      }

      // Push updated goals
      if (safeChanges.goals.updated.length > 0) {
        for (const goal of safeChanges.goals.updated) {
          const transformed = this.transformLocalToSupabase(goal)
          const { error } = await supabase
            .from('goals')
            .update(transformed)
            .eq('id', goal.id)
          
          if (error) {
            console.error('Error updating goal:', error)
            throw error
          }
        }
      }

      // Push milestones (after goals are committed)
      if (safeChanges.milestones.created.length > 0) {
        // Filter out already synced milestone records
        const syncedIds = await this.getSyncedRecordIds()
        const unsyncedMilestones = safeChanges.milestones.created.filter(m => 
          !syncedIds.has(`milestones:${m.id}`)
        )
        
        if (unsyncedMilestones.length > 0) {
          const transformedMilestones = unsyncedMilestones.map(this.transformLocalToSupabase.bind(this))
          console.log('Pushing milestones:', transformedMilestones.length)
          
          const { error } = await supabase
            .from('milestones')
            .upsert(transformedMilestones, { onConflict: 'id' })
          if (error) {
            console.error('Error pushing milestones:', error)
            // If it's a foreign key constraint error, it might be a timing issue
            if (error.code === '23503' && error.message.includes('milestones_goal_id_fkey')) {
              console.warn('⚠️ Foreign key constraint error - goal may not be committed yet. Retrying...')
              // Wait a bit longer and retry once
              await new Promise(resolve => setTimeout(resolve, 500))
              const { error: retryError } = await supabase
                .from('milestones')
                .upsert(transformedMilestones, { onConflict: 'id' })
              if (retryError) {
                console.error('Error pushing milestones after retry:', retryError)
                throw retryError
              }
            } else {
              throw error
            }
          }
          
          // Mark milestone records as synced to prevent duplicates
          const milestoneIds = unsyncedMilestones.map(m => `milestones:${m.id}`)
          await this.markRecordsAsSynced(milestoneIds)
        } else {
          console.log('🔄 All milestone records already synced, skipping')
        }
      }

      if (safeChanges.milestones.updated.length > 0) {
        for (const milestone of safeChanges.milestones.updated) {
          const { error } = await supabase
            .from('milestones')
            .update(this.transformLocalToSupabase.bind(this)(milestone))
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
        // Filter out already synced task records
        const syncedIds = await this.getSyncedRecordIds()
        const unsyncedTasks = safeChanges.tasks.created.filter(t => 
          !syncedIds.has(`tasks:${t.id}`)
        )
        
        if (unsyncedTasks.length > 0) {
          const transformedTasks = unsyncedTasks.map(this.transformLocalToSupabase.bind(this))
          console.log('Pushing tasks:', transformedTasks.length)
          
          const { error } = await supabase
            .from('tasks')
            .upsert(transformedTasks, { onConflict: 'id' })
          if (error) {
            console.error('Error pushing tasks:', error)
            // If it's a foreign key constraint error, it might be a timing issue
            if (error.code === '23503' && (error.message.includes('tasks_goal_id_fkey') || error.message.includes('tasks_milestone_id_fkey'))) {
              console.warn('⚠️ Foreign key constraint error - goal/milestone may not be committed yet. Retrying...')
              // Wait a bit longer and retry once
              await new Promise(resolve => setTimeout(resolve, 500))
              const { error: retryError } = await supabase
                .from('tasks')
                .upsert(transformedTasks, { onConflict: 'id' })
              if (retryError) {
                console.error('Error pushing tasks after retry:', retryError)
                throw retryError
              }
            } else {
              throw error
            }
          }
          
          // Mark task records as synced to prevent duplicates
          const taskIds = unsyncedTasks.map(t => `tasks:${t.id}`)
          await this.markRecordsAsSynced(taskIds)
        } else {
          console.log('🔄 All task records already synced, skipping')
        }
      }

      if (safeChanges.tasks.updated.length > 0) {
        for (const task of safeChanges.tasks.updated) {
          const { error } = await supabase
            .from('tasks')
            .update(this.transformLocalToSupabase.bind(this)(task))
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
        // Filter out already synced subscription records
        const syncedIds = await this.getSyncedRecordIds()
        const unsyncedSubscriptions = safeChanges.subscriptions.created.filter(s => 
          !syncedIds.has(`subscriptions:${s.id}`)
        )
        
        if (unsyncedSubscriptions.length > 0) {
          console.log(`🔄 Syncing ${unsyncedSubscriptions.length} new subscription records`)
          
          // Use upsert with proper conflict resolution for user_id constraint
          const { error } = await supabase
            .from('subscriptions')
            .upsert(
              unsyncedSubscriptions.map(this.transformLocalToSupabase.bind(this)),
              { 
                onConflict: 'user_id',
                ignoreDuplicates: false 
              }
            )
          if (error) throw error
          
          // Mark subscription records as synced to prevent duplicates
          const subscriptionIds = unsyncedSubscriptions.map(s => `subscriptions:${s.id}`)
          await this.markRecordsAsSynced(subscriptionIds)
        } else {
          console.log('🔄 All subscription records already synced, skipping')
        }
      }

      if (safeChanges.subscriptions.updated.length > 0) {
        for (const subscription of safeChanges.subscriptions.updated) {
          const { error } = await supabase
            .from('subscriptions')
            .update(this.transformLocalToSupabase.bind(this)(subscription))
            .eq('id', subscription.id)
          if (error) throw error
        }
      }

      // Push subscription usage
      if (safeChanges.subscription_usage.created.length > 0) {
        const { error } = await supabase
          .from('subscription_usage')
          .upsert(
            safeChanges.subscription_usage.created.map(this.transformLocalToSupabase.bind(this)),
            { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            }
          )
        if (error) throw error
      }

      if (safeChanges.subscription_usage.updated.length > 0) {
        for (const usage of safeChanges.subscription_usage.updated) {
          const { error } = await supabase
            .from('subscription_usage')
            .update(this.transformLocalToSupabase.bind(this)(usage))
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

  // Generate a UUID v4 compatible string
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get synced record IDs from AsyncStorage to prevent duplicate syncs
  private async getSyncedRecordIds(): Promise<Set<string>> {
    try {
      const syncedIds = await AsyncStorage.getItem('synced_record_ids')
      return new Set(syncedIds ? JSON.parse(syncedIds) : [])
    } catch (error) {
      console.error('Error getting synced record IDs:', error)
      return new Set()
    }
  }

  // Mark records as synced to prevent future duplicates
  async markRecordsAsSynced(recordIds: string[]): Promise<void> {
    try {
      const existingSyncedIds = await this.getSyncedRecordIds()
      recordIds.forEach(id => existingSyncedIds.add(id))
      await AsyncStorage.setItem('synced_record_ids', JSON.stringify([...existingSyncedIds]))
    } catch (error) {
      console.error('Error marking records as synced:', error)
    }
  }

  // Clear all sync tracking (for reset/cleanup purposes)
  async clearSyncTracking(): Promise<void> {
    try {
      await AsyncStorage.removeItem('synced_record_ids')
      console.log('✅ Cleared sync tracking records')
    } catch (error) {
      console.error('Error clearing sync tracking:', error)
    }
  }

  // Convert WatermelonDB ID to UUID format for Supabase compatibility
  private convertToUUID(watermelonId: string): string {
    // Check if it's already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(watermelonId)) {
      return watermelonId; // Already a UUID
    }
    
    // Create a deterministic UUID from the WatermelonDB ID
    // This ensures the same WatermelonDB ID always maps to the same UUID
    const hash1 = this.simpleHash(watermelonId);
    const hash2 = this.simpleHash(watermelonId + 'salt');
    const hash3 = this.simpleHash(watermelonId + 'more');
    const hash4 = this.simpleHash(watermelonId + 'data');
    const hash5 = this.simpleHash(watermelonId + 'extra');
    
    // Create proper 32-character hex string for UUID
    const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
    const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
    const hex3 = Math.abs(hash3).toString(16).padStart(8, '0');
    const hex4 = Math.abs(hash4).toString(16).padStart(8, '0');
    const hex5 = Math.abs(hash5).toString(16).padStart(8, '0');
    
    // Combine to create 32 hex characters, then format as UUID
    const fullHex = (hex1 + hex2 + hex3 + hex4).substring(0, 32);
    
    return [
      fullHex.substring(0, 8),   // 8 chars: positions 0-7
      fullHex.substring(8, 12),  // 4 chars: positions 8-11
      '4' + fullHex.substring(12, 15), // Version 4: 4 + 3 chars (positions 12-14)
      ((parseInt(fullHex.substring(15, 16), 16) & 0x3) | 0x8).toString(16) + fullHex.substring(16, 19), // Variant: 1 + 3 chars (positions 15-18)
      fullHex.substring(20, 32)  // 12 chars: positions 20-31
    ].join('-');
  }

  // Simple hash function for deterministic UUID generation
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Transform WatermelonDB data to Supabase format
  private transformLocalToSupabase(record: any): any {
    // Convert WatermelonDB ID to UUID format for Supabase compatibility
    const recordId = this.convertToUUID(record.id);
    
    const base = {
      id: recordId,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    }

    // Handle profile records - NOTE: Profiles should not be synced for anonymous users
    if (record.email !== undefined) {
      return {
        ...base,
        user_id: recordId, // For profiles, user_id matches the profile id
        email: record.email
      }
    }

    // Handle goal records (check for goal-specific fields)
    if (record.table === 'goals' || (record.title !== undefined && (record.feelingsArray !== undefined || record.feelings !== undefined || record.visionImageUrl !== undefined))) {
      return {
        ...base,
        user_id: this.convertToUUID(record.userId),
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
        user_id: this.convertToUUID(record.userId),
        goal_id: record.goalId ? this.convertToUUID(record.goalId) : null,
        milestone_id: record.milestoneId ? this.convertToUUID(record.milestoneId) : null,
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
        user_id: this.convertToUUID(record.userId),
        goal_id: this.convertToUUID(record.goalId),
        title: record.title,
        target_date: record.targetDate || null,
        is_complete: record.isComplete || false,
        creation_source: record.creationSource || 'manual'
      }
    }

    // Handle subscription records (RevenueCat data)
    if (record.table === 'subscriptions' || record.revenuecatCustomerId !== undefined || record.activeEntitlements !== undefined) {
      // Map tier IDs to valid subscription_tier values
      let subscriptionTier = 'starter'; // Default fallback
      if (record.currentTier) {
        if (record.currentTier.includes('starter')) subscriptionTier = 'starter';
        else if (record.currentTier.includes('achiever')) subscriptionTier = 'achiever';
        else if (record.currentTier.includes('visionary')) subscriptionTier = 'visionary';
      }
      
      return {
        ...base,
        user_id: this.convertToUUID(record.userId),
        subscription_tier: subscriptionTier, // Must be 'starter', 'achiever', or 'visionary'
        product_id: record.revenuecatCustomerId || 'unknown',
        transaction_id: record.revenuecatCustomerId || 'unknown',
        original_transaction_id: record.revenuecatCustomerId || 'unknown',
        purchased_at: new Date().toISOString(),
        environment: 'sandbox',
        store: 'app_store',
        revenuecat_customer_id: record.revenuecatCustomerId,
        active_entitlements: record.activeEntitlements,
        current_tier: record.currentTier,
        is_active: record.isActive,
        last_updated: record.lastUpdated,
        creation_source: record.creationSource || 'revenuecat'
      }
    }

    // Handle subscription usage records
    if (record.table === 'subscription_usage' || record.sparkAiVoiceInputsUsed !== undefined || record.sparkAiVisionImagesUsed !== undefined) {
      return {
        ...base,
        user_id: this.convertToUUID(record.userId),
        subscription_tier: record.subscriptionTier,
        spark_ai_voice_inputs_used: record.sparkAiVoiceInputsUsed || 0,
        spark_ai_vision_images_used: record.sparkAiVisionImagesUsed || 0,
        active_goals_count: record.activeGoalsCount || 0,
        period_start: record.periodStart ? record.periodStart.toISOString() : new Date().toISOString(),
        period_end: record.periodEnd ? record.periodEnd.toISOString() : null
      }
    }

    // Fallback for unknown record types (basic fields only)
    return {
      ...base,
      user_id: this.convertToUUID(record.userId),
      title: record.title || null,
      notes: record.notes || null,
      creation_source: record.creationSource || 'manual'
    }
  }

  // Get local changes that need to be synced
  private async getLocalChanges(): Promise<SyncPushChanges> {
    // Use effective user ID which includes persistent anonymous IDs
    const { authService } = await import('./authService')
    const userId = authService.getEffectiveUserId()
    if (!userId) {
      throw new Error('No user ID available (neither authenticated nor anonymous)')
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

      // Get synced record IDs from AsyncStorage to prevent duplicates
      const syncedRecordIds = await this.getSyncedRecordIds()
      
      // Only include records that haven't been synced yet
      const unsyncedProfiles = userProfiles.filter(p => !syncedRecordIds.has(`profiles:${p.id}`))
      const unsyncedGoals = userGoals.filter(g => !syncedRecordIds.has(`goals:${g.id}`))
      const unsyncedMilestones = userMilestones.filter(m => !syncedRecordIds.has(`milestones:${m.id}`))
      const unsyncedTasks = userTasks.filter(t => !syncedRecordIds.has(`tasks:${t.id}`))
      const unsyncedSubscriptions = userSubscriptions.filter(s => !syncedRecordIds.has(`subscriptions:${s.id}`))
      const unsyncedSubscriptionUsage = userSubscriptionUsage.filter(u => !syncedRecordIds.has(`subscription_usage:${u.id}`))

      return {
        profiles: {
          created: Array.isArray(unsyncedProfiles) ? unsyncedProfiles : [],
          updated: [],
          deleted: []
        },
        goals: {
          created: Array.isArray(unsyncedGoals) ? unsyncedGoals : [],
          updated: [],
          deleted: []
        },
        milestones: {
          created: Array.isArray(unsyncedMilestones) ? unsyncedMilestones : [],
          updated: [],
          deleted: []
        },
        tasks: {
          created: Array.isArray(unsyncedTasks) ? unsyncedTasks : [],
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
          created: Array.isArray(unsyncedSubscriptions) ? unsyncedSubscriptions : [],
          updated: [],
          deleted: []
        },
        subscription_usage: {
          created: Array.isArray(unsyncedSubscriptionUsage) ? unsyncedSubscriptionUsage : [],
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
        // Use push-only sync for anonymous users
        const changes = await this.getLocalChanges()
        if (this.hasChangesToPush(changes)) {
          await this.pushChanges(changes)
        }
        
        // Mark sync as successful
        this.syncInProgress = false
        console.log('✅ Sync completed successfully')
        return
        
      } catch (error) {
        console.error('❌ Sync failed:', error)
        retryCount++
        
        if (retryCount >= maxRetries) {
          console.error(`❌ Sync failed after ${maxRetries} attempts`)
          this.syncInProgress = false
          throw error
        }
        
        console.log(`🔄 Retrying sync (${retryCount}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
  }

  // Check if there are changes to push
  private hasChangesToPush(changes: SyncPushChanges): boolean {
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - input changes:', changes)
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - changes type:', typeof changes)
    
    if (!changes || typeof changes !== 'object') {
      console.log('🔍 [SYNC DEBUG] hasChangesToPush - invalid changes object')
      return false
    }
    
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - Object.keys(changes):', Object.keys(changes))
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - Object.values(changes):', Object.values(changes))
    
    const tables = Object.values(changes)
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      console.log(`🔍 [SYNC DEBUG] hasChangesToPush - processing table ${i}:`, table)
      console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table type:`, typeof table)
      
      if (table && typeof table === 'object') {
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${i} keys:`, Object.keys(table))
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${i} created:`, (table as any).created)
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${i} updated:`, (table as any).updated)
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${i} deleted:`, (table as any).deleted)
        
        const created = (table as any).created || []
        const updated = (table as any).updated || []
        const deleted = (table as any).deleted || []
        
        console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${i} lengths: created=${created.length}, updated=${updated.length}, deleted=${deleted.length}`)
        
        if (created.length > 0 || updated.length > 0 || deleted.length > 0) {
          console.log(`🔍 [SYNC DEBUG] hasChangesToPush - table ${i} hasChanges: true`)
          console.log('🔍 [SYNC DEBUG] hasChangesToPush - final result: true')
          return true
        }
      }
    }
    
    console.log('🔍 [SYNC DEBUG] hasChangesToPush - final result: false')
    return false
  }

  // Schedule a sync with delay (with debouncing and progress check)
  scheduleSync(delayMs: number = 0): void {
    // Don't schedule if sync is already in progress
    if (this.syncInProgress) {
      return
    }
    
    // Clear existing timeout to prevent multiple scheduled syncs
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }
    
    // Don't sync too frequently (cooldown)
    if (this.lastSyncTime && Date.now() - this.lastSyncTime.getTime() < this.syncCooldown) {
      return
    }
    
    this.syncTimeout = setTimeout(() => {
      this.sync().catch((error) => {
        console.error('❌ Scheduled sync failed:', error)
      })
    }, delayMs)
  }

  // Push-only sync for anonymous users (no pulling)
  private async pushOnlySync(): Promise<void> {
    if (this.syncInProgress) {
      return // Silent skip, no console spam
    }

    this.syncInProgress = true
    
    try {
      // Get local changes to push
      const localChanges = await this.getLocalChanges()
      
      // Check if there are changes to push
      if (!this.hasChangesToPush(localChanges)) {
        return // Silent skip when no changes
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
