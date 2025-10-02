import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'feelings', type: 'string', isOptional: true }, // JSON string for feelings array
        { name: 'vision_image_url', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'milestones',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'goal_id', type: 'string', isIndexed: true },
        { name: 'target_date', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'is_complete', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'is_complete', type: 'boolean' },
        { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'milestone_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'scheduled_date', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'is_frog', type: 'boolean' }, // "Eat the frog" - most important task
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})
