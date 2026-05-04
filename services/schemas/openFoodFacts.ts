import { z } from 'zod';

const NutrimentSchema = z
  .object({
    'energy-kcal_100g': z.number().optional(),
    proteins_100g: z.number().optional(),
    carbohydrates_100g: z.number().optional(),
    fat_100g: z.number().optional(),
  })
  .passthrough();

export const OffProductSchema = z
  .object({
    id: z.string().optional(),
    product_name: z.string().optional(),
    brands: z.string().optional(),
    image_url: z.string().optional(),
    nutriments: NutrimentSchema.optional(),
  })
  .passthrough();

export const OffSearchResponseSchema = z
  .object({
    products: z.array(OffProductSchema).default([]),
  })
  .passthrough();

export type OffProduct = z.infer<typeof OffProductSchema>;
