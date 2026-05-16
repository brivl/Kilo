import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';
import { serializeWorkoutSession, serializeWorkoutSet } from '@/db/sync/serializers';

import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

export async function createSession(input: {
  date: string;
  name: string;
  notes?: string;
}): Promise<string> {
  try {
    let id = '';
    let created: WorkoutSession | undefined;
    await database.write(async () => {
      created = await database.collections.get<WorkoutSession>('workout_sessions').create(r => {
        r.date = input.date;
        r.name = input.name;
        r.notes = input.notes ?? null;
        r.durationMin = null;
        r.planId = null;
      });
      id = created.id;
    });
    if (created)
      syncUpsert(
        'workout_sessions',
        serializeWorkoutSession(created) as unknown as Record<string, unknown>,
      );
    return id;
  } catch (e) {
    console.error('workoutStore.createSession failed', e);
    useToastStore.getState().showToast("Couldn't create workout", 'error');
    throw e;
  }
}

export async function updateSession(
  id: string,
  input: { name?: string; notes?: string; durationMin?: number | null },
): Promise<void> {
  try {
    let updated: WorkoutSession | undefined;
    await database.write(async () => {
      const session = await database.collections.get<WorkoutSession>('workout_sessions').find(id);
      updated = await session.update(r => {
        if (input.name !== undefined) r.name = input.name;
        if (input.notes !== undefined) r.notes = input.notes;
        if (input.durationMin !== undefined) r.durationMin = input.durationMin;
      });
    });
    if (updated)
      syncUpsert(
        'workout_sessions',
        serializeWorkoutSession(updated) as unknown as Record<string, unknown>,
      );
  } catch (e) {
    console.error('workoutStore.updateSession failed', e);
    useToastStore.getState().showToast("Couldn't update workout", 'error');
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    let setIds: string[] = [];
    await database.write(async () => {
      const session = await database.collections.get<WorkoutSession>('workout_sessions').find(id);
      const sessionSets = await database.collections
        .get<WorkoutSet>('workout_sets')
        .query(Q.where('session_id', id))
        .fetch();
      setIds = sessionSets.map(s => s.id);
      for (const s of sessionSets) await s.destroyPermanently();
      await session.destroyPermanently();
    });
    for (const setId of setIds) syncDelete('workout_sets', setId);
    syncDelete('workout_sessions', id);
  } catch (e) {
    console.error('workoutStore.deleteSession failed', e);
    useToastStore.getState().showToast("Couldn't delete workout", 'error');
  }
}

export async function addSet(input: {
  sessionId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
}): Promise<void> {
  try {
    let created: WorkoutSet | undefined;
    await database.write(async () => {
      created = await database.collections.get<WorkoutSet>('workout_sets').create(r => {
        r.sessionId = input.sessionId;
        r.exerciseName = input.exerciseName;
        r.setNumber = input.setNumber;
        r.reps = input.reps;
        r.weightKg = input.weightKg;
        r.rpe = input.rpe ?? null;
      });
    });
    if (created)
      syncUpsert(
        'workout_sets',
        serializeWorkoutSet(created) as unknown as Record<string, unknown>,
      );
  } catch (e) {
    console.error('workoutStore.addSet failed', e);
    useToastStore.getState().showToast("Couldn't save set", 'error');
    throw e;
  }
}

export async function deleteSet(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const set = await database.collections.get<WorkoutSet>('workout_sets').find(id);
      await set.destroyPermanently();
    });
    syncDelete('workout_sets', id);
  } catch (e) {
    console.error('workoutStore.deleteSet failed', e);
    useToastStore.getState().showToast("Couldn't delete set", 'error');
  }
}
