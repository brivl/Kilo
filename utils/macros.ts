export const caloriesFromMacros = ({
  proteinG,
  carbsG,
  fatG,
}: {
  proteinG: number;
  carbsG: number;
  fatG: number;
}): number => proteinG * 4 + carbsG * 4 + fatG * 9;

export const scaleNutrient = (perBase: number, baseQty: number, actualQty: number): number =>
  (perBase / baseQty) * actualQty;

export function sumMacros(
  entries: { calories: number; proteinG: number; carbsG: number; fatG: number }[],
): { calories: number; proteinG: number; carbsG: number; fatG: number } {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
