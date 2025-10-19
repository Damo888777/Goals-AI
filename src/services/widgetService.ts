import { NativeModules } from 'react-native';

const { TaskWidgetModule } = NativeModules;

export interface WidgetTaskData {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface WidgetEatTheFrogTask extends WidgetTaskData {
  isEatTheFrog: true;
}

/**
 * Service for communicating with iOS Home Screen Widget
 * Handles data synchronization between React Native app and widget
 */
class WidgetService {
  /**
   * Update widget with current task data
   * @param eatTheFrogTask - Today's eat the frog task
   * @param todaysTasks - Array of today's regular tasks (max 3 displayed)
   */
  async updateWidgetData(
    eatTheFrogTask: WidgetEatTheFrogTask | null,
    todaysTasks: WidgetTaskData[]
  ): Promise<void> {
    try {
      if (!TaskWidgetModule) {
        console.warn('TaskWidgetModule not available - widget updates disabled');
        return;
      }

      // Limit to 3 tasks for widget display
      const limitedTasks = todaysTasks.slice(0, 3);

      await TaskWidgetModule.updateWidgetData(eatTheFrogTask, limitedTasks);
      
      console.log('Widget data updated successfully', {
        eatTheFrogTask: eatTheFrogTask?.title,
        tasksCount: limitedTasks.length
      });
    } catch (error) {
      console.error('Failed to update widget data:', error);
    }
  }

  /**
   * Check if any task was completed from the widget
   * Returns task ID and completion timestamp if available
   */
  async getCompletedTaskFromWidget(): Promise<{
    taskId: string;
    completionTime: number;
  } | null> {
    try {
      if (!TaskWidgetModule) {
        return null;
      }

      return new Promise((resolve) => {
        TaskWidgetModule.getCompletedTaskId((error: any, result: any) => {
          if (error) {
            console.error('Error getting completed task from widget:', error);
            resolve(null);
            return;
          }

          if (result && result.taskId) {
            console.log('Task completed from widget:', result.taskId);
            resolve({
              taskId: result.taskId,
              completionTime: result.completionTime
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Failed to get completed task from widget:', error);
      return null;
    }
  }

  /**
   * Poll for widget task completions
   * Should be called periodically when app is active
   */
  async pollForWidgetCompletions(
    onTaskCompleted: (taskId: string, completionTime: number) => void
  ): Promise<void> {
    const result = await this.getCompletedTaskFromWidget();
    
    if (result) {
      onTaskCompleted(result.taskId, result.completionTime);
    }
  }
}

export const widgetService = new WidgetService();
