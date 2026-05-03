import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import schema from '@/db/schema';
import migrations from '@/db/migrations';
import { FoodEntry } from '@/db/models/FoodEntry';
import { WorkoutSession } from '@/db/models/WorkoutSession';
import { WorkoutSet } from '@/db/models/WorkoutSet';
import { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import { MealTemplate } from '@/db/models/MealTemplate';
import { MealTemplateItem } from '@/db/models/MealTemplateItem';

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
