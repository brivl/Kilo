export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  if (unit === 'lbs') return `${(kg * 2.20462).toFixed(1)} lbs`;
  return `${kg} kg`;
}
