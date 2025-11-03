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

  // Helper function to deduplicate records by ID before upserting
  private deduplicateById<T extends { id: string }>(records: T[]): T[] {
    const seen = new Map<string, T>()
    records.forEach(record => {
      // Keep the last occurrence of each ID (most recent)
      seen.set(record.id, record)
    })
    return Array.from(seen.values())
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
          const transformedProfiles = safeChanges.profiles.created.map(this.transformLocalToSupabase.bind(this))
          const dedupedProfiles = this.deduplicateById(transformedProfiles)
          const { error } = await supabase
            .from('profiles')
            .upsert(dedupedProfiles)
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
          const dedupedGoals = this.deduplicateById(transformedGoals)
          console.log('Pushing goals:', dedupedGoals.length)
          
          const { error } = await supabase
            .from('goals')
            .upsert(dedupedGoals, { onConflict: 'id' })
          
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
          const dedupedMilestones = this.deduplicateById(transformedMilestones)
          console.log('Pushing milestones:', dedupedMilestones.length)
          
          const { error } = await supabase
            .from('milestones')
            .upsert(dedupedMilestones, { onConflict: 'id' })
          if (error) {
            console.error('Error pushing milestones:', error)
            // If it's a foreign key constraint error, it might be a timing issue
            if (error.code === '23503' && error.message.includes('milestones_goal_id_fkey')) {
              console.warn('⚠️ Foreign key constraint error - goal may not be committed yet. Retrying...')
              // Wait a bit longer and retry once
              await new Promise(resolve => setTimeout(resolve, 500))
              const { error: retryError } = await supabase
                .from('milestones')
                .upsert(dedupedMilestones, { onConflict: 'id' })
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
          const dedupedTasks = this.deduplicateById(transformedTasks)
          console.log('Pushing tasks:', dedupedTasks.length)
          
          const { error } = await supabase
            .from('tasks')
            .upsert(dedupedTasks, { onConflict: 'id' })
          if (error) {
            console.error('Error pushing tasks:', error)
            // If it's a foreign key constraint error, it might be a timing issue
            if (error.code === '23503' && (error.message.includes('tasks_goal_id_fkey') || error.message.includes('tasks_milestone_id_fkey'))) {
              console.warn('⚠️ Foreign key constraint error - goal/milestone may not be committed yet. Retrying...')
              // Wait a bit longer and retry once
              await new Promise(resolve => setTimeout(resolve, 500))
              const { error: retryError } = await supabase
                .from('tasks')
                .upsert(dedupedTasks, { onConflict: 'id' })
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
          
          const transformedSubscriptions = unsyncedSubscriptions.map(this.transformLocalToSupabase.bind(this))
          const dedupedSubscriptions = this.deduplicateById(transformedSubscriptions)
          
          // Use upsert with proper conflict resolution for user_id constraint
          const { error } = await supabase
            .from('subscriptions')
            .upsert(
              dedupedSubscriptions,
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
        const transformedUsage = safeChanges.subscription_usage.created.map(this.transformLocalToSupabase.bind(this))
        const dedupedUsage = this.deduplicateById(transformedUsage)
        
        const { error } = await supabase
          .from('subscription_usage')
          .upsert(
            dedupedUsage,
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
    const base = {
      ...row,
      // Convert snake_case to camelCase for local models
      userId: row.user_id,
      goalId: row.goal_id,
      milestoneId: row.milestone_id,
      taskId: row.task_id,
      visionImageUrl: row.vision_image_url,
      isCompleted: row.is_completed,
      completedAt: row.completed_at ? (typeof row.completed_at === 'number' ? row.completed_at : new Date(row.completed_at).getTime()) : null,
      targetDate: row.target_date,
      isComplete: row.is_complete,
      scheduledDate: row.scheduled_date,
      isFrog: row.is_frog,
      creationSource: row.creation_source,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
      
      // Vision images fields
      imageUrl: row.image_url,
      imageType: row.image_type,
      prompt: row.prompt,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      
      // Pomodoro sessions fields
      sessionType: row.session_type,
      durationMinutes: row.duration_minutes,
      actualDurationSeconds: row.actual_duration_seconds,
      
      // Task time tracking fields
      totalPomodoroSessions: row.total_pomodoro_sessions,
      totalMinutesFocused: row.total_minutes_focused,
      lastSessionAt: row.last_session_at ? new Date(row.last_session_at).getTime() : null,
      
      // Subscription fields
      subscriptionTier: row.subscription_tier,
      productId: row.product_id,
      transactionId: row.transaction_id,
      originalTransactionId: row.original_transaction_id,
      purchasedAt: row.purchased_at ? new Date(row.purchased_at).getTime() : null,
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
      isActive: row.is_active,
      isTrial: row.is_trial,
      isCancelled: row.is_cancelled,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).getTime() : null,
      cancelReason: row.cancel_reason,
      expiredAt: row.expired_at ? new Date(row.expired_at).getTime() : null,
      hasBillingIssue: row.has_billing_issue,
      billingIssueDetectedAt: row.billing_issue_detected_at ? new Date(row.billing_issue_detected_at).getTime() : null,
      environment: row.environment,
      store: row.store,
      countryCode: row.country_code,
      currency: row.currency,
      price: row.price,
      entitlementIds: row.entitlement_ids ? (Array.isArray(row.entitlement_ids) ? JSON.stringify(row.entitlement_ids) : row.entitlement_ids) : null,
      revenuecatCustomerId: row.revenuecat_customer_id,
      activeEntitlements: row.active_entitlements,
      currentTier: row.current_tier,
      lastUpdated: row.last_updated ? new Date(row.last_updated).getTime() : null,
      
      // Subscription usage fields
      sparkAiVoiceInputsUsed: row.spark_ai_voice_inputs_used,
      sparkAiVisionImagesUsed: row.spark_ai_vision_images_used,
      activeGoalsCount: row.active_goals_count,
      periodStart: row.period_start ? new Date(row.period_start).getTime() : null,
      periodEnd: row.period_end ? new Date(row.period_end).getTime() : null,
    }
    
    return base
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
    // The 'id' field in base already serves as the user_id (linked to auth.users.id)
    if (record.email !== undefined) {
      return {
        ...base,
        email: record.email,
        name: record.name || null
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
        product_id: record.productId || record.revenuecatCustomerId || 'unknown',
        transaction_id: record.transactionId || record.revenuecatCustomerId || 'unknown',
        original_transaction_id: record.originalTransactionId || record.revenuecatCustomerId || 'unknown',
        purchased_at: record.purchasedAt ? (typeof record.purchasedAt === 'number' ? new Date(record.purchasedAt).toISOString() : record.purchasedAt) : new Date().toISOString(),
        expires_at: record.expiresAt ? (typeof record.expiresAt === 'number' ? new Date(record.expiresAt).toISOString() : record.expiresAt) : null,
        is_active: record.isActive !== undefined ? record.isActive : true,
        is_trial: record.isTrial || false,
        is_cancelled: record.isCancelled || false,
        cancelled_at: record.cancelledAt ? (typeof record.cancelledAt === 'number' ? new Date(record.cancelledAt).toISOString() : record.cancelledAt) : null,
        cancel_reason: record.cancelReason || null,
        expired_at: record.expiredAt ? (typeof record.expiredAt === 'number' ? new Date(record.expiredAt).toISOString() : record.expiredAt) : null,
        has_billing_issue: record.hasBillingIssue || false,
        billing_issue_detected_at: record.billingIssueDetectedAt ? (typeof record.billingIssueDetectedAt === 'number' ? new Date(record.billingIssueDetectedAt).toISOString() : record.billingIssueDetectedAt) : null,
        environment: record.environment || 'sandbox',
        store: record.store || 'app_store',
        country_code: record.countryCode || null,
        currency: record.currency || null,
        price: record.price || null,
        entitlement_ids: record.entitlementIds ? (typeof record.entitlementIds === 'string' ? JSON.parse(record.entitlementIds) : record.entitlementIds) : null,
        revenuecat_customer_id: record.revenuecatCustomerId || null,
        active_entitlements: record.activeEntitlements || null,
        current_tier: record.currentTier || null,
        last_updated: record.lastUpdated ? (typeof record.lastUpdated === 'number' ? new Date(record.lastUpdated).toISOString() : record.lastUpdated) : null,
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
        period_start: record.periodStart ? (typeof record.periodStart === 'number' ? new Date(record.periodStart).toISOString() : record.periodStart) : new Date().toISOString(),
        period_end: record.periodEnd ? (typeof record.periodEnd === 'number' ? new Date(record.periodEnd).toISOString() : record.periodEnd) : null
      }
    }

    // Handle vision_images records
    if (record.table === 'vision_images' || record.imageUrl !== undefined || record.imageType !== undefined) {
      return {
        ...base,
        user_id: this.convertToUUID(record.userId),
        goal_id: record.goalId ? this.convertToUUID(record.goalId) : null,
        image_url: record.imageUrl || null,
        image_type: record.imageType || 'vision',
        prompt: record.prompt || null,
        file_size: record.fileSize || null,
        mime_type: record.mimeType || null
      }
    }

    // Handle pomodoro_sessions records
    if (record.table === 'pomodoro_sessions' || record.sessionType !== undefined || record.durationMinutes !== undefined) {
      return {
        ...base,
        user_id: this.convertToUUID(record.userId),
        task_id: record.taskId ? this.convertToUUID(record.taskId) : null,
        goal_id: record.goalId ? this.convertToUUID(record.goalId) : null,
        session_type: record.sessionType || 'work',
        duration_minutes: record.durationMinutes || 25,
        actual_duration_seconds: record.actualDurationSeconds || null,
        is_completed: record.isCompleted || false,
        completed_at: record.completedAt ? (typeof record.completedAt === 'number' ? new Date(record.completedAt).toISOString() : record.completedAt) : null,
        notes: record.notes || null
      }
    }

    // Handle task_time_tracking records
    if (record.table === 'task_time_tracking' || record.totalPomodoroSessions !== undefined || record.totalMinutesFocused !== undefined) {
      return {
        ...base,
        user_id: this.convertToUUID(record.userId),
        task_id: record.taskId ? this.convertToUUID(record.taskId) : null,
        total_pomodoro_sessions: record.totalPomodoroSessions || 0,
        total_minutes_focused: record.totalMinutesFocused || 0,
        last_session_at: record.lastSessionAt ? (typeof record.lastSessionAt === 'number' ? new Date(record.lastSessionAt).toISOString() : record.lastSessionAt) : null
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
      
      // Deduplicate records by ID (in case migration created duplicates)
      const dedupeById = <T extends { id: string }>(records: T[]): T[] => {
        const seen = new Set<string>()
        return records.filter(r => {
          if (seen.has(r.id)) return false
          seen.add(r.id)
          return true
        })
      }
      
      // Only include records that haven't been synced yet, and deduplicate
      const unsyncedProfiles = dedupeById(userProfiles.filter(p => !syncedRecordIds.has(`profiles:${p.id}`)))
      const unsyncedGoals = dedupeById(userGoals.filter(g => !syncedRecordIds.has(`goals:${g.id}`)))
      const unsyncedMilestones = dedupeById(userMilestones.filter(m => !syncedRecordIds.has(`milestones:${m.id}`)))
      const unsyncedTasks = dedupeById(userTasks.filter(t => !syncedRecordIds.has(`tasks:${t.id}`)))
      const unsyncedSubscriptions = dedupeById(userSubscriptions.filter(s => !syncedRecordIds.has(`subscriptions:${s.id}`)))
      const unsyncedSubscriptionUsage = dedupeById(userSubscriptionUsage.filter(u => !syncedRecordIds.has(`subscription_usage:${u.id}`)))

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

    // For authenticated users: bidirectional sync (pull + push)
    this.syncInProgress = true
    console.log('🔄 Starting bidirectional sync for authenticated user...')

    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        // STEP 1: Pull remote changes from Supabase
        const lastPulledAt = await this.getLastPullTimestamp()
        console.log('📥 Pulling remote changes from Supabase...')
        const remoteChanges = await this.pullChanges(lastPulledAt)
        
        // STEP 2: Apply remote changes to local database
        if (this.hasRemoteChanges(remoteChanges)) {
          console.log('📥 Applying remote changes to local database...')
          await this.applyRemoteChanges(remoteChanges)
          await this.setLastPullTimestamp(remoteChanges.timestamp)
        } else {
          console.log('📥 No remote changes to apply')
        }
        
        // STEP 3: Push local changes to Supabase
        const localChanges = await this.getLocalChanges()
        if (this.hasChangesToPush(localChanges)) {
          console.log('📤 Pushing local changes to Supabase...')
          await this.pushChanges(localChanges)
        } else {
          console.log('📤 No local changes to push')
        }
        
        // Mark sync as successful
        this.syncInProgress = false
        this.lastSyncTime = new Date()
        console.log('✅ Bidirectional sync completed successfully')
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

  // Get last pull timestamp from local storage
  private async getLastPullTimestamp(): Promise<number | undefined> {
    try {
      const timestamp = await this.database.adapter.getLocal('last_pull_timestamp')
      return timestamp ? Number(timestamp) : undefined
    } catch (error) {
      console.error('Error getting last pull timestamp:', error)
      return undefined
    }
  }

  // Set last pull timestamp in local storage
  private async setLastPullTimestamp(timestamp: number): Promise<void> {
    try {
      await this.database.adapter.setLocal('last_pull_timestamp', String(timestamp))
    } catch (error) {
      console.error('Error setting last pull timestamp:', error)
    }
  }

  // Check if remote changes exist
  private hasRemoteChanges(remoteChanges: SyncPullResult): boolean {
    const tables = Object.values(remoteChanges.changes)
    for (const table of tables) {
      if (Array.isArray(table) && table.length > 0) {
        return true
      }
    }
    return false
  }

  // Apply remote changes to local database
  private async applyRemoteChanges(remoteChanges: SyncPullResult): Promise<void> {
    try {
      await this.database.write(async () => {
        // Apply goals
        for (const remoteGoal of remoteChanges.changes.goals) {
          const goalsCollection = this.database.get('goals')
          try {
            const existingGoal = await goalsCollection.find(remoteGoal.id)
            // Update existing goal
            await existingGoal.update((goal: any) => {
              goal.title = remoteGoal.title
              goal.feelings = remoteGoal.feelings
              goal.visionImageUrl = remoteGoal.visionImageUrl
              goal.notes = remoteGoal.notes
              goal.isCompleted = remoteGoal.isCompleted
              goal.completedAt = remoteGoal.completedAt
            })
          } catch {
            // Create new goal
            await goalsCollection.create((goal: any) => {
              goal._raw.id = remoteGoal.id
              goal.userId = remoteGoal.userId
              goal.title = remoteGoal.title
              goal.feelings = remoteGoal.feelings
              goal.visionImageUrl = remoteGoal.visionImageUrl
              goal.notes = remoteGoal.notes
              goal.isCompleted = remoteGoal.isCompleted
              goal.completedAt = remoteGoal.completedAt
            })
          }
        }

        // Apply milestones
        for (const remoteMilestone of remoteChanges.changes.milestones) {
          const milestonesCollection = this.database.get('milestones')
          try {
            const existingMilestone = await milestonesCollection.find(remoteMilestone.id)
            await existingMilestone.update((milestone: any) => {
              milestone.title = remoteMilestone.title
              milestone.targetDate = remoteMilestone.targetDate
              milestone.isComplete = remoteMilestone.isComplete
            })
          } catch {
            await milestonesCollection.create((milestone: any) => {
              milestone._raw.id = remoteMilestone.id
              milestone.userId = remoteMilestone.userId
              milestone.goalId = remoteMilestone.goalId
              milestone.title = remoteMilestone.title
              milestone.targetDate = remoteMilestone.targetDate
              milestone.isComplete = remoteMilestone.isComplete
            })
          }
        }

        // Apply tasks
        for (const remoteTask of remoteChanges.changes.tasks) {
          const tasksCollection = this.database.get('tasks')
          try {
            const existingTask = await tasksCollection.find(remoteTask.id)
            await existingTask.update((task: any) => {
              task.title = remoteTask.title
              task.notes = remoteTask.notes
              task.scheduledDate = remoteTask.scheduledDate
              task.isFrog = remoteTask.isFrog
              task.isComplete = remoteTask.isComplete
              task.completedAt = remoteTask.completedAt
            })
          } catch {
            await tasksCollection.create((task: any) => {
              task._raw.id = remoteTask.id
              task.userId = remoteTask.userId
              task.goalId = remoteTask.goalId
              task.milestoneId = remoteTask.milestoneId
              task.title = remoteTask.title
              task.notes = remoteTask.notes
              task.scheduledDate = remoteTask.scheduledDate
              task.isFrog = remoteTask.isFrog
              task.isComplete = remoteTask.isComplete
              task.completedAt = remoteTask.completedAt
            })
          }
        }

        // Apply subscriptions
        for (const remoteSub of remoteChanges.changes.subscriptions) {
          const subsCollection = this.database.get('subscriptions')
          try {
            const existingSub = await subsCollection.find(remoteSub.id)
            await existingSub.update((sub: any) => {
              sub.subscriptionTier = remoteSub.subscriptionTier
              sub.isActive = remoteSub.isActive
              sub.currentTier = remoteSub.currentTier
              sub.activeEntitlements = remoteSub.activeEntitlements
              sub.revenuecatCustomerId = remoteSub.revenuecatCustomerId
            })
          } catch {
            await subsCollection.create((sub: any) => {
              sub._raw.id = remoteSub.id
              sub.userId = remoteSub.userId
              sub.subscriptionTier = remoteSub.subscriptionTier
              sub.isActive = remoteSub.isActive
              sub.currentTier = remoteSub.currentTier
              sub.activeEntitlements = remoteSub.activeEntitlements
              sub.revenuecatCustomerId = remoteSub.revenuecatCustomerId
            })
          }
        }

        // Apply subscription usage
        for (const remoteUsage of remoteChanges.changes.subscription_usage) {
          const usageCollection = this.database.get('subscription_usage')
          try {
            const existingUsage = await usageCollection.find(remoteUsage.id)
            await existingUsage.update((usage: any) => {
              usage.sparkAiVoiceInputsUsed = remoteUsage.sparkAiVoiceInputsUsed
              usage.sparkAiVisionImagesUsed = remoteUsage.sparkAiVisionImagesUsed
              usage.activeGoalsCount = remoteUsage.activeGoalsCount
              usage.periodStart = remoteUsage.periodStart
              usage.periodEnd = remoteUsage.periodEnd
            })
          } catch {
            await usageCollection.create((usage: any) => {
              usage._raw.id = remoteUsage.id
              usage.userId = remoteUsage.userId
              usage.subscriptionTier = remoteUsage.subscriptionTier
              usage.sparkAiVoiceInputsUsed = remoteUsage.sparkAiVoiceInputsUsed
              usage.sparkAiVisionImagesUsed = remoteUsage.sparkAiVisionImagesUsed
              usage.activeGoalsCount = remoteUsage.activeGoalsCount
              usage.periodStart = remoteUsage.periodStart
              usage.periodEnd = remoteUsage.periodEnd
            })
          }
        }

        // Apply vision images
        for (const remoteImage of remoteChanges.changes.vision_images) {
          const imagesCollection = this.database.get('vision_images')
          try {
            const existingImage = await imagesCollection.find(remoteImage.id)
            await existingImage.update((image: any) => {
              image.goalId = remoteImage.goalId
              image.imageUrl = remoteImage.imageUrl
              image.imageType = remoteImage.imageType
              image.prompt = remoteImage.prompt
              image.fileSize = remoteImage.fileSize
              image.mimeType = remoteImage.mimeType
            })
          } catch {
            await imagesCollection.create((image: any) => {
              image._raw.id = remoteImage.id
              image.userId = remoteImage.userId
              image.goalId = remoteImage.goalId
              image.imageUrl = remoteImage.imageUrl
              image.imageType = remoteImage.imageType
              image.prompt = remoteImage.prompt
              image.fileSize = remoteImage.fileSize
              image.mimeType = remoteImage.mimeType
            })
          }
        }

        // Apply pomodoro sessions
        for (const remoteSession of remoteChanges.changes.pomodoro_sessions) {
          const sessionsCollection = this.database.get('pomodoro_sessions')
          try {
            const existingSession = await sessionsCollection.find(remoteSession.id)
            await existingSession.update((session: any) => {
              session.taskId = remoteSession.taskId
              session.goalId = remoteSession.goalId
              session.sessionType = remoteSession.sessionType
              session.durationMinutes = remoteSession.durationMinutes
              session.actualDurationSeconds = remoteSession.actualDurationSeconds
              session.isCompleted = remoteSession.isCompleted
              session.completedAt = remoteSession.completedAt
              session.notes = remoteSession.notes
            })
          } catch {
            await sessionsCollection.create((session: any) => {
              session._raw.id = remoteSession.id
              session.userId = remoteSession.userId
              session.taskId = remoteSession.taskId
              session.goalId = remoteSession.goalId
              session.sessionType = remoteSession.sessionType
              session.durationMinutes = remoteSession.durationMinutes
              session.actualDurationSeconds = remoteSession.actualDurationSeconds
              session.isCompleted = remoteSession.isCompleted
              session.completedAt = remoteSession.completedAt
              session.notes = remoteSession.notes
            })
          }
        }

        // Apply task time tracking
        for (const remoteTracking of remoteChanges.changes.task_time_tracking) {
          const trackingCollection = this.database.get('task_time_tracking')
          try {
            const existingTracking = await trackingCollection.find(remoteTracking.id)
            await existingTracking.update((tracking: any) => {
              tracking.taskId = remoteTracking.taskId
              tracking.totalPomodoroSessions = remoteTracking.totalPomodoroSessions
              tracking.totalMinutesFocused = remoteTracking.totalMinutesFocused
              tracking.lastSessionAt = remoteTracking.lastSessionAt
            })
          } catch {
            await trackingCollection.create((tracking: any) => {
              tracking._raw.id = remoteTracking.id
              tracking.userId = remoteTracking.userId
              tracking.taskId = remoteTracking.taskId
              tracking.totalPomodoroSessions = remoteTracking.totalPomodoroSessions
              tracking.totalMinutesFocused = remoteTracking.totalMinutesFocused
              tracking.lastSessionAt = remoteTracking.lastSessionAt
            })
          }
        }
      })

      console.log('✅ Applied remote changes to local database')
    } catch (error) {
      console.error('❌ Error applying remote changes:', error)
      throw error
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
