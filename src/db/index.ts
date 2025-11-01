import { DB_CONFIG } from './config';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';

// UUID v4 generator for Supabase compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
import Profile from './models/Profile';
import Goal from './models/Goal'
import Milestone from './models/Milestone'
import Task from './models/Task'
import VisionImage from './models/VisionImage'
import PomodoroSession from './models/PomodoroSession'
import TaskTimeTracking from './models/TaskTimeTracking'
import Subscription from './models/Subscription'
import SubscriptionUsage from './models/SubscriptionUsage'

let database: Database | null = null;

if (DB_CONFIG.USE_WATERMELON) {
  try {
    console.log('🗄️ Initializing WatermelonDB...');
    
    // Create the adapter to the underlying database:
    const adapter = new SQLiteAdapter({
      dbName: 'GoalzAI.db',
      schema,
      // Configure to generate UUID-compatible IDs for Supabase compatibility
      jsi: true,
      onSetUpError: (error) => {
        console.error('SQLite setup error:', error);
      }
    });

    // Make a Watermelon database from it!
    database = new Database({
      adapter,
      modelClasses: [
        Profile,
        Goal,
        Milestone,
        Task,
        VisionImage,
        PomodoroSession,
        TaskTimeTracking,
        Subscription,
        SubscriptionUsage,
      ],
    });
    
    console.log('✅ WatermelonDB initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize WatermelonDB:', error);
    database = null;
  }
} else {
  console.log('🚀 Running in Expo Go mode - using mock database');
}

export default database;
