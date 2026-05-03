import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export class BodyWeightEntry extends Model {
  static table = 'body_weight_entries';

  @text('date') date!: string;
  @field('weight_kg') weightKg!: number;
  @text('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
}
