import { NativeModules, Platform, AppState, AppStateStatus } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { widgetDataService } from './widgetDataService'
import { conflictResolutionService } from './conflictResolutionService'

interface TimelinePolicy {
  refreshInterval: number // milliseconds
  maxDailyRefreshes: number
  backgroundRefreshEnabled: boolean
  lastRefresh: number
  refreshCount: number
  resetDate: string // YYYY-MM-DD format
}

interface UserActivityMetrics {
  lastAppOpen: number
  totalSessionsToday: number
  averageSessionDuration: number
  lastWidgetInteraction: number
  taskCompletionRate: number
}

class WidgetTimelineManager {
  private static readonly DEFAULT_POLICY: TimelinePolicy = {
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    maxDailyRefreshes: 100,
    backgroundRefreshEnabled: true,
    lastRefresh: 0,
    refreshCount: 0,
    resetDate: new Date().toISOString().split('T')[0]
  }

  private static readonly STORAGE_KEYS = {
    TIMELINE_POLICY: '@goals_ai:timeline_policy',
    USER_METRICS: '@goals_ai:user_metrics',
    REFRESH_HISTORY: '@goals_ai:refresh_history'
  }

  private appStateSubscription: any = null
  private refreshTimer: NodeJS.Timeout | null = null
  private currentPolicy: TimelinePolicy | null = null

  /**
   * Initialize timeline management system
   */
  async initialize() {
    try {
      // Load existing policy or create default
      this.currentPolicy = await this.loadTimelinePolicy()
      
      // Reset daily counters if needed
      await this.resetDailyCountersIfNeeded()
      
      // Start monitoring app state changes
      this.startAppStateMonitoring()
      
      // Schedule next refresh
      this.scheduleNextRefresh()
      
      console.log('📱 Widget Timeline Manager initialized')
    } catch (error) {
      console.error('Failed to initialize Widget Timeline Manager:', error)
    }
  }

