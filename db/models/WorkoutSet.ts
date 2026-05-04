import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export class WorkoutSet extends Model {
  static table = 'workout_sets';

  @text('session_id') sessionId!: string;
  @text('exercise_name') exerciseName!: string;
  @field('set_number') setNumber!: number;
  @field('reps') reps!: number;
  @field('weight_kg') weightKg!: number;
  @field('rpe') rpe!: number | null;
  @field('rest_seconds') restSeconds!: number | null;
  @readonly @date('created_at') createdAt!: Date;
}
