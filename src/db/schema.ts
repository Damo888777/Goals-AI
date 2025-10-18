import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 8,
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
        { name: 'reflection_answers', type: 'string', isOptional: true }, // JSON string for reflection data
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
    tableSchema({
      name: 'pomodoro_sessions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'session_type', type: 'string' }, // 'work', 'short_break', 'long_break'
        { name: 'duration_minutes', type: 'number' },
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'task_time_tracking',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'total_pomodoro_sessions', type: 'number' },
        { name: 'total_minutes_focused', type: 'number' },
        { name: 'last_session_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'subscriptions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'subscription_tier', type: 'string' }, // 'starter', 'achiever', 'visionary'
        { name: 'product_id', type: 'string' },
        { name: 'transaction_id', type: 'string' },
        { name: 'original_transaction_id', type: 'string' },
        { name: 'purchased_at', type: 'number' }, // Unix timestamp
        { name: 'expires_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'is_active', type: 'boolean' },
        { name: 'is_trial', type: 'boolean' },
        { name: 'is_cancelled', type: 'boolean' },
        { name: 'cancelled_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'cancel_reason', type: 'string', isOptional: true },
        { name: 'expired_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'has_billing_issue', type: 'boolean' },
        { name: 'billing_issue_detected_at', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'environment', type: 'string' }, // 'production', 'sandbox'
        { name: 'store', type: 'string' }, // 'app_store', 'play_store'
        { name: 'country_code', type: 'string', isOptional: true },
        { name: 'currency', type: 'string', isOptional: true },
        { name: 'price', type: 'number', isOptional: true },
        { name: 'entitlement_ids', type: 'string', isOptional: true }, // JSON string for array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'subscription_usage',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'subscription_tier', type: 'string' }, // 'starter', 'achiever', 'visionary'
        { name: 'spark_ai_voice_inputs_used', type: 'number' },
        { name: 'spark_ai_vision_images_used', type: 'number' },
        { name: 'active_goals_count', type: 'number' },
        { name: 'period_start', type: 'number' }, // Unix timestamp
        { name: 'period_end', type: 'number', isOptional: true }, // Unix timestamp
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})
