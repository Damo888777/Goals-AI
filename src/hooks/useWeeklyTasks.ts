import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { useTranslation } from 'react-i18next';
import database from '../db';
import { getCurrentUserId } from '../services/syncService';
import Task from '../db/models/Task';
import type { Task as TaskType } from '../types';
import { formatDate as formatDateUtil } from '../utils/dateFormatter';

interface WeekDay {
  name: string;
  date: string;
  tasks: TaskType[];
  dateObj: Date;
}

export function useWeeklyTasks(weekOffset: number = 0) {
  const { t } = useTranslation();
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
    
    const formatDate = (date: Date) => {
      return formatDateUtil(date, t);
    };
    
    const weekDays: WeekDay[] = [];
    const dayNames = [
      t('calendar.days.monday'),
      t('calendar.days.tuesday'), 
      t('calendar.days.wednesday'),
      t('calendar.days.thursday'),
      t('calendar.days.friday'),
      t('calendar.days.saturday'),
      t('calendar.days.sunday')
    ];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(0, 0, 0, 0); // Set to midnight to avoid timezone issues
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
      const startDate = new Date(initialWeekDays[0].dateObj); // Monday
      startDate.setHours(0, 0, 0, 0); // Start of Monday at midnight
      const endDate = new Date(initialWeekDays[6].dateObj);   // Sunday
      endDate.setHours(23, 59, 59, 999); // End of Sunday

      // First, let's see ALL tasks for this user
      const allUserTasks = await tasksCollection
        .query(Q.where('user_id', userId))
        .fetch();
      
      console.log('👤 User ID:', userId);
      console.log('📊 All user tasks:', allUserTasks.length, allUserTasks.map(t => ({ 
        title: t.title, 
        scheduledDate: t.scheduledDate, 
        isComplete: t.isComplete 
      })));
      
      // Try a simpler query first - tasks with scheduled dates
      const tasksWithDates = await tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('scheduled_date', Q.notEq(null))
        )
        .fetch();
      
      console.log('📆 Tasks with scheduled dates:', tasksWithDates.length, tasksWithDates.map(t => ({ 
        title: t.title, 
        scheduledDate: t.scheduledDate,
        isComplete: t.isComplete,
        goalId: t.goalId,
        milestoneId: t.milestoneId
      })));
      
      // Query tasks for the entire week
      const weekTasks = await tasksCollection
        .query(
          Q.where('user_id', userId),
          Q.where('is_complete', false),
          Q.where('scheduled_date', Q.gte(startDate.toISOString())),
          Q.where('scheduled_date', Q.lte(endDate.toISOString()))
        )
        .fetch();
      
      console.log('📅 Week range:', startDate.toISOString(), 'to', endDate.toISOString());
      console.log('📋 Found week tasks:', weekTasks.length, weekTasks.map(t => ({ title: t.title, scheduledDate: t.scheduledDate })));

      // Group tasks by day
      const updatedWeekDays = initialWeekDays.map(day => {
        const dayStart = new Date(day.dateObj);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day.dateObj);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTasks = weekTasks.filter(task => {
          if (!task.scheduledDate) return false;
          const taskDate = new Date(task.scheduledDate);
          
          // Compare dates in local time to avoid timezone shifts
          const taskDateLocal = taskDate.toDateString();
          const dayDateLocal = day.dateObj.toDateString();
          
          const isInRange = taskDateLocal === dayDateLocal;
          if (!isInRange && __DEV__) {
            console.log(`❌ Task "${task.title}" filtered out:`, {
              taskDate: taskDate.toISOString(),
              taskDateLocal,
              dayDateLocal,
              dayStart: dayStart.toISOString(),
              dayEnd: dayEnd.toISOString()
            });
          }
          return isInRange;
        });
        
        if (dayTasks.length > 0) {
          console.log(`✅ ${day.name} has ${dayTasks.length} tasks:`, dayTasks.map(t => t.title));
        }

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
            creationSource: task.creationSource, // Added missing field
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
