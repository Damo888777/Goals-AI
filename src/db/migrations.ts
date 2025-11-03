import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    // Migration from version 9 to 10: Add actual_duration_seconds to pomodoro_sessions
    {
      toVersion: 10,
      steps: [
        addColumns({
          table: 'pomodoro_sessions',
          columns: [
            { name: 'actual_duration_seconds', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
    // Migration from version 10 to 11: Add name to profiles
    {
      toVersion: 11,
      steps: [
        addColumns({
          table: 'profiles',
          columns: [
            { name: 'name', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
})
