import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import type { Sex } from '@/utils/tdee';

export default function StatsScreen() {
  const router = useRouter();
  const setStats = useOnboardingStore(s => s.setStats);
  const reset = useOnboardingStore(s => s.reset);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');

  const isValid = parseFloat(weight) > 0 && parseFloat(height) > 0 && parseInt(age, 10) > 0;

  const handleSkip = async () => {
    reset();
    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/(protected)/(tabs)');
  };

  const handleNext = () => {
    const weightKg = parseFloat(weight);
    const heightCm = parseFloat(height);
    const ageNum = parseInt(age, 10);
    if (weightKg <= 0 || heightCm <= 0 || ageNum <= 0) return;
    setStats({ weightKg, heightCm, age: ageNum, sex });
    router.push('/(onboarding)/activity');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 2 of 4</Text>
      <Text style={styles.title}>Tell us about yourself</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 80"
          accessibilityLabel="Weight in kg"
        />

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 175"
          accessibilityLabel="Height in cm"
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          placeholder="e.g. 28"
          accessibilityLabel="Age"
        />

        <Text style={styles.label}>Biological sex</Text>
        <View style={styles.sexToggle}>
          {(['male', 'female'] as Sex[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sexButton, sex === s && styles.sexButtonSelected]}
              onPress={() => setSex(s)}
              accessibilityLabel={s.charAt(0).toUpperCase() + s.slice(1)}
              accessibilityState={{ selected: sex === s }}
            >
              <Text style={[styles.sexButtonText, sex === s && styles.sexButtonTextSelected]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isValid}
        accessibilityLabel="Next step"
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSkip} accessibilityLabel="Skip onboarding">
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  step: { fontSize: 14, color: '#999', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 32 },
  form: { flex: 1, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  sexToggle: { flexDirection: 'row', gap: 12 },
  sexButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexButtonSelected: { borderColor: '#000', backgroundColor: '#f5f5f5' },
  sexButtonText: { fontSize: 16, color: '#666' },
  sexButtonTextSelected: { color: '#000', fontWeight: '600' },
  nextButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: { backgroundColor: '#ccc' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 16 },
});
