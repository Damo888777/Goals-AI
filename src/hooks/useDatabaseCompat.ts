import { useEffect, useState } from 'react';
import { DB_CONFIG } from '../db/config';
import { mockDatabase, MockGoal, MockTask } from '../db/mockDatabase';

// Simplified hooks for Expo Go compatibility
// These work with mock data when WatermelonDB is disabled

export const useGoals = () => {
  const [goals, setGoals] = useState<MockGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!DB_CONFIG.USE_WATERMELON) {
      // Use mock database for Expo Go
      const fetchGoals = async () => {
        try {
          const mockGoals = await mockDatabase.getGoals();
          setGoals(mockGoals);
        } catch (error) {
          console.error('Error fetching goals:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchGoals();
    } else {
      // TODO: Use WatermelonDB when enabled
      setIsLoading(false);
    }
  }, []);

  const createGoal = async (goalData: {
    title: string;
    feelings?: string[];
    vision_image_url?: string;
    notes?: string;
  }) => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const newGoal = await mockDatabase.createGoal({
        title: goalData.title,
        feelings: goalData.feelings || [],
        vision_image_url: goalData.vision_image_url,
        notes: goalData.notes,
        is_completed: false,
      });
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    }
    // TODO: WatermelonDB implementation
  };

  const updateGoal = async (goalId: string, updates: Partial<MockGoal>) => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const updatedGoal = await mockDatabase.updateGoal(goalId, updates);
      if (updatedGoal) {
        setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      }
      return updatedGoal;
    }
    // TODO: WatermelonDB implementation
  };

  const deleteGoal = async (goalId: string) => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const success = await mockDatabase.deleteGoal(goalId);
      if (success) {
        setGoals(prev => prev.filter(g => g.id !== goalId));
      }
      return success;
    }
    // TODO: WatermelonDB implementation
  };

  const completeGoal = async (goalId: string) => {
    return updateGoal(goalId, { 
      is_completed: true, 
      completed_at: new Date().toISOString() 
    });
  };

  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
  };
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<MockTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const fetchTasks = async () => {
        try {
          const mockTasks = await mockDatabase.getTasks();
          setTasks(mockTasks);
        } catch (error) {
          console.error('Error fetching tasks:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTasks();
    } else {
      setIsLoading(false);
    }
  }, []);

  const createTask = async (taskData: {
    title: string;
    goal_id?: string;
    milestone_id?: string;
    notes?: string;
    scheduled_date?: string;
    is_frog?: boolean;
  }) => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const newTask = await mockDatabase.createTask({
        title: taskData.title,
        goal_id: taskData.goal_id,
        milestone_id: taskData.milestone_id,
        notes: taskData.notes,
        scheduled_date: taskData.scheduled_date,
        is_frog: taskData.is_frog || false,
        is_complete: false,
      });
      setTasks(prev => [...prev, newTask]);
      return newTask;
    }
    // TODO: WatermelonDB implementation
  };

  const updateTask = async (taskId: string, updates: Partial<MockTask>) => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const updatedTask = await mockDatabase.updateTask(taskId, updates);
      if (updatedTask) {
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      }
      return updatedTask;
    }
    // TODO: WatermelonDB implementation
  };

  const deleteTask = async (taskId: string) => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const success = await mockDatabase.deleteTask(taskId);
      if (success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
      return success;
    }
    // TODO: WatermelonDB implementation
  };

  const completeTask = async (taskId: string) => {
    return updateTask(taskId, { is_complete: true });
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
};

export const useTodaysTasks = () => {
  const [tasks, setTasks] = useState<MockTask[]>([]);
  const [frogTask, setFrogTask] = useState<MockTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!DB_CONFIG.USE_WATERMELON) {
      const fetchTodaysTasks = async () => {
        try {
          const todaysTasks = await mockDatabase.getTodaysTasks();
          setTasks(todaysTasks);
          setFrogTask(todaysTasks.find(task => task.is_frog) || null);
        } catch (error) {
          console.error('Error fetching today\'s tasks:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTodaysTasks();
    } else {
      setIsLoading(false);
    }
  }, []);

  const setFrogTaskForToday = async (taskId: string) => {
    if (!DB_CONFIG.USE_WATERMELON) {
      // Clear existing frog task
      const allTasks = await mockDatabase.getTasks();
      const today = new Date().toISOString().split('T')[0];
      
      for (const task of allTasks) {
        if (task.is_frog && task.scheduled_date?.startsWith(today)) {
          await mockDatabase.updateTask(task.id, { is_frog: false });
        }
      }
      
      // Set new frog task
      await mockDatabase.updateTask(taskId, { is_frog: true });
      
      // Refresh today's tasks
      const updatedTasks = await mockDatabase.getTodaysTasks();
      setTasks(updatedTasks);
      setFrogTask(updatedTasks.find(task => task.is_frog) || null);
    }
    // TODO: WatermelonDB implementation
  };

  return {
    tasks,
    frogTask,
    isLoading,
    setFrogTaskForToday,
  };
};

// Simplified auth hook for Expo Go (no Supabase)
export const useAuth = () => {
  return {
    user: { id: 'expo-go-user', email: null }, // Mock user for Expo Go
    isLoading: false,
    isAuthenticated: true,
    isAnonymous: true,
    signInAnonymously: async () => {},
    signOut: async () => {},
  };
};

// Simplified sync hook for Expo Go (no sync needed)
export const useSync = () => {
  return {
    isSyncing: false,
    lastSyncTime: null,
    sync: async () => {},
  };
};
