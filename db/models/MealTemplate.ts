import { Model } from '@nozbe/watermelondb';
import { text, readonly, date, children } from '@nozbe/watermelondb/decorators';
import type { Query } from '@nozbe/watermelondb';
import type { MealTemplateItem } from './MealTemplateItem';

export class MealTemplate extends Model {
  static table = 'meal_templates';
  static associations = {
    meal_template_items: { type: 'has_many' as const, foreignKey: 'meal_template_id' },
  };

  @text('name') name!: string;
  @readonly @date('created_at') createdAt!: Date;
  @children('meal_template_items') items!: Query<MealTemplateItem>;
}
