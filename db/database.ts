import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import migrations from './migrations';
import { BodyWeightEntry } from './models/BodyWeightEntry';
import { FoodEntry } from './models/FoodEntry';
import { MealTemplate } from './models/MealTemplate';
import { MealTemplateItem } from './models/MealTemplateItem';
import { TrainingPlan } from './models/TrainingPlan';
import { TrainingPlanExercise } from './models/TrainingPlanExercise';
import { WorkoutSession } from './models/WorkoutSession';
import { WorkoutSet } from './models/WorkoutSet';
import schema from './schema';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: process.env.NODE_ENV !== 'test',
  onSetUpError: e => console.error('DB setup error', e),
});

export const database = new Database({
  adapter,
  modelClasses: [
    FoodEntry,
    WorkoutSession,
    WorkoutSet,
    BodyWeightEntry,
    MealTemplate,
    MealTemplateItem,
    TrainingPlan,
    TrainingPlanExercise,
  ],
});
