import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { Colors } from '@/utils/colors';
import { calculateMacros, calculateTargetCalories, calculateTDEE } from '@/utils/tdee';

export default function TargetsScreen() {
  const router = useRouter();
  const goal = useOnboardingStore(s => s.goal);
  const weightKg = useOnboardingStore(s => s.weightKg);
  const heightCm = useOnboardingStore(s => s.heightCm);
  const age = useOnboardingStore(s => s.age);
  const sex = useOnboardingStore(s => s.sex);
  const activityLevel = useOnboardingStore(s => s.activityLevel);
  const storeReset = useOnboardingStore(s => s.reset);
  const setCalorieGoal = useSettingsStore(s => s.setCalorieGoal);
  const setMacroGoals = useSettingsStore(s => s.setMacroGoals);
  const showToast = useToastStore(s => s.showToast);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    if (goal && weightKg && heightCm && age && sex && activityLevel) {
      const tdee = calculateTDEE(weightKg, heightCm, age, sex, activityLevel);
      const targetCal = calculateTargetCalories(tdee, goal);
      const macros = calculateMacros(targetCal, goal);
      setCalories(String(targetCal));
      setProtein(String(macros.proteinG));
      setCarbs(String(macros.carbsG));
      setFat(String(macros.fatG));
    }
  }, [goal, weightKg, heightCm, age, sex, activityLevel]);

  const handleSave = async () => {
    const cal = parseInt(calories, 10);
    const pro = parseInt(protein, 10);
    const car = parseInt(carbs, 10);
    const f = parseInt(fat, 10);
    if (!cal || cal < 500 || cal > 10000) {
      showToast('Calorie goal must be between 500 and 10000', 'error');
      return;
    }
    if (!pro || pro < 1 || pro > 500) {
      showToast('Protein goal must be between 1 and 500 g', 'error');
      return;
    }
    if (!car || car < 1 || car > 1500) {
      showToast('Carbs goal must be between 1 and 1500 g', 'error');
      return;
    }
    if (!f || f < 1 || f > 500) {
      showToast('Fat goal must be between 1 and 500 g', 'error');
      return;
    }
    try {
      setCalorieGoal(cal);
      setMacroGoals({ proteinG: pro, carbsG: car, fatG: f });
      storeReset();
      await AsyncStorage.setItem('onboardingComplete', 'true');
      router.replace('/(protected)/(tabs)');
    } catch {
      showToast('Could not save progress. Try again.', 'error');
    }
  };

  const handleSkip = async () => {
    storeReset();
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      router.replace('/(protected)/(tabs)');
    } catch {
      showToast('Could not save progress. Try again.', 'error');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.step}>Step 4 of 4</Text>
      <Text style={styles.title}>Your daily targets</Text>
      <Text style={styles.subtitle}>Calculated from your stats. Adjust if needed.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Daily calories</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          accessibilityLabel="Daily calories"
        />

        <Text style={styles.label}>Protein (g)</Text>
        <TextInput
          style={styles.input}
          value={protein}
          onChangeText={setProtein}
          keyboardType="number-pad"
          accessibilityLabel="Protein goal"
        />

        <Text style={styles.label}>Carbohydrates (g)</Text>
        <TextInput
          style={styles.input}
          value={carbs}
          onChangeText={setCarbs}
          keyboardType="number-pad"
          accessibilityLabel="Carbs goal"
        />

        <Text style={styles.label}>Fat (g)</Text>
        <TextInput
          style={styles.input}
          value={fat}
          onChangeText={setFat}
          keyboardType="number-pad"
          accessibilityLabel="Fat goal"
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        accessibilityLabel="Save targets"
      >
        <Text style={styles.saveButtonText}>Save & get started</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSkip} accessibilityLabel="Use defaults instead">
        <Text style={styles.skip}>Use defaults instead</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.surface },
  container: { padding: 24, paddingTop: 48 },
  step: { fontSize: 14, color: Colors.textMuted, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 32 },
  form: { gap: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  skip: { textAlign: 'center', color: Colors.textMuted, fontSize: 14, paddingVertical: 16 },
});
