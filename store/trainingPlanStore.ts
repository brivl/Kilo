import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import type { TrainingPlanExercise } from '@/db/models/TrainingPlanExercise';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';
import {
  serializeTrainingPlan,
  serializeTrainingPlanExercise,
  serializeWorkoutSession,
  serializeWorkoutSet,
} from '@/db/sync/serializers';

import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

export async function createPlan(name: string): Promise<string> {
  try {
    let id = '';
    let created: TrainingPlan | undefined;
    await database.write(async () => {
      created = await database.collections.get<TrainingPlan>('training_plans').create(r => {
        r.name = name;
      });
      id = created.id;
    });
    if (created)
      syncUpsert(
        'training_plans',
        serializeTrainingPlan(created) as unknown as Record<string, unknown>,
      );
    return id;
  } catch (e) {
    console.error('trainingPlanStore.createPlan failed', e);
    useToastStore.getState().showToast("Couldn't create plan", 'error');
    throw e;
  }
}

export async function deletePlan(id: string): Promise<void> {
  try {
    let exerciseIds: string[] = [];
    await database.write(async () => {
      const exercises = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .query(Q.where('plan_id', id))
        .fetch();
      exerciseIds = exercises.map(e => e.id);
      for (const ex of exercises) await ex.destroyPermanently();
      const plan = await database.collections.get<TrainingPlan>('training_plans').find(id);
      await plan.destroyPermanently();
    });
    for (const exId of exerciseIds) syncDelete('training_plan_exercises', exId);
    syncDelete('training_plans', id);
  } catch (e) {
    console.error('trainingPlanStore.deletePlan failed', e);
    useToastStore.getState().showToast("Couldn't delete plan", 'error');
  }
}

export async function addExerciseToPlan(input: {
  planId: string;
  day: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number;
  orderIndex: number;
}): Promise<void> {
  try {
    let created: TrainingPlanExercise | undefined;
    await database.write(async () => {
      created = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .create(r => {
          r.planId = input.planId;
          r.day = input.day;
          r.exerciseName = input.exerciseName;
          r.targetSets = input.targetSets;
          r.targetReps = input.targetReps;
          r.targetWeightKg = input.targetWeightKg;
          r.orderIndex = input.orderIndex;
        });
    });
    if (created)
      syncUpsert(
        'training_plan_exercises',
        serializeTrainingPlanExercise(created) as unknown as Record<string, unknown>,
      );
  } catch (e) {
    console.error('trainingPlanStore.addExerciseToPlan failed', e);
    useToastStore.getState().showToast("Couldn't add exercise", 'error');
    throw e;
  }
}

export async function deletePlanExercise(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const ex = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .find(id);
      await ex.destroyPermanently();
    });
    syncDelete('training_plan_exercises', id);
  } catch (e) {
    console.error('trainingPlanStore.deletePlanExercise failed', e);
    useToastStore.getState().showToast("Couldn't delete exercise", 'error');
  }
}

export async function launchSessionFromPlan(
  planId: string,
  day: string,
  sessionDate: string,
): Promise<string> {
  try {
    let sessionId = '';
    let createdSession: WorkoutSession | undefined;
    const createdSets: WorkoutSet[] = [];
    await database.write(async () => {
      const plan = await database.collections.get<TrainingPlan>('training_plans').find(planId);
      const exercises = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .query(Q.where('plan_id', planId), Q.where('day', day), Q.sortBy('order_index', Q.asc))
        .fetch();

      createdSession = await database.collections
        .get<WorkoutSession>('workout_sessions')
        .create(r => {
          r.date = sessionDate;
          r.name = `${plan.name} — ${day}`;
          r.notes = null;
          r.durationMin = null;
          r.planId = planId;
        });
      sessionId = createdSession.id;

      for (const ex of exercises) {
        for (let i = 0; i < ex.targetSets; i++) {
          const set = await database.collections.get<WorkoutSet>('workout_sets').create(r => {
            r.sessionId = createdSession!.id;
            r.exerciseName = ex.exerciseName;
            r.setNumber = i + 1;
            r.reps = ex.targetReps;
            r.weightKg = ex.targetWeightKg;
            r.rpe = null;
          });
          createdSets.push(set);
        }
      }
    });
    if (createdSession)
      syncUpsert(
        'workout_sessions',
        serializeWorkoutSession(createdSession) as unknown as Record<string, unknown>,
      );
    for (const set of createdSets) {
      syncUpsert('workout_sets', serializeWorkoutSet(set) as unknown as Record<string, unknown>);
    }
    return sessionId;
  } catch (e) {
    console.error('trainingPlanStore.launchSessionFromPlan failed', e);
    useToastStore.getState().showToast("Couldn't launch session", 'error');
    throw e;
  }
}
