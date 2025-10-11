import { useState, useEffect } from 'react';
import { DB_CONFIG } from '../db/config';
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
      
      // Use WatermelonDB for all data - mock database removed
      const { weekDays: fallbackWeekDays } = getCurrentWeekDates();
      setWeekDays(fallbackWeekDays);
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
