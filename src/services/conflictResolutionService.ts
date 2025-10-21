import database from '../db'
import Task from '../db/models/Task'
import { Q } from '@nozbe/watermelondb'
import { widgetDataService } from './widgetDataService'

interface ConflictResolution {
  taskId: string
  appState: {
    isComplete: boolean
    completedAt: number | null
    lastModified: number
  }
  widgetState: {
    isComplete: boolean
    completedAt: string
    source: 'widget'
  }
  resolution: 'app_wins' | 'widget_wins' | 'merge_latest'
  reason: string
}

class ConflictResolutionService {
  /**
   * Resolve conflicts between app and widget task states
   */
  async resolveTaskConflicts(widgetCompletions: any[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = []

    if (!database) {
      console.error('Database not initialized')
      return resolutions
    }

    for (const completion of widgetCompletions) {
      try {
        const task = await database.collections
          .get<Task>('tasks')
          .find(completion.taskId)

        if (!task) continue

        const widgetCompletedAt = new Date(completion.completedAt).getTime()
        const appLastModified = (task._raw as any).updated_at || (task._raw as any).created_at
        
        // Get current app state
        const appState = {
          isComplete: task.isComplete,
          completedAt: (task._raw as any).completed_at,
          lastModified: appLastModified
        }

        const widgetState = {
          isComplete: completion.action === 'complete',
          completedAt: completion.completedAt,
          source: 'widget' as const
        }

        // Resolve conflict using timestamp and logic
        const resolution = this.determineResolution(appState, widgetState, widgetCompletedAt)
        
        resolutions.push({
          taskId: completion.taskId,
          appState,
          widgetState,
          resolution: resolution.decision,
          reason: resolution.reason
        })

        // Apply resolution
        await this.applyResolution(task, resolution.decision, widgetState)

      } catch (error) {
        console.error(`Failed to resolve conflict for task ${completion.taskId}:`, error)
      }
    }

    return resolutions
  }

  /**
   * Determine the best resolution strategy for a conflict
   */
  private determineResolution(
    appState: ConflictResolution['appState'],
    widgetState: ConflictResolution['widgetState'],
    widgetTimestamp: number
  ): { decision: ConflictResolution['resolution'], reason: string } {
    
    // If both states are the same, no conflict
    if (appState.isComplete === widgetState.isComplete) {
      return {
        decision: 'app_wins',
        reason: 'No conflict - states match'
      }
    }

    // If app was modified more recently than widget action, app wins
    if (appState.lastModified > widgetTimestamp) {
      return {
        decision: 'app_wins',
        reason: 'App state is more recent'
      }
    }

    // If widget action is more recent, widget wins
    if (widgetTimestamp > appState.lastModified) {
      return {
        decision: 'widget_wins',
        reason: 'Widget action is more recent'
      }
    }

    // Special case: If task was completed in app but uncompleted in widget
    if (appState.isComplete && !widgetState.isComplete) {
      // Widget uncomplete action should win (user changed their mind)
      return {
        decision: 'widget_wins',
        reason: 'Widget uncomplete action overrides app completion'
      }
    }

    // Special case: If task was incomplete in app but completed in widget
    if (!appState.isComplete && widgetState.isComplete) {
      // Widget complete action should win (user completed via widget)
      return {
        decision: 'widget_wins',
        reason: 'Widget completion action'
      }
    }

    // Default: Use latest timestamp
    return {
      decision: 'merge_latest',
      reason: 'Merge based on latest timestamp'
    }
  }

  /**
   * Apply the resolution to the database
   */
  private async applyResolution(
    task: Task,
    decision: ConflictResolution['resolution'],
    widgetState: ConflictResolution['widgetState']
  ) {
    if (decision === 'app_wins') {
      // Keep app state, no changes needed
      return
    }

    if (decision === 'widget_wins' || decision === 'merge_latest') {
      // Apply widget state to app
      await database!.write(async () => {
        await task.update((updatedTask: Task) => {
          (updatedTask._raw as any).is_complete = widgetState.isComplete
          ;(updatedTask._raw as any).completed_at = widgetState.isComplete 
            ? new Date(widgetState.completedAt).getTime()
            : null
          ;(updatedTask._raw as any).updated_at = Date.now()
        })
      })
    }
  }

  /**
   * Detect and resolve data inconsistencies between app and widget
   */
  async detectDataInconsistencies(): Promise<{
    inconsistencies: number
    resolved: number
    errors: string[]
  }> {
    const result = {
      inconsistencies: 0,
      resolved: 0,
      errors: [] as string[]
    }

    try {
      if (!database) {
        result.errors.push('Database not initialized')
        return result
      }

      // Get current widget data
      const widgetData = await widgetDataService.getWidgetData()
      if (!widgetData) return result

      // Get corresponding app data
      const today = new Date()
      const startOfDay = new Date(today)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      const appTasks = await database.collections
        .get<Task>('tasks')
        .query(
          Q.where('scheduled_date', Q.between(startOfDay.getTime(), endOfDay.getTime()))
        )
        .fetch()

      // Check frog task consistency
      if (widgetData.frogTask) {
        const appFrogTask = appTasks.find((t: Task) => t.id === widgetData.frogTask!.id)
        if (appFrogTask && appFrogTask.isComplete !== widgetData.frogTask.isCompleted) {
          result.inconsistencies++
          try {
            // App state wins for data consistency checks
            await this.syncTaskState(appFrogTask, widgetData.frogTask.isCompleted)
            result.resolved++
          } catch (error) {
            result.errors.push(`Failed to resolve frog task inconsistency: ${String(error)}`)
          }
        }
      }

      // Check regular tasks consistency
      for (const widgetTask of widgetData.regularTasks) {
        const appTask = appTasks.find((t: Task) => t.id === widgetTask.id)
        if (appTask && appTask.isComplete !== widgetTask.isCompleted) {
          result.inconsistencies++
          try {
            await this.syncTaskState(appTask, widgetTask.isCompleted)
            result.resolved++
          } catch (error) {
            result.errors.push(`Failed to resolve task ${widgetTask.id} inconsistency: ${String(error)}`)
          }
        }
      }

      if (result.inconsistencies > 0) {
        console.log(`🔄 Resolved ${result.resolved}/${result.inconsistencies} data inconsistencies`)
      }

    } catch (error) {
      result.errors.push(`Failed to detect inconsistencies: ${String(error)}`)
    }

    return result
  }

  /**
   * Sync task state between app and widget
   */
  private async syncTaskState(task: Task, widgetIsComplete: boolean) {
    if (task.isComplete === widgetIsComplete) return

    if (!database) return
    
    await database.write(async () => {
      await task.update((updatedTask: Task) => {
        // App state wins, update widget to match
        ;(updatedTask._raw as any).updated_at = Date.now()
      })
    })

    // Update widget to match app state
    await widgetDataService.markTaskCompleted(task.id)
  }
}

export const conflictResolutionService = new ConflictResolutionService()
