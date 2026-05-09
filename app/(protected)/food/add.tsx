import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
import { Colors } from '@/utils/colors';

const UNITS = ['serving', 'g', 'ml', 'oz'] as const;
type Unit = (typeof UNITS)[number];

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mealType?: string;
    foodName?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    quantity?: string;
    unit?: string;
    source?: string;
  }>();
  const mealType = params.mealType ?? 'breakfast';
  const selectedDate = useSettingsStore(s => s.selectedDate);

  const [foodName, setFoodName] = useState(params.foodName ?? '');
  const [calories, setCalories] = useState(params.calories ?? '');
  const [protein, setProtein] = useState(params.protein ?? '');
  const [carbs, setCarbs] = useState(params.carbs ?? '');
  const [fat, setFat] = useState(params.fat ?? '');
  const [quantity, setQuantity] = useState(params.quantity ?? '1');
  const [unit, setUnit] = useState<Unit>((params.unit as Unit | undefined) ?? 'serving');
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
      source: params.source === 'open_food_facts' ? 'open_food_facts' : 'manual',
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Add food' }} />
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
          placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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
          placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  heading: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.danger },
  error: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  third: { flex: 1 },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  unitChipActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  unitText: { color: Colors.textSecondary, fontSize: 13 },
  unitTextActive: { color: Colors.surface },
  saveBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    minHeight: 44,
  },
  saveTxt: { color: Colors.surface, fontSize: 16, fontWeight: '700' },
});
