import type { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import type { FoodEntry } from '@/db/models/FoodEntry';
import type { MealTemplate } from '@/db/models/MealTemplate';
import type { MealTemplateItem } from '@/db/models/MealTemplateItem';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import type { TrainingPlanExercise } from '@/db/models/TrainingPlanExercise';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';

type Raw = Record<string, unknown> & { _status: 'synced'; _changed: '' };
const SYNCED_RAW = { _status: 'synced' as const, _changed: '' as const };

// food_entries
export interface FoodEntryRow {
  id: string;
  date: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity: number;
  unit: string;
  source: string;
  created_at: number;
}

export function serializeFoodEntry(m: FoodEntry): FoodEntryRow {
  return {
    id: m.id,
    date: m.date,
    meal_type: m.mealType,
    food_name: m.foodName,
    calories: m.calories,
    protein_g: m.proteinG,
    carbs_g: m.carbsG,
    fat_g: m.fatG,
    quantity: m.quantity,
    unit: m.unit,
    source: m.source,
    created_at: m.createdAt.getTime(),
  };
}

export function foodEntryRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    date: row.date,
    meal_type: row.meal_type,
    food_name: row.food_name,
    calories: row.calories,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    quantity: row.quantity,
    unit: row.unit,
    source: row.source,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// workout_sessions
export interface WorkoutSessionRow {
  id: string;
  date: string;
  name: string;
  notes: string | null;
  duration_min: number | null;
  plan_id: string | null;
  created_at: number;
}

export function serializeWorkoutSession(m: WorkoutSession): WorkoutSessionRow {
  return {
    id: m.id,
    date: m.date,
    name: m.name,
    notes: m.notes,
    duration_min: m.durationMin,
    plan_id: m.planId,
    created_at: m.createdAt.getTime(),
  };
}

export function workoutSessionRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    date: row.date,
    name: row.name,
    notes: row.notes,
    duration_min: row.duration_min,
    plan_id: row.plan_id,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// workout_sets
export interface WorkoutSetRow {
  id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe: number | null;
  rest_seconds: number | null;
  created_at: number;
}

export function serializeWorkoutSet(m: WorkoutSet): WorkoutSetRow {
  return {
    id: m.id,
    session_id: m.sessionId,
    exercise_name: m.exerciseName,
    set_number: m.setNumber,
    reps: m.reps,
    weight_kg: m.weightKg,
    rpe: m.rpe,
    rest_seconds: m.restSeconds,
    created_at: m.createdAt.getTime(),
  };
}

export function workoutSetRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    session_id: row.session_id,
    exercise_name: row.exercise_name,
    set_number: row.set_number,
    reps: row.reps,
    weight_kg: row.weight_kg,
    rpe: row.rpe,
    rest_seconds: row.rest_seconds,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// body_weight_entries
export interface BodyWeightEntryRow {
  id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
  created_at: number;
}

export function serializeBodyWeightEntry(m: BodyWeightEntry): BodyWeightEntryRow {
  return {
    id: m.id,
    date: m.date,
    weight_kg: m.weightKg,
    notes: m.notes,
    created_at: m.createdAt.getTime(),
  };
}

export function bodyWeightEntryRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    date: row.date,
    weight_kg: row.weight_kg,
    notes: row.notes,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// meal_templates
export interface MealTemplateRow {
  id: string;
  name: string;
  created_at: number;
}

export function serializeMealTemplate(m: MealTemplate): MealTemplateRow {
  return { id: m.id, name: m.name, created_at: m.createdAt.getTime() };
}

export function mealTemplateRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    name: row.name,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// meal_template_items
export interface MealTemplateItemRow {
  id: string;
  meal_template_id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity: number;
  unit: string;
  created_at: number;
}

export function serializeMealTemplateItem(m: MealTemplateItem): MealTemplateItemRow {
  return {
    id: m.id,
    meal_template_id: m.mealTemplateId,
    food_name: m.foodName,
    calories: m.calories,
    protein_g: m.proteinG,
    carbs_g: m.carbsG,
    fat_g: m.fatG,
    quantity: m.quantity,
    unit: m.unit,
    created_at: m.createdAt.getTime(),
  };
}

export function mealTemplateItemRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    meal_template_id: row.meal_template_id,
    food_name: row.food_name,
    calories: row.calories,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    quantity: row.quantity,
    unit: row.unit,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// training_plans
export interface TrainingPlanRow {
  id: string;
  name: string;
  created_at: number;
}

export function serializeTrainingPlan(m: TrainingPlan): TrainingPlanRow {
  return { id: m.id, name: m.name, created_at: m.createdAt.getTime() };
}

export function trainingPlanRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    name: row.name,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}

// training_plan_exercises
export interface TrainingPlanExerciseRow {
  id: string;
  plan_id: string;
  day: string;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number;
  order_index: number;
  created_at: number;
}

export function serializeTrainingPlanExercise(m: TrainingPlanExercise): TrainingPlanExerciseRow {
  return {
    id: m.id,
    plan_id: m.planId,
    day: m.day,
    exercise_name: m.exerciseName,
    target_sets: m.targetSets,
    target_reps: m.targetReps,
    target_weight_kg: m.targetWeightKg,
    order_index: m.orderIndex,
    created_at: m.createdAt.getTime(),
  };
}

export function trainingPlanExerciseRowToRaw(row: Record<string, unknown>): Raw {
  return {
    id: row.id as string,
    plan_id: row.plan_id,
    day: row.day,
    exercise_name: row.exercise_name,
    target_sets: row.target_sets,
    target_reps: row.target_reps,
    target_weight_kg: row.target_weight_kg,
    order_index: row.order_index,
    created_at: row.created_at,
    ...SYNCED_RAW,
  };
}
