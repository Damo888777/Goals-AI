import type { Goal, Milestone } from '../types';

interface ReflectionData {
  keyTakeaway: string;
  biggestHurdle: string;
  lessonForNext: string;
}

class GoalCompletionService {
  
  // Check if all milestones for a goal are completed
  checkMilestonesComplete(goalId: string, milestones: Milestone[]): boolean {
    const goalMilestones = milestones.filter(milestone => milestone.goalId === goalId);
    
    // If no milestones exist, goal cannot be completed through milestones
    if (goalMilestones.length === 0) {
      return false;
    }
    
    // Check if all milestones are completed
    return goalMilestones.every(milestone => milestone.isComplete);
  }

  // Calculate progress percentage for a goal
  calculateProgress(goalId: string, milestones: Milestone[]): number {
    const goalMilestones = milestones.filter(milestone => milestone.goalId === goalId);
    
    if (goalMilestones.length === 0) {
      return 0;
    }
    
    const completedMilestones = goalMilestones.filter(milestone => milestone.isComplete).length;
    return Math.round((completedMilestones / goalMilestones.length) * 100);
  }

  // Get goal milestones count info
  getMilestoneStats(goalId: string, milestones: Milestone[]): { completed: number; total: number } {
    const goalMilestones = milestones.filter(milestone => milestone.goalId === goalId);
    const completedMilestones = goalMilestones.filter(milestone => milestone.isComplete).length;
    
    return {
      completed: completedMilestones,
      total: goalMilestones.length
    };
  }

  // Format reflection data for storage
  formatReflectionData(reflectionData?: ReflectionData): string | null {
    if (!reflectionData) return null;
    
    const reflection = {
      keyTakeaway: reflectionData.keyTakeaway.trim(),
      biggestHurdle: reflectionData.biggestHurdle.trim(),
      lessonForNext: reflectionData.lessonForNext.trim(),
      completedAt: new Date().toISOString()
    };
    
    return JSON.stringify(reflection);
  }

  // Check if a milestone completion should trigger goal completion check
  shouldCheckGoalCompletion(milestone: Milestone, milestones: Milestone[]): boolean {
    // Only check if this milestone was just completed (isComplete = true)
    if (!milestone.isComplete || !milestone.goalId) {
      return false;
    }
    
    // Check if this milestone completion makes all milestones complete
    return this.checkMilestonesComplete(milestone.goalId, milestones);
  }
}

export const goalCompletionService = new GoalCompletionService();