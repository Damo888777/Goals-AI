import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import database from '../db';
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
      const { weekDays: initialWeekDays } = getCurrentWeekDates();
      
      // Get start and end of the week for database query
      const startOfWeek = new Date(initialWeekDays[0].dateObj);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(initialWeekDays[6].dateObj);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Fetch all tasks for the week
      const tasksCollection = database.get<Task>('tasks');
      const weekTasks = await tasksCollection
        .query(
          Q.where('scheduled_date', Q.gte(startOfWeek.toISOString())),
          Q.where('scheduled_date', Q.lte(endOfWeek.toISOString()))
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

        // Convert WatermelonDB tasks to TaskType
        const convertedTasks: TaskType[] = dayTasks.map((task: Task) => ({
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

        return {
          ...day,
          tasks: convertedTasks
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
    fetchWeeklyTasks();
  }, [weekOffset]);

  // Subscribe to task changes
  useEffect(() => {
    const tasksCollection = database.get<Task>('tasks');
    const subscription = tasksCollection.query().observe().subscribe(() => {
      fetchWeeklyTasks();
    });

    return () => subscription.unsubscribe();
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
