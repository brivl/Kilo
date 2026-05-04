import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { addEntry } from '@/store/foodStore';
import { useSettingsStore } from '@/store/settingsStore';

const UNITS = ['serving', 'g', 'ml', 'oz'] as const;
type Unit = (typeof UNITS)[number];

export default function AddFoodScreen() {
  const router = useRouter();
  const { mealType = 'breakfast' } = useLocalSearchParams<{ mealType: string }>();
  const selectedDate = useSettingsStore(s => s.selectedDate);

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('serving');
  const [nameError, setNameError] = useState(false);

  async function handleSave() {
    if (!foodName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    await addEntry({
      date: selectedDate,
      mealType,
      foodName: foodName.trim(),
      calories: parseFloat(calories) || 0,
      proteinG: parseFloat(protein) || 0,
      carbsG: parseFloat(carbs) || 0,
      fatG: parseFloat(fat) || 0,
      quantity: parseFloat(quantity) || 1,
      unit,
      source: 'manual',
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.heading}>Add food</Text>

        <Text style={s.label}>Food name</Text>
        <TextInput
          style={[s.input, nameError && s.inputError]}
          placeholder="Food name"
          placeholderTextColor="#64748b"
          value={foodName}
          onChangeText={t => {
            setFoodName(t);
            setNameError(false);
          }}
          accessibilityLabel="Food name"
        />
        {nameError && <Text style={s.error}>Food name is required</Text>}

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Quantity</Text>
            <TextInput
              style={s.input}
              placeholder="1"
              placeholderTextColor="#64748b"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              accessibilityLabel="Quantity"
            />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Unit</Text>
            <View style={s.unitRow}>
              {UNITS.map(u => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[s.unitChip, unit === u && s.unitChipActive]}
                  accessibilityLabel={`Unit ${u}`}
                  accessibilityRole="button"
                >
                  <Text style={[s.unitText, unit === u && s.unitTextActive]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Text style={s.label}>Calories</Text>
        <TextInput
          style={s.input}
          placeholder="Calories"
          placeholderTextColor="#64748b"
          value={calories}
          onChangeText={setCalories}
          keyboardType="decimal-pad"
          accessibilityLabel="Calories"
        />

        <View style={s.row}>
          <View style={s.third}>
            <Text style={s.label}>Protein (g)</Text>
            <TextInput
              style={s.input}
              placeholder="Protein (g)"
              placeholderTextColor="#64748b"
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              accessibilityLabel="Protein grams"
            />
          </View>
          <View style={s.third}>
            <Text style={s.label}>Carbs (g)</Text>
            <TextInput
              style={s.input}
              placeholder="Carbs (g)"
              placeholderTextColor="#64748b"
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              accessibilityLabel="Carbs grams"
            />
          </View>
          <View style={s.third}>
            <Text style={s.label}>Fat (g)</Text>
            <TextInput
              style={s.input}
              placeholder="Fat (g)"
              placeholderTextColor="#64748b"
              value={fat}
              onChangeText={setFat}
              keyboardType="decimal-pad"
              accessibilityLabel="Fat grams"
            />
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          style={s.saveBtn}
          accessibilityLabel="Save"
          accessibilityRole="button"
        >
          <Text style={s.saveTxt}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  heading: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputError: { borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  third: { flex: 1 },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 44,
    justifyContent: 'center',
  },
  unitChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  unitText: { color: '#94a3b8', fontSize: 13 },
  unitTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    minHeight: 44,
  },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
