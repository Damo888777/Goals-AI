const { Database } = require('@nozbe/watermelondb')
const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default
const { appSchema, tableSchema } = require('@nozbe/watermelondb')
const fs = require('fs')
const path = require('path')

// Define the schema (same as in src/db/schema.ts but in CommonJS format)
const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'profiles',
      columns: [
        { name: 'email', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'feelings', type: 'string', isOptional: true },
        { name: 'vision_image_url', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'milestones',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'goal_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'target_date', type: 'string', isOptional: true },
        { name: 'is_complete', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'milestone_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'scheduled_date', type: 'string', isOptional: true },
        { name: 'is_frog', type: 'boolean' },
        { name: 'is_complete', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})

async function generateDatabase() {
  try {
    console.log('🚀 Starting database generation...')
    
    // Ensure the db directory exists
    const dbDir = path.join(__dirname, 'db')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
      console.log('📁 Created db directory')
    }

    const dbPath = path.join(dbDir, 'GoalzAI.db')
    
    // Remove existing database file if it exists
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
      console.log('🗑️  Removed existing database file')
    }

    // Create the adapter with Node.js SQLite
    const adapter = new SQLiteAdapter({
      dbName: dbPath,
      schema,
    })

    // Create the database instance
    const database = new Database({
      adapter,
      modelClasses: [], // No models needed for schema creation
    })

    console.log('✅ Database created successfully at:', dbPath)
    console.log('📊 Schema applied with tables: profiles, goals, milestones, tasks')
    
    // Close the database connection if method exists
    if (database.adapter.close) {
      await database.adapter.close()
      console.log('🔒 Database connection closed')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error generating database:', error)
    process.exit(1)
  }
}

// Run the generation
generateDatabase()
