import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import migrations from '@/db/migrations';
import { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import { FoodEntry } from '@/db/models/FoodEntry';
import { MealTemplate } from '@/db/models/MealTemplate';
import { MealTemplateItem } from '@/db/models/MealTemplateItem';
import { WorkoutSession } from '@/db/models/WorkoutSession';
import { WorkoutSet } from '@/db/models/WorkoutSet';
import schema from '@/db/schema';

export function makeTestDatabase(): Database {
  const adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
  return new Database({
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
}
