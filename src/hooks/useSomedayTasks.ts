import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import database from '../db';
import { getCurrentUserId } from '../services/syncService';
import Task from '../db/models/Task';
import type { Task as TaskType } from '../types';

export function useSomedayTasks() {
  const [somedayTasks, setSomedayTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSomedayTasks = async () => {
    try {
      setIsLoading(true);
      
      if (!database) {
        console.log('WatermelonDB not available, using empty tasks array');
        setSomedayTasks([]);
        setIsLoading(false);
        return;
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const tasksCollection = database.get<Task>('tasks');
      
      // Get tasks that are not completed and have no scheduled date (someday tasks)
      const subscription = tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('is_complete', false),
          Q.where('scheduled_date', null)
        )
        .observe()
        .subscribe((tasks) => {
          setSomedayTasks(tasks as TaskType[]);
          setIsLoading(false);
        });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error fetching someday tasks:', error);
      setSomedayTasks([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupSubscription = async () => {
      unsubscribe = await fetchSomedayTasks();
    };
    
    setupSubscription();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const toggleTaskComplete = async (taskId: string) => {
    try {
      if (!database) throw new Error('WatermelonDB not available');
      
      await database.write(async () => {
        const task = await database!.get<Task>('tasks').find(taskId);
        await task.update(() => {
          task.isComplete = true;
          task.completedAt = new Date();
        });
      });
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const createSomedayTask = async (taskData: {
    title: string;
    goalId?: string;
    milestoneId?: string;
    notes?: string;
    creationSource?: 'spark' | 'manual';
  }) => {
    try {
      if (!database) throw new Error('WatermelonDB not available');
      
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      await database.write(async () => {
        const tasksCollection = database!.get<Task>('tasks');
        await tasksCollection.create((task) => {
          task.userId = userId;
          task.title = taskData.title;
          task.goalId = taskData.goalId;
          task.milestoneId = taskData.milestoneId;
          task.notes = taskData.notes;
          task.setScheduledDate(null); // No scheduled date = someday task
          task.isFrog = false;
          task.isComplete = false;
          task.creationSource = taskData.creationSource || 'manual';
        });
      });
    } catch (error) {
      console.error('Error creating someday task:', error);
      throw error;
    }
  };

  return {
    somedayTasks,
    isLoading,
    refreshSomedayTasks: fetchSomedayTasks,
    toggleTaskComplete,
    createSomedayTask,
  };
}
