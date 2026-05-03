import { Model } from '@nozbe/watermelondb'
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators'

export class FoodEntry extends Model {
  static table = 'food_entries'

  @text('date') date!: string
  @text('meal_type') mealType!: string
  @text('food_name') foodName!: string
  @field('calories') calories!: number
  @field('protein_g') proteinG!: number
  @field('carbs_g') carbsG!: number
  @field('fat_g') fatG!: number
  @field('quantity') quantity!: number
  @text('unit') unit!: string
  @text('source') source!: string
  @readonly @date('created_at') createdAt!: Date
}
