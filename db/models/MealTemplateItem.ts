import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export class MealTemplateItem extends Model {
  static table = 'meal_template_items';
  static associations = {
    meal_templates: { type: 'belongs_to' as const, key: 'meal_template_id' },
  };

  @text('meal_template_id') mealTemplateId!: string;
  @text('food_name') foodName!: string;
  @field('calories') calories!: number;
  @field('protein_g') proteinG!: number;
  @field('carbs_g') carbsG!: number;
  @field('fat_g') fatG!: number;
  @field('quantity') quantity!: number;
  @text('unit') unit!: string;
  @readonly @date('created_at') createdAt!: Date;
}
