import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import { useToastStore } from '@/store/toastStore';
import type { ActivityLevel } from '@/utils/tdee';

const LEVELS: { key: ActivityLevel; label: string; description: string }[] = [
  { key: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { key: 'light', label: 'Lightly active', description: '1–3 days/week' },
  { key: 'moderate', label: 'Moderately active', description: '3–5 days/week' },
  { key: 'very', label: 'Very active', description: '6–7 days/week' },
  { key: 'extreme', label: 'Extremely active', description: 'Physical job or 2× daily training' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const setActivityLevel = useOnboardingStore(s => s.setActivityLevel);
  const activityLevel = useOnboardingStore(s => s.activityLevel);
  const reset = useOnboardingStore(s => s.reset);
  const showToast = useToastStore(s => s.showToast);

  const handleSkip = async () => {
    reset();
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      router.replace('/(protected)/(tabs)');
    } catch {
      showToast('Could not save progress. Try again.', 'error');
    }
  };

  const handleSelect = (key: ActivityLevel) => {
    setActivityLevel(key);
    router.push('/(onboarding)/targets');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 3 of 4</Text>
      <Text style={styles.title}>Activity level</Text>

      <View style={styles.options}>
        {LEVELS.map(l => (
          <TouchableOpacity
            key={l.key}
            style={[styles.card, activityLevel === l.key && styles.cardSelected]}
            onPress={() => handleSelect(l.key)}
            accessibilityLabel={l.label}
            accessibilityState={{ selected: activityLevel === l.key }}
          >
            <Text style={[styles.cardLabel, activityLevel === l.key && styles.cardLabelSelected]}>
              {l.label}
            </Text>
            <Text style={styles.cardDescription}>{l.description}</Text>
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
  options: { flex: 1, gap: 10 },
  card: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 14, minHeight: 44 },
  cardSelected: { borderColor: '#000', backgroundColor: '#f5f5f5' },
  cardLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  cardLabelSelected: { color: '#000' },
  cardDescription: { fontSize: 13, color: '#666' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 16 },
});
