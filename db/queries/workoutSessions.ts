import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { WorkoutSession } from '@/db/models/WorkoutSession';

export function observeSessionsForDate(dateISO: string) {
  return database.collections
    .get<WorkoutSession>('workout_sessions')
    .query(Q.where('date', dateISO), Q.sortBy('created_at', Q.asc))
    .observe();
}

export function observeAllSessions() {
  return database.collections
    .get<WorkoutSession>('workout_sessions')
    .query(Q.sortBy('created_at', Q.desc))
    .observe();
}
