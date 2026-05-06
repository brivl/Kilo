import { Model } from '@nozbe/watermelondb';
import { date, readonly, text } from '@nozbe/watermelondb/decorators';

export class TrainingPlan extends Model {
  static table = 'training_plans';

  @text('name') name!: string;
  @readonly @date('created_at') createdAt!: Date;
}
