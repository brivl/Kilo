import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { database } from '@/db/database';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import type { WorkoutSet } from '@/db/models/WorkoutSet';
import { observeSetsForSession } from '@/db/queries/workoutSets';
import { useSettingsStore } from '@/store/settingsStore';
import { addSet, deleteSet } from '@/store/workoutStore';
import { Colors } from '@/utils/colors';

interface SetRow {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: number | null;
}

interface ExerciseGroup {
  name: string;
  sets: SetRow[];
}

function SetTable({ sets, onDelete }: { sets: SetRow[]; onDelete: (id: string) => void }) {
  return (
    <View style={s.table}>
      <View style={s.tableHeader}>
        <Text style={[s.tableCell, s.colSet]}>SET</Text>
        <Text style={[s.tableCell, s.colReps]}>REPS</Text>
        <Text style={[s.tableCell, s.colWeight]}>KG</Text>
        <View style={s.colDel} />
      </View>
      {sets.map(set => (
        <View key={set.id} style={s.tableRow}>
          <Text style={[s.tableCell, s.colSet]}>{set.setNumber}</Text>
          <Text style={[s.tableCell, s.colReps]}>{set.reps}</Text>
          <Text style={[s.tableCell, s.colWeight]}>{set.weightKg}</Text>
          <Pressable
            style={s.colDel}
            onPress={() => onDelete(set.id)}
            accessibilityLabel={`Delete set ${set.setNumber}`}
            hitSlop={8}
          >
            <Text style={s.delTxt}>✕</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const weightUnit = useSettingsStore(s => s.weightUnit);

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [exerciseName, setExerciseName] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    database.collections
      .get<WorkoutSession>('workout_sessions')
      .find(id)
      .then(setSession)
      .catch(() => router.back());
  }, [id]);

  useEffect(() => {
    const sub = observeSetsForSession(id).subscribe(setSets);
    return () => sub.unsubscribe();
  }, [id]);

  const groups = useMemo<ExerciseGroup[]>(() => {
    const map = new Map<string, SetRow[]>();
    for (const s of sets) {
      if (!map.has(s.exerciseName)) map.set(s.exerciseName, []);
      map.get(s.exerciseName)!.push({
        id: s.id,
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
        rpe: s.rpe,
      });
    }
    return Array.from(map.entries()).map(([name, s]) => ({ name, sets: s }));
  }, [sets]);

  const existingExercises = useMemo(
    () => Array.from(new Set(sets.map(s => s.exerciseName))),
    [sets],
  );

  async function handleAddSet() {
    if (!exerciseName.trim() || !reps.trim()) return;
    const existing = sets.filter(s => s.exerciseName === exerciseName.trim());
    const nextSetNumber = existing.length + 1;
    const weightKg = parseFloat(weight) || 0;
    setSaving(true);
    try {
      await addSet({
        sessionId: id,
        exerciseName: exerciseName.trim(),
        setNumber: nextSetNumber,
        reps: parseInt(reps, 10) || 0,
        weightKg,
      });
      setReps('');
      setWeight('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: session?.name ?? 'Workout' }} />
      <FlatList
        data={groups}
        keyExtractor={g => g.name}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
        ListEmptyComponent={<Text style={s.empty}>No sets yet — add one below</Text>}
        renderItem={({ item: group }) => (
          <View style={s.exerciseCard}>
            <Text style={s.exerciseName}>{group.name}</Text>
            <SetTable sets={group.sets} onDelete={deleteSet} />
          </View>
        )}
        ListFooterComponent={
          <View style={s.form}>
            <Text style={s.formTitle}>Add set</Text>

            <Text style={s.label}>Exercise</Text>
            <TextInput
              style={s.input}
              placeholder="Exercise name"
              placeholderTextColor={Colors.textMuted}
              value={exerciseName}
              onChangeText={setExerciseName}
              returnKeyType="next"
              accessibilityLabel="Exercise name"
            />
            {existingExercises.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
                {existingExercises.map(ex => (
                  <Pressable
                    key={ex}
                    onPress={() => setExerciseName(ex)}
                    style={[s.chip, exerciseName === ex && s.chipActive]}
                    accessibilityLabel={`Select ${ex}`}
                  >
                    <Text style={[s.chipTxt, exerciseName === ex && s.chipTxtActive]}>{ex}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={s.row}>
              <View style={s.half}>
                <Text style={s.label}>Reps</Text>
                <TextInput
                  style={s.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  accessibilityLabel="Reps"
                />
              </View>
              <View style={s.half}>
                <Text style={s.label}>Weight ({weightUnit})</Text>
                <TextInput
                  style={s.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleAddSet}
                  accessibilityLabel="Weight"
                />
              </View>
            </View>

            <Pressable
              style={[s.addBtn, saving && s.addBtnDisabled]}
              onPress={handleAddSet}
              disabled={saving}
              accessibilityLabel="Add set"
              accessibilityRole="button"
            >
              <Text style={s.addBtnTxt}>+ Add set</Text>
            </Pressable>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 24 },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  table: { gap: 4 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSubtle,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  tableCell: { fontSize: 14, color: Colors.textPrimary },
  colSet: { width: 36, color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  colReps: { flex: 1, textAlign: 'center' },
  colWeight: { flex: 1, textAlign: 'center' },
  colDel: { width: 36, alignItems: 'flex-end', justifyContent: 'center' },
  delTxt: { color: Colors.textMuted, fontSize: 14 },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chips: { marginTop: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSubtle,
    marginRight: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.brandSubtle },
  chipTxt: { fontSize: 13, color: Colors.textSecondary },
  chipTxtActive: { color: Colors.brand, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  addBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 44,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnTxt: { color: Colors.surface, fontSize: 15, fontWeight: '700' },
});
