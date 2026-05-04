// TODO: fix eslint import order

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WeightUnit } from '@/types/weight-unit-type';
import { todayISO } from '@/utils/date';

interface SettingsState {
  weightUnit: WeightUnit;
  selectedDate: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  setWeightUnit: (u: WeightUnit) => void;
  setSelectedDate: (d: string) => void;
  setCalorieGoal: (n: number) => void;
  setMacroGoals: (g: { proteinG: number; carbsG: number; fatG: number }) => void;
  resetToToday: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      weightUnit: 'kg',
      selectedDate: todayISO(),
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
      setWeightUnit: weightUnit => set({ weightUnit }),
      setSelectedDate: selectedDate => set({ selectedDate }),
      setCalorieGoal: calorieGoal => set({ calorieGoal }),
      setMacroGoals: ({ proteinG, carbsG, fatG }) =>
        set({ proteinGoal: proteinG, carbsGoal: carbsG, fatGoal: fatG }),
      resetToToday: () => set({ selectedDate: todayISO() }),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
