// Core Types for Goalz AI

export interface Task {
  id: string;
  title: string;
  isFrog: boolean; // Match database model field name
  isComplete: boolean; // Match database model field name
  goalId?: string;
  milestoneId?: string;
  scheduledDate?: string | null; // ISO 8601 string or null for someday tasks
  notes?: string;
  creationSource?: 'spark' | 'manual'; // Add creation source field
  focusSessions?: FocusSession[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  feelings?: string[]; // Match database model field name
  emotions?: string[]; // For component compatibility
  visionImageUrl?: string;
  visionImages?: string[];
  milestones?: Milestone[]; // Make optional since it's a relation
  progress?: number; // For component compatibility
  isCompleted: boolean;
  completedAt?: number; // Unix timestamp to match database model
  reflectionAnswers?: {
    takeaways?: string;
    challengeConquered?: string;
    futureImprovement?: string;
  };
  notes?: string;
  creationSource?: 'spark' | 'manual'; // Add creation source field
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  goalId: string;
  targetDate?: string; // ISO 8601 string to match database model
  notes?: string;
  isComplete: boolean; // Match database model field name
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
