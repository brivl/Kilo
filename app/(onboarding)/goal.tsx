import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import type { Goal } from '@/utils/tdee';

const GOALS: { key: Goal; label: string; description: string }[] = [
  { key: 'lose', label: 'Lose weight', description: 'Burn fat and reduce body weight' },
  { key: 'gain', label: 'Gain muscle', description: 'Build strength and add mass' },
  { key: 'maintain', label: 'Maintain', description: 'Keep current weight and composition' },
  { key: 'recomp', label: 'Body recomp', description: 'Lose fat while building muscle' },
];

export default function GoalScreen() {
  const router = useRouter();
  const setGoal = useOnboardingStore(s => s.setGoal);
  const goal = useOnboardingStore(s => s.goal);

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/(protected)/(tabs)');
  };

  const handleSelect = (key: Goal) => {
    setGoal(key);
    router.push('/(onboarding)/stats');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 1 of 4</Text>
      <Text style={styles.title}>What's your primary goal?</Text>

      <View style={styles.options}>
        {GOALS.map(g => (
          <TouchableOpacity
            key={g.key}
            style={[styles.card, goal === g.key && styles.cardSelected]}
            onPress={() => handleSelect(g.key)}
            accessibilityLabel={g.label}
            accessibilityState={{ selected: goal === g.key }}
          >
            <Text style={[styles.cardLabel, goal === g.key && styles.cardLabelSelected]}>
              {g.label}
            </Text>
            <Text style={styles.cardDescription}>{g.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  options: { flex: 1, gap: 12 },
  card: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 16 },
  cardSelected: { borderColor: '#000', backgroundColor: '#f5f5f5' },
  cardLabel: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  cardLabelSelected: { color: '#000' },
  cardDescription: { fontSize: 14, color: '#666' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 16 },
});
