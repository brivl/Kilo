import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import type { TrainingPlanExercise } from '@/db/models/TrainingPlanExercise';

export function observeAllPlans() {
  return database.collections
    .get<TrainingPlan>('training_plans')
    .query(Q.sortBy('created_at', Q.desc))
    .observe();
}

export function observeExercisesForPlan(planId: string) {
  return database.collections
    .get<TrainingPlanExercise>('training_plan_exercises')
    .query(Q.where('plan_id', planId), Q.sortBy('day', Q.asc), Q.sortBy('order_index', Q.asc))
    .observe();
}
