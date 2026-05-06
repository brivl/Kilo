import { createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'training_plans',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'created_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'training_plan_exercises',
          columns: [
            { name: 'plan_id', type: 'string' },
            { name: 'day', type: 'string' },
            { name: 'exercise_name', type: 'string' },
            { name: 'target_sets', type: 'number' },
            { name: 'target_reps', type: 'number' },
            { name: 'target_weight_kg', type: 'number' },
            { name: 'order_index', type: 'number' },
            { name: 'created_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
