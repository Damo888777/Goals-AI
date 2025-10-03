import { DB_CONFIG } from './config';

// Conditional imports for Expo Go compatibility
let database: any = null;

if (DB_CONFIG.USE_WATERMELON) {
  // Only import WatermelonDB when needed (for development builds)
  const { Database } = require('@nozbe/watermelondb');
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  
  const schema = require('./schema').default;
  const Profile = require('./models/Profile').default;
  const Goal = require('./models/Goal').default;
  const Milestone = require('./models/Milestone').default;
  const Task = require('./models/Task').default;

  // Create the adapter to the underlying database:
  const adapter = new SQLiteAdapter({
    dbName: 'GoalzAI.db',
    schema,
  });

  // Make a Watermelon database from it!
  database = new Database({
    adapter,
    modelClasses: [
      Profile,
      Goal,
      Milestone,
      Task,
    ],
  });
} else {
  // For Expo Go, use mock database
  console.log('🚀 Running in Expo Go mode - using mock database');
}

export default database;