  /**
   * Shutdown timeline management system
   */
  shutdown() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove()
      this.appStateSubscription = null
    }
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    console.log('📱 Widget Timeline Manager shutdown')
  }

  /**
   * Intelligently refresh widget timeline based on user activity and policies
   */
  async intelligentRefresh(reason: string = 'scheduled') {
    try {
      if (!this.currentPolicy) {
        console.warn('Timeline policy not initialized')
        return false
      }

      // Check if we can perform a refresh
      if (!await this.canPerformRefresh()) {
        console.log('🚫 Refresh blocked by policy limits')
        return false
      }

      // Get user activity metrics for smart scheduling
      const userMetrics = await this.getUserActivityMetrics()
      const refreshInterval = this.calculateOptimalRefreshInterval(userMetrics)
      
      // Update policy for next refresh
      await this.updateRefreshPolicy(refreshInterval)

      // Perform the refresh
      const success = await this.performTimelineRefresh(reason)
      
      if (success) {
        // Schedule next refresh
        this.scheduleNextRefresh()
        
        // Log refresh activity
        await this.logRefreshActivity(reason, refreshInterval)
      }

      return success
    } catch (error) {
      console.error('Failed to perform intelligent refresh:', error)
      return false
    }
  }

  /**
   * Force immediate timeline refresh (bypasses some policy limits)
   */
  async forceRefresh(reason: string = 'user_action') {
    try {
      const success = await this.performTimelineRefresh(reason)
      
      if (success) {
        // Update last refresh time
        if (this.currentPolicy) {
          this.currentPolicy.lastRefresh = Date.now()
          await this.saveTimelinePolicy(this.currentPolicy)
        }
        
        // Reschedule next refresh
        this.scheduleNextRefresh()
      }

      return success
    } catch (error) {
      console.error('Failed to force refresh:', error)
      return false
    }
  }

  /**
   * Calculate optimal refresh interval based on user activity
   */
  private calculateOptimalRefreshInterval(metrics: UserActivityMetrics): number {
    const baseInterval = WidgetTimelineManager.DEFAULT_POLICY.refreshInterval
    const now = Date.now()
    
    // Factor 1: Time since last app open
    const timeSinceLastOpen = now - metrics.lastAppOpen
    const hoursSinceOpen = timeSinceLastOpen / (1000 * 60 * 60)
    
    // Factor 2: Time since last widget interaction
    const timeSinceWidgetInteraction = now - metrics.lastWidgetInteraction
    const hoursSinceWidget = timeSinceWidgetInteraction / (1000 * 60 * 60)
    
    // Factor 3: Task completion rate (higher rate = more frequent updates)
    const activityMultiplier = Math.max(0.5, Math.min(2.0, metrics.taskCompletionRate))
    
    // Calculate interval adjustments
    let intervalMultiplier = 1.0
    
    // If user opened app recently, refresh more frequently
    if (hoursSinceOpen < 1) {
      intervalMultiplier *= 0.5 // 2x more frequent
    } else if (hoursSinceOpen < 6) {
      intervalMultiplier *= 0.75 // 1.33x more frequent  
    } else if (hoursSinceOpen > 24) {
      intervalMultiplier *= 2.0 // 2x less frequent
    }
    
    // If user interacted with widget recently, maintain frequency
    if (hoursSinceWidget < 2) {
      intervalMultiplier *= 0.75
    }
    
    // Apply activity-based adjustments
    intervalMultiplier /= activityMultiplier
    
    // Calculate final interval (minimum 5 minutes, maximum 2 hours)
    const optimalInterval = Math.max(
      5 * 60 * 1000, // 5 minutes minimum
      Math.min(
        2 * 60 * 60 * 1000, // 2 hours maximum
        baseInterval * intervalMultiplier
      )
    )
    
    console.log(`🔄 Calculated optimal refresh interval: ${Math.round(optimalInterval / 60000)} minutes`)
    return optimalInterval
  }

  /**
   * Check if a refresh can be performed based on current policies
   */
  private async canPerformRefresh(): Promise<boolean> {
    if (!this.currentPolicy) return false
    
    const now = Date.now()
    const timeSinceLastRefresh = now - this.currentPolicy.lastRefresh
    
    // Check minimum interval
    if (timeSinceLastRefresh < this.currentPolicy.refreshInterval) {
      return false
    }
    
    // Check daily limit
    if (this.currentPolicy.refreshCount >= this.currentPolicy.maxDailyRefreshes) {
      return false
    }
    
    // Check background refresh permission
    if (AppState.currentState !== 'active' && !this.currentPolicy.backgroundRefreshEnabled) {
      return false
    }
    
    return true
  }

  /**
   * Perform the actual timeline refresh
   */
  private async performTimelineRefresh(reason: string): Promise<boolean> {
    try {
      console.log(`🔄 Performing timeline refresh (${reason})`)
      
      // Step 1: Resolve any conflicts first
      const conflicts = await conflictResolutionService.detectDataInconsistencies()
      if (conflicts.inconsistencies > 0) {
        console.log(`🔧 Resolved ${conflicts.resolved} data conflicts before refresh`)
      }
      
      // Step 2: Update widget data
      await widgetDataService.updateWidgetData(null, []) // This will fetch current tasks
      
      // Step 3: Reload widget timelines
      if (Platform.OS === 'ios') {
        try {
          const { WidgetKitReloader } = NativeModules
          if (WidgetKitReloader && WidgetKitReloader.reloadAllTimelines) {
            await WidgetKitReloader.reloadAllTimelines()
          } else {
            console.warn('WidgetKitReloader native module not available')
          }
        } catch (error) {
          console.warn('Failed to reload widget timelines:', error)
        }
      }
      
      console.log(`✅ Timeline refresh completed (${reason})`)
      return true
    } catch (error) {
      console.error(`❌ Timeline refresh failed (${reason}):`, error)
      return false
    }
  }

  /**
   * Schedule the next automatic refresh
   */
  private scheduleNextRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    
    if (!this.currentPolicy) return
    
    const nextRefreshDelay = this.currentPolicy.refreshInterval
    
    this.refreshTimer = setTimeout(() => {
      this.intelligentRefresh('scheduled')
    }, nextRefreshDelay)
    
    console.log(`⏰ Next refresh scheduled in ${Math.round(nextRefreshDelay / 60000)} minutes`)
  }

  /**
   * Monitor app state changes for intelligent refresh scheduling
   */
  private startAppStateMonitoring() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.handleAppStateChange(nextAppState)
    })
  }

  /**
   * Handle app state changes
   */
  private async handleAppStateChange(nextAppState: AppStateStatus) {
    try {
      if (nextAppState === 'active') {
        // App became active - update metrics and potentially refresh
        await this.updateUserActivityMetrics()
        
        // Force refresh if it's been a while
        const now = Date.now()
        const timeSinceLastRefresh = this.currentPolicy 
          ? now - this.currentPolicy.lastRefresh 
          : Infinity
          
        if (timeSinceLastRefresh > 30 * 60 * 1000) { // 30 minutes
          await this.forceRefresh('app_activated')
        }
      } else if (nextAppState === 'background') {
        // App went to background - save current state
        await this.updateUserActivityMetrics()
      }
    } catch (error) {
      console.error('Error handling app state change:', error)
    }
  }

  /**
   * Load timeline policy from storage
   */
  private async loadTimelinePolicy(): Promise<TimelinePolicy> {
    try {
      const stored = await AsyncStorage.getItem(WidgetTimelineManager.STORAGE_KEYS.TIMELINE_POLICY)
      if (stored) {
        return { ...WidgetTimelineManager.DEFAULT_POLICY, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load timeline policy:', error)
    }
    
    return { ...WidgetTimelineManager.DEFAULT_POLICY }
  }

  /**
   * Save timeline policy to storage
   */
  private async saveTimelinePolicy(policy: TimelinePolicy) {
    try {
      await AsyncStorage.setItem(
        WidgetTimelineManager.STORAGE_KEYS.TIMELINE_POLICY,
        JSON.stringify(policy)
      )
    } catch (error) {
      console.error('Failed to save timeline policy:', error)
    }
  }

  /**
   * Update refresh policy after a successful refresh
   */
  private async updateRefreshPolicy(newInterval: number) {
    if (!this.currentPolicy) return
    
    this.currentPolicy.refreshInterval = newInterval
    this.currentPolicy.lastRefresh = Date.now()
    this.currentPolicy.refreshCount += 1
    
    await this.saveTimelinePolicy(this.currentPolicy)
  }

  /**
   * Reset daily counters if it's a new day
   */
  private async resetDailyCountersIfNeeded() {
    if (!this.currentPolicy) return
    
    const today = new Date().toISOString().split('T')[0]
    if (this.currentPolicy.resetDate !== today) {
      this.currentPolicy.refreshCount = 0
      this.currentPolicy.resetDate = today
      await this.saveTimelinePolicy(this.currentPolicy)
    }
  }

  /**
   * Get user activity metrics for intelligent scheduling
   */
  private async getUserActivityMetrics(): Promise<UserActivityMetrics> {
    try {
      const stored = await AsyncStorage.getItem(WidgetTimelineManager.STORAGE_KEYS.USER_METRICS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load user metrics:', error)
    }
    
    // Default metrics
    const now = Date.now()
    return {
      lastAppOpen: now,
      totalSessionsToday: 1,
      averageSessionDuration: 10 * 60 * 1000, // 10 minutes
      lastWidgetInteraction: now - 24 * 60 * 60 * 1000, // 1 day ago
      taskCompletionRate: 1.0
    }
  }

  /**
   * Update user activity metrics
   */
  private async updateUserActivityMetrics() {
    try {
      const current = await this.getUserActivityMetrics()
      const now = Date.now()
      
      const updated: UserActivityMetrics = {
        ...current,
        lastAppOpen: now,
        totalSessionsToday: current.totalSessionsToday + 1,
        // Keep other metrics as-is for now
      }
      
      await AsyncStorage.setItem(
        WidgetTimelineManager.STORAGE_KEYS.USER_METRICS,
        JSON.stringify(updated)
      )
    } catch (error) {
      console.error('Failed to update user metrics:', error)
    }
  }

  /**
   * Log refresh activity for analytics and debugging
   */
  private async logRefreshActivity(reason: string, interval: number) {
    try {
      const log = {
        timestamp: Date.now(),
        reason,
        interval,
        refreshCount: this.currentPolicy?.refreshCount || 0
      }
      
      // Store last 10 refresh logs
      const stored = await AsyncStorage.getItem(WidgetTimelineManager.STORAGE_KEYS.REFRESH_HISTORY)
      let history: any[] = stored ? JSON.parse(stored) : []
      
      history.unshift(log)
      history = history.slice(0, 10) // Keep last 10
      
      await AsyncStorage.setItem(
        WidgetTimelineManager.STORAGE_KEYS.REFRESH_HISTORY,
        JSON.stringify(history)
      )
    } catch (error) {
      console.error('Failed to log refresh activity:', error)
    }
  }
}

export const widgetTimelineManager = new WidgetTimelineManager()
