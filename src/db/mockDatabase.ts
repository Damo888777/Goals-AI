import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB_CONFIG } from './config';

// Mock database service for Expo Go compatibility
export interface MockGoal {
  id: string;
  title: string;
  feelings: string[];
  vision_image_url?: string;
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MockMilestone {
  id: string;
  goal_id: string;
  title: string;
  target_date?: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockTask {
  id: string;
  goal_id?: string;
  milestone_id?: string;
  title: string;
  notes?: string;
  scheduled_date?: string;
  is_frog: boolean;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockData {
  goals: MockGoal[];
  milestones: MockMilestone[];
  tasks: MockTask[];
}

class MockDatabaseService {
  private async getData(): Promise<MockData> {
    try {
      const data = await AsyncStorage.getItem(DB_CONFIG.MOCK_STORAGE_KEY);
      return data ? JSON.parse(data) : { goals: [], milestones: [], tasks: [] };
    } catch (error) {
      console.error('Error reading mock data:', error);
      return { goals: [], milestones: [], tasks: [] };
    }
  }

  private async saveData(data: MockData): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_CONFIG.MOCK_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving mock data:', error);
    }
  }

  // Goals
  async getGoals(): Promise<MockGoal[]> {
    const data = await this.getData();
    return data.goals;
  }

  async createGoal(goal: Omit<MockGoal, 'id' | 'created_at' | 'updated_at'>): Promise<MockGoal> {
    const data = await this.getData();
    const newGoal: MockGoal = {
      ...goal,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.goals.push(newGoal);
    await this.saveData(data);
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<MockGoal>): Promise<MockGoal | null> {
    const data = await this.getData();
    const goalIndex = data.goals.findIndex(g => g.id === id);
    if (goalIndex === -1) return null;
    
    data.goals[goalIndex] = {
      ...data.goals[goalIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await this.saveData(data);
    return data.goals[goalIndex];
  }

  async deleteGoal(id: string): Promise<boolean> {
    const data = await this.getData();
    const initialLength = data.goals.length;
    data.goals = data.goals.filter(g => g.id !== id);
    // Also delete related milestones and tasks
    data.milestones = data.milestones.filter(m => m.goal_id !== id);
    data.tasks = data.tasks.filter(t => t.goal_id !== id);
    await this.saveData(data);
    return data.goals.length < initialLength;
  }

  // Tasks
  async getTasks(): Promise<MockTask[]> {
    const data = await this.getData();
    return data.tasks;
  }

  async getTodaysTasks(): Promise<MockTask[]> {
    const data = await this.getData();
    const today = new Date().toISOString().split('T')[0];
    return data.tasks.filter(task => 
      task.scheduled_date?.startsWith(today) || task.is_frog
    );
  }

  async createTask(task: Omit<MockTask, 'id' | 'created_at' | 'updated_at'>): Promise<MockTask> {
    const data = await this.getData();
    const newTask: MockTask = {
      ...task,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.tasks.push(newTask);
    await this.saveData(data);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<MockTask>): Promise<MockTask | null> {
    const data = await this.getData();
    const taskIndex = data.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;
    
    data.tasks[taskIndex] = {
      ...data.tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await this.saveData(data);
    return data.tasks[taskIndex];
  }

  async deleteTask(id: string): Promise<boolean> {
    const data = await this.getData();
    const initialLength = data.tasks.length;
    data.tasks = data.tasks.filter(t => t.id !== id);
    await this.saveData(data);
    return data.tasks.length < initialLength;
  }

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(DB_CONFIG.MOCK_STORAGE_KEY);
  }
}

export const mockDatabase = new MockDatabaseService();
