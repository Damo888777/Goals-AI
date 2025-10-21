import { NativeModules, Platform } from 'react-native'

// Type definitions matching Swift ActivityAttributes
export interface PomodoroActivityState {
  timeRemaining: number // seconds
  totalDuration: number // seconds
  sessionType: 'work' | 'shortBreak' | 'longBreak'
  isRunning: boolean
  completedPomodoros: number
  taskTitle: string
}

// Native module interface
interface LiveActivityModule {
  startPomodoroActivity(state: PomodoroActivityState): Promise<string>
  updatePomodoroActivity(activityId: string, state: PomodoroActivityState): Promise<void>
  endPomodoroActivity(activityId: string): Promise<void>
  areActivitiesEnabled(): Promise<boolean>
}

class LiveActivityService {
  private liveActivityModule: LiveActivityModule | null = null
  private currentActivityId: string | null = null

  constructor() {
    if (Platform.OS === 'ios') {
      this.liveActivityModule = NativeModules.LiveActivityModule as LiveActivityModule
    }
  }

  /**
   * Check if Live Activities are supported and enabled
   */
  async isSupported(): Promise<boolean> {
    if (!this.liveActivityModule) return false
    
    try {
      return await this.liveActivityModule.areActivitiesEnabled()
    } catch (error) {
      console.warn('Failed to check Live Activity support:', error)
      return false
    }
  }

  /**
   * Start a new Pomodoro Live Activity
   */
  async startPomodoroTimer(state: PomodoroActivityState): Promise<boolean> {
    if (!this.liveActivityModule) {
      // Suppress warning in development builds where Live Activities aren't available
      if (!__DEV__) {
        console.warn('Live Activities not supported on this platform')
      }
      return false
    }

    try {
      // End existing activity if any
      if (this.currentActivityId) {
        await this.endPomodoroTimer()
      }

      const activityId = await this.liveActivityModule.startPomodoroActivity(state)
      this.currentActivityId = activityId
      console.log('Pomodoro Live Activity started:', activityId)
      return true
    } catch (error) {
      console.error('Failed to start Pomodoro Live Activity:', error)
      return false
    }
  }

  /**
   * Update the current Pomodoro Live Activity
   */
  async updatePomodoroTimer(state: PomodoroActivityState): Promise<boolean> {
    if (!this.liveActivityModule || !this.currentActivityId) {
      return false
    }

    try {
      await this.liveActivityModule.updatePomodoroActivity(this.currentActivityId, state)
      return true
    } catch (error) {
      console.error('Failed to update Pomodoro Live Activity:', error)
      return false
    }
  }

  /**
   * End the current Pomodoro Live Activity
   */
  async endPomodoroTimer(): Promise<boolean> {
    if (!this.liveActivityModule || !this.currentActivityId) {
      return false
    }

    try {
      await this.liveActivityModule.endPomodoroActivity(this.currentActivityId)
      this.currentActivityId = null
      console.log('Pomodoro Live Activity ended')
      return true
    } catch (error) {
      console.error('Failed to end Pomodoro Live Activity:', error)
      return false
    }
  }

  /**
   * Get the current activity ID
   */
  getCurrentActivityId(): string | null {
    return this.currentActivityId
  }

  /**
   * Check if a Live Activity is currently running
   */
  isActive(): boolean {
    return this.currentActivityId !== null
  }
}

export const liveActivityService = new LiveActivityService()
