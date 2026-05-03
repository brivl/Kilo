import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export class WorkoutSession extends Model {
  static table = 'workout_sessions';

  @text('date') date!: string;
  @text('name') name!: string;
  @text('notes') notes!: string | null;
  @field('duration_min') durationMin!: number | null;
  @text('plan_id') planId!: string | null;
  @readonly @date('created_at') createdAt!: Date;
}
