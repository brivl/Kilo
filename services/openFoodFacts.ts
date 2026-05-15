import Constants from 'expo-constants';

import { OffSearchResponseSchema } from './schemas/openFoodFacts';

export class OffNetworkError extends Error {}

export interface OffFood {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

const BASE_URL = Constants.expoConfig?.extra?.openFoodFactsBaseUrl as string;

export async function searchFoods(query: string, signal?: AbortSignal): Promise<OffFood[]> {
  const fields = 'id,product_name,brands,image_url,nutriments';
  const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n&fields=${fields}`;
  let response: Response;
  try {
    // TODO: Extract to custom http client for easier usage
    response = await fetch(url, {
      signal,
      headers: { 'User-Agent': 'Kilo/0.1 (ilya.wublenski@gmail.com)' },
    });
  } catch {
    throw new OffNetworkError('Network error or aborted');
  }
  if (!response.ok) throw new OffNetworkError(`HTTP ${response.status}`);
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return [];
  }
  const parsed = OffSearchResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.warn('OFF: invalid response', parsed.error);
    return [];
  }
  return parsed.data.products
    .filter(p => p.product_name)
    .map(p => ({
      id: p.id ?? p.product_name!,
      name: p.product_name!,
      brand: p.brands,
      imageUrl: p.image_url,
      kcalPer100g: p.nutriments?.['energy-kcal_100g'] ?? 0,
      proteinPer100g: p.nutriments?.proteins_100g ?? 0,
      carbsPer100g: p.nutriments?.carbohydrates_100g ?? 0,
      fatPer100g: p.nutriments?.fat_100g ?? 0,
    }));
}
