import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'food_entries',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'meal_type', type: 'string' },
        { name: 'food_name', type: 'string' },
        { name: 'calories', type: 'number' },
        { name: 'protein_g', type: 'number' },
        { name: 'carbs_g', type: 'number' },
        { name: 'fat_g', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'source', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'duration_min', type: 'number', isOptional: true },
        { name: 'plan_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_sets',
      columns: [
        { name: 'session_id', type: 'string' },
        { name: 'exercise_name', type: 'string' },
        { name: 'set_number', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'weight_kg', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'rest_seconds', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'body_weight_entries',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'weight_kg', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'meal_templates',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'meal_template_items',
      columns: [
        { name: 'meal_template_id', type: 'string' },
        { name: 'food_name', type: 'string' },
        { name: 'calories', type: 'number' },
        { name: 'protein_g', type: 'number' },
        { name: 'carbs_g', type: 'number' },
        { name: 'fat_g', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
})
