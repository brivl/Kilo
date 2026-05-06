import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import type { TrainingPlanExercise } from '@/db/models/TrainingPlanExercise';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';

import { useToastStore } from './toastStore';

export async function createPlan(name: string): Promise<string> {
  try {
    let id = '';
    await database.write(async () => {
      const plan = await database.collections.get<TrainingPlan>('training_plans').create(r => {
        r.name = name;
      });
      id = plan.id;
    });
    return id;
  } catch (e) {
    console.error('trainingPlanStore.createPlan failed', e);
    useToastStore.getState().showToast("Couldn't create plan", 'error');
    throw e;
  }
}

export async function deletePlan(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const exercises = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .query(Q.where('plan_id', id))
        .fetch();
      for (const ex of exercises) await ex.destroyPermanently();
      const plan = await database.collections.get<TrainingPlan>('training_plans').find(id);
      await plan.destroyPermanently();
    });
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
    await database.write(async () => {
      await database.collections.get<TrainingPlanExercise>('training_plan_exercises').create(r => {
        r.planId = input.planId;
        r.day = input.day;
        r.exerciseName = input.exerciseName;
        r.targetSets = input.targetSets;
        r.targetReps = input.targetReps;
        r.targetWeightKg = input.targetWeightKg;
        r.orderIndex = input.orderIndex;
      });
    });
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
    await database.write(async () => {
      const plan = await database.collections.get<TrainingPlan>('training_plans').find(planId);
      const exercises = await database.collections
        .get<TrainingPlanExercise>('training_plan_exercises')
        .query(Q.where('plan_id', planId), Q.where('day', day), Q.sortBy('order_index', Q.asc))
        .fetch();

      const session = await database.collections
        .get<WorkoutSession>('workout_sessions')
        .create(r => {
          r.date = sessionDate;
          r.name = `${plan.name} — ${day}`;
          r.notes = null;
          r.durationMin = null;
          r.planId = planId;
        });
      sessionId = session.id;

      for (const ex of exercises) {
        for (let i = 0; i < ex.targetSets; i++) {
          await database.collections.get<WorkoutSet>('workout_sets').create(r => {
            r.sessionId = session.id;
            r.exerciseName = ex.exerciseName;
            r.setNumber = i + 1;
            r.reps = ex.targetReps;
            r.weightKg = ex.targetWeightKg;
            r.rpe = null;
          });
        }
      }
    });
    return sessionId;
  } catch (e) {
    console.error('trainingPlanStore.launchSessionFromPlan failed', e);
    useToastStore.getState().showToast("Couldn't launch session", 'error');
    throw e;
  }
}
