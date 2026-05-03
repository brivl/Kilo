import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';
import { FoodEntry } from './models/FoodEntry';
import { WorkoutSession } from './models/WorkoutSession';
import { WorkoutSet } from './models/WorkoutSet';
import { BodyWeightEntry } from './models/BodyWeightEntry';
import { MealTemplate } from './models/MealTemplate';
import { MealTemplateItem } from './models/MealTemplateItem';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
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
  ],
});
