import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import database from '../db';
import { getCurrentUserId } from '../services/syncService';
import Task from '../db/models/Task';
import type { Task as TaskType } from '../types';

interface WeekDay {
  name: string;
  date: string;
  tasks: TaskType[];
  dateObj: Date;
}

export function useWeeklyTasks(weekOffset: number = 0) {
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
    
    const formatDate = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]}.${String(date.getDate()).padStart(2, '0')}.${date.getFullYear()}`;
    };
    
    const weekDays: WeekDay[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDays.push({
        name: dayNames[i],
        date: formatDate(date),
        dateObj: new Date(date),
        tasks: []
      });
    }
    
    return {
      weekDays,
      startDate: formatDate(monday),
      endDate: formatDate(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000))
    };
  };

  const fetchWeeklyTasks = async () => {
    try {
      setIsLoading(true);
      
      if (!database) {
        console.log('WatermelonDB not available, using empty week structure');
        const { weekDays: fallbackWeekDays } = getCurrentWeekDates();
        setWeekDays(fallbackWeekDays);
        return;
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        const { weekDays: fallbackWeekDays } = getCurrentWeekDates();
        setWeekDays(fallbackWeekDays);
        return;
      }

      const { weekDays: initialWeekDays } = getCurrentWeekDates();
      const tasksCollection = database.get<Task>('tasks');

      // Get start and end dates for the week
      const startDate = initialWeekDays[0].dateObj; // Monday
      const endDate = initialWeekDays[6].dateObj;   // Sunday
      endDate.setHours(23, 59, 59, 999); // End of Sunday

      // Query tasks for the entire week
      const weekTasks = await tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('is_complete', false),
          Q.where('scheduled_date', Q.gte(startDate.toISOString())),
          Q.where('scheduled_date', Q.lte(endDate.toISOString()))
        )
        .fetch();

      // Group tasks by day
      const updatedWeekDays = initialWeekDays.map(day => {
        const dayStart = new Date(day.dateObj);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day.dateObj);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTasks = weekTasks.filter(task => {
          if (!task.scheduledDate) return false;
          const taskDate = new Date(task.scheduledDate);
          return taskDate >= dayStart && taskDate <= dayEnd;
        });

        return {
          ...day,
          tasks: dayTasks.map(task => ({
            id: task.id,
            title: task.title,
            notes: task.notes || '',
            isComplete: task.isComplete,
            isFrog: task.isFrog,
            scheduledDate: task.scheduledDate,
            goalId: task.goalId,
            milestoneId: task.milestoneId,
            userId: task.userId,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          }))
        };
      });

      setWeekDays(updatedWeekDays);
    } catch (error) {
      console.error('Error fetching weekly tasks:', error);
      // Fallback to empty week structure
      const { weekDays: fallbackWeekDays } = getCurrentWeekDates();
      setWeekDays(fallbackWeekDays);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let subscription: any;

    const setupObserver = async () => {
      if (!database) {
        fetchWeeklyTasks();
        return;
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        fetchWeeklyTasks();
        return;
      }

      const tasksCollection = database.get<Task>('tasks');
      
      // Set up real-time observer for tasks
      subscription = tasksCollection
        .query(Q.where('user_id', userId))
        .observe()
        .subscribe(() => {
          // Re-fetch and group tasks whenever they change
          fetchWeeklyTasks();
        });
    };

    setupObserver();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [weekOffset]);

  const getWeekRange = () => {
    const { startDate, endDate } = getCurrentWeekDates();
    return { startDate, endDate };
  };

  return {
    weekDays,
    isLoading,
    refreshWeeklyTasks: fetchWeeklyTasks,
    getWeekRange,
  };
}
