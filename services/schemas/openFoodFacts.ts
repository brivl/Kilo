import { z } from 'zod';

const NutrimentSchema = z.looseObject({
  'energy-kcal_100g': z.number().optional(),
  proteins_100g: z.number().optional(),
  carbohydrates_100g: z.number().optional(),
  fat_100g: z.number().optional(),
});

export const OffProductSchema = z.looseObject({
  id: z.string().optional(),
  product_name: z.string().optional(),
  brands: z.string().optional(),
  image_url: z.string().optional(),
  nutriments: NutrimentSchema.optional(),
});

export const OffSearchResponseSchema = z.looseObject({
  products: z.array(OffProductSchema).default([]),
});

export type OffProduct = z.infer<typeof OffProductSchema>;
