import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { WorkoutSet } from '@/db/models/WorkoutSet';

export function observeSetsForSession(sessionId: string) {
  return database.collections
    .get<WorkoutSet>('workout_sets')
    .query(
      Q.where('session_id', sessionId),
      Q.sortBy('exercise_name', Q.asc),
      Q.sortBy('set_number', Q.asc),
    )
    .observe();
}
