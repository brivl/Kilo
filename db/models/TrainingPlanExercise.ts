import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class TrainingPlanExercise extends Model {
  static table = 'training_plan_exercises';

  @text('plan_id') planId!: string;
  @text('day') day!: string;
  @text('exercise_name') exerciseName!: string;
  @field('target_sets') targetSets!: number;
  @field('target_reps') targetReps!: number;
  @field('target_weight_kg') targetWeightKg!: number;
  @field('order_index') orderIndex!: number;
  @readonly @date('created_at') createdAt!: Date;
}
