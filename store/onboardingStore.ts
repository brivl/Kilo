import { create } from 'zustand';

import type { ActivityLevel, Goal, Sex } from '@/utils/tdee';

interface OnboardingState {
  goal: Goal | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: Sex | null;
  activityLevel: ActivityLevel | null;
  setGoal: (goal: Goal) => void;
  setStats: (stats: { weightKg: number; heightCm: number; age: number; sex: Sex }) => void;
  setActivityLevel: (activityLevel: ActivityLevel) => void;
  reset: () => void;
}

const initialState = {
  goal: null,
  weightKg: null,
  heightCm: null,
  age: null,
  sex: null,
  activityLevel: null,
};

export const useOnboardingStore = create<OnboardingState>()(set => ({
  ...initialState,
  setGoal: goal => set({ goal }),
  setStats: stats => set(stats),
  setActivityLevel: activityLevel => set({ activityLevel }),
  reset: () => set(initialState),
}));
