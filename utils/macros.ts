export function caloriesFromMacros({
  proteinG,
  carbsG,
  fatG,
}: {
  proteinG: number;
  carbsG: number;
  fatG: number;
}): number {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}

export function scaleNutrient(perBase: number, baseQty: number, actualQty: number): number {
  return (perBase / baseQty) * actualQty;
}

export function sumMacros(
  entries: Array<{ calories: number; proteinG: number; carbsG: number; fatG: number }>,
) {
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
