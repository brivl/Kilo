import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

interface SettingsState {
  weightUnit: 'kg' | 'lbs'
  selectedDate: string
  calorieGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  setWeightUnit: (u: 'kg' | 'lbs') => void
  setSelectedDate: (d: string) => void
  setCalorieGoal: (n: number) => void
  setMacroGoals: (g: { proteinG: number; carbsG: number; fatG: number }) => void
  resetToToday: () => void
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
)
