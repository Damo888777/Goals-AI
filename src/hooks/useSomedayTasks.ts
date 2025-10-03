import { useState, useEffect } from 'react';
import { DB_CONFIG } from '../db/config';
import { mockDatabase, MockTask } from '../db/mockDatabase';
import type { Task as TaskType } from '../types';

export function useSomedayTasks() {
  const [somedayTasks, setSomedayTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSomedayTasks = async () => {
    try {
      setIsLoading(true);
      
      if (!DB_CONFIG.USE_WATERMELON) {
        // Fetch tasks without scheduled dates (someday tasks)
        const allTasks = await mockDatabase.getTasks();
        const somedayTasksFiltered = allTasks.filter(task => 
          !task.scheduled_date || task.scheduled_date === ''
        );

        // Convert MockTask to TaskType
        const convertedTasks: TaskType[] = somedayTasksFiltered.map((task: MockTask) => ({
          id: task.id,
          title: task.title,
          isFrog: task.is_frog,
          isComplete: task.is_complete,
          goalId: task.goal_id,
          milestoneId: task.milestone_id,
          scheduledDate: task.scheduled_date,
          notes: task.notes,
          creationSource: 'manual' as const,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
        }));

        setSomedayTasks(convertedTasks);
      } else {
        // TODO: WatermelonDB implementation when enabled
        setSomedayTasks([]);
      }
    } catch (error) {
      console.error('Error fetching someday tasks:', error);
      setSomedayTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSomedayTasks();
  }, []);

  const toggleTaskComplete = async (taskId: string) => {
    try {
      if (!DB_CONFIG.USE_WATERMELON) {
        const currentTask = somedayTasks.find(t => t.id === taskId);
        if (currentTask) {
          await mockDatabase.updateTask(taskId, { 
            is_complete: !currentTask.isComplete 
          });
          await fetchSomedayTasks(); // Refresh data
        }
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  return {
    somedayTasks,
    isLoading,
    refreshSomedayTasks: fetchSomedayTasks,
    toggleTaskComplete,
  };
}
