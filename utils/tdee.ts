export type Goal = 'lose' | 'gain' | 'maintain' | 'recomp';
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  gain: 300,
  maintain: 0,
  recomp: 0,
};

const MACRO_SPLITS: Record<Goal, { protein: number; carbs: number; fat: number }> = {
  lose: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  gain: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  maintain: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  recomp: { protein: 0.4, carbs: 0.35, fat: 0.25 },
};

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activityLevel: ActivityLevel,
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateTargetCalories(tdee: number, goal: Goal): number {
  return tdee + GOAL_ADJUSTMENTS[goal];
}

export function calculateMacros(
  calories: number,
  goal: Goal,
): { proteinG: number; carbsG: number; fatG: number } {
  const { protein, carbs, fat } = MACRO_SPLITS[goal];
  return {
    proteinG: Math.round((calories * protein) / 4),
    carbsG: Math.round((calories * carbs) / 4),
    fatG: Math.round((calories * fat) / 9),
  };
}
