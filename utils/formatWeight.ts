import type { WeightUnit } from '@/types/weight-unit-type';

export const formatWeight = (kg: number, unit: WeightUnit): string =>
  unit === 'lbs' ? `${(kg * 2.20462).toFixed(1)} lbs` : `${kg} kg`;
