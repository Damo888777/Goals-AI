import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 5,
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
        { name: 'feelings', type: 'string', isOptional: true }, // JSON string for feelings array
        { name: 'vision_image_url', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'creation_source', type: 'string' }, // 'spark' or 'manual'
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
        { name: 'target_date', type: 'string', isOptional: true }, // ISO 8601 string
        { name: 'is_complete', type: 'boolean' },
        { name: 'creation_source', type: 'string' }, // 'spark' or 'manual'
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
        { name: 'scheduled_date', type: 'string', isOptional: true }, // ISO 8601 string
        { name: 'is_frog', type: 'boolean' }, // "Eat the frog" - most important task
        { name: 'is_complete', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'creation_source', type: 'string' }, // 'spark' or 'manual'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'vision_images',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'image_uri', type: 'string' },
        { name: 'aspect_ratio', type: 'number' },
        { name: 'source', type: 'string' }, // 'generated' or 'uploaded'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})
