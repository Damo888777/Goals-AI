// Core Types for Goalz AI

export interface Task {
  id: string;
  title: string;
  isEatTheFrog: boolean;
  isCompleted: boolean;
  goalId?: string;
  milestoneId?: string;
  dueDate?: Date;
  notes?: string;
  focusSessions?: FocusSession[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  emotions: string[];
  visionImages?: string[];
  milestones: Milestone[];
  progress: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  goalId: string;
  dueDate?: Date;
  notes?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FocusSession {
  id: string;
  taskId: string;
  duration: number; // in seconds
  completedAt: Date;
}

export interface VisionImage {
  id: string;
  url: string;
  goalId?: string;
  createdAt: Date;
}

export interface UserStats {
  eatTheFrogStreak: number;
  goalsAchieved: number;
  totalFocusSessions: number;
}

export type EmotionType = 'happy' | 'proud' | 'excited' | 'grateful' | 'confident' | 'peaceful';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
