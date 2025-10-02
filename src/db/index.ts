import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import Profile from './models/Profile'
import Goal from './models/Goal'
import Milestone from './models/Milestone'
import Task from './models/Task'

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  dbName: 'GoalzAI.db',
  schema,
})

// Then, make a Watermelon database from it!
const database = new Database({
  adapter,
  modelClasses: [
    Profile,
    Goal,
    Milestone,
    Task,
  ],
})

export default database
