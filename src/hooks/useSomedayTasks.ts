import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import database from '../db';
import Task from '../db/models/Task';
import type { Task as TaskType } from '../types';

export function useSomedayTasks() {
  const [somedayTasks, setSomedayTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSomedayTasks = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tasks without scheduled dates (someday tasks)
      const tasksCollection = database.get<Task>('tasks');
      const tasks = await tasksCollection
        .query(
          Q.or(
            Q.where('scheduled_date', null),
            Q.where('scheduled_date', '')
          )
        )
        .fetch();

      // Convert WatermelonDB tasks to TaskType
      const convertedTasks: TaskType[] = tasks.map((task: Task) => ({
        id: task.id,
        title: task.title,
        isFrog: task.isFrog,
        isComplete: task.isComplete,
        goalId: task.goalId,
        milestoneId: task.milestoneId,
        scheduledDate: task.scheduledDate,
        notes: task.notes,
        creationSource: task.creationSource,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }));

      setSomedayTasks(convertedTasks);
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

  // Subscribe to task changes
  useEffect(() => {
    const tasksCollection = database.get<Task>('tasks');
    const subscription = tasksCollection.query().observe().subscribe(() => {
      fetchSomedayTasks();
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTaskComplete = async (taskId: string) => {
    try {
      const tasksCollection = database.get<Task>('tasks');
      const task = await tasksCollection.find(taskId);
      
      await database.write(async () => {
        await task.update((task: Task) => {
          task.isComplete = !task.isComplete;
        });
      });
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
