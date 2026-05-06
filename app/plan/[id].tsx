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

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { database } from '@/db/database';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import type { TrainingPlanExercise } from '@/db/models/TrainingPlanExercise';
import { observeExercisesForPlan } from '@/db/queries/trainingPlans';
import {
  addExerciseToPlan,
  deletePlanExercise,
  launchSessionFromPlan,
} from '@/store/trainingPlanStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type DaySection = { day: string; exercises: TrainingPlanExercise[] };

function ExerciseRow({ ex, onDelete }: { ex: TrainingPlanExercise; onDelete: () => void }) {
  return (
    <View style={s.exRow}>
      <View style={s.exInfo}>
        <Text style={s.exName}>{ex.exerciseName}</Text>
        <Text style={s.exMeta}>
          {ex.targetSets} × {ex.targetReps} @ {ex.targetWeightKg} kg
        </Text>
      </View>
      <Pressable
        onPress={onDelete}
        style={s.deleteBtn}
        accessibilityLabel={`Delete ${ex.exerciseName}`}
        hitSlop={8}
      >
        <Text style={s.deleteTxt}>✕</Text>
      </Pressable>
    </View>
  );
}

function DayCard({
  section,
  onLaunch,
}: {
  section: DaySection;
  planId: string;
  onLaunch: (day: string) => void;
}) {
  return (
    <View style={s.dayCard}>
      <View style={s.dayHeader}>
        <Text style={s.dayTitle}>{section.day}</Text>
        <Pressable
          style={s.launchBtn}
          onPress={() => onLaunch(section.day)}
          accessibilityLabel={`Start ${section.day} workout`}
          accessibilityRole="button"
        >
          <Text style={s.launchTxt}>▶ Start</Text>
        </Pressable>
      </View>
      {section.exercises.length === 0 ? (
        <Text style={s.emptyDay}>No exercises — add one below</Text>
      ) : (
        section.exercises.map(ex => (
          <ExerciseRow key={ex.id} ex={ex} onDelete={() => deletePlanExercise(ex.id)} />
        ))
      )}
    </View>
  );
}

export default function PlanDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? '');
  const router = useRouter();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [exercises, setExercises] = useState<TrainingPlanExercise[]>([]);

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [exName, setExName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    database.collections
      .get<TrainingPlan>('training_plans')
      .find(id)
      .then(setPlan)
      .catch(() => {});
    const sub = observeExercisesForPlan(id).subscribe(setExercises);
    return () => sub.unsubscribe();
  }, [id]);

  const sections = useMemo<DaySection[]>(() => {
    const map = new Map<string, TrainingPlanExercise[]>();
    for (const ex of exercises) {
      if (!map.has(ex.day)) map.set(ex.day, []);
      map.get(ex.day)!.push(ex);
    }
    // Show days that have exercises, plus any day order from DAYS
    const daysWithEx = [...map.keys()];
    const ordered = DAYS.filter(d => daysWithEx.includes(d));
    const custom = daysWithEx.filter(d => !DAYS.includes(d));
    return [...ordered, ...custom].map(day => ({ day, exercises: map.get(day) ?? [] }));
  }, [exercises]);

  async function handleAddExercise() {
    const trimmed = exName.trim();
    if (!trimmed) return;
    const parsedSets = parseInt(sets, 10) || 1;
    const parsedReps = parseInt(reps, 10) || 1;
    const parsedWeight = parseFloat(weight) || 0;
    setSaving(true);
    try {
      await addExerciseToPlan({
        planId: id,
        day: selectedDay,
        exerciseName: trimmed,
        targetSets: parsedSets,
        targetReps: parsedReps,
        targetWeightKg: parsedWeight,
        orderIndex: exercises.filter(e => e.day === selectedDay).length,
      });
      setExName('');
    } finally {
      setSaving(false);
    }
  }

  async function handleLaunch(day: string) {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const sessionId = await launchSessionFromPlan(id, day, today);
      router.push(`/session/${sessionId}`);
    } catch {
      // toast shown by store
    }
  }

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: plan?.name ?? 'Plan' }} />
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <FlatList
          data={sections}
          keyExtractor={item => item.day}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            sections.length === 0 ? (
              <Text style={s.emptyMain}>No days yet — add an exercise to get started</Text>
            ) : null
          }
          renderItem={({ item }) => <DayCard section={item} planId={id} onLaunch={handleLaunch} />}
          ListFooterComponent={
            <View style={s.form}>
              <Text style={s.formTitle}>Add exercise</Text>
              <Text style={s.label}>Day</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.dayPills}
              >
                {DAYS.map(d => (
                  <Pressable
                    key={d}
                    style={[s.pill, selectedDay === d && s.pillActive]}
                    onPress={() => setSelectedDay(d)}
                    accessibilityLabel={`Select ${d}`}
                  >
                    <Text style={[s.pillTxt, selectedDay === d && s.pillTxtActive]}>
                      {d.slice(0, 3)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={s.label}>Exercise name</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Bench press"
                placeholderTextColor="#94a3b8"
                value={exName}
                onChangeText={setExName}
                accessibilityLabel="Exercise name"
              />

              <View style={s.row}>
                <View style={s.col}>
                  <Text style={s.label}>Sets</Text>
                  <TextInput
                    style={s.input}
                    keyboardType="number-pad"
                    value={sets}
                    onChangeText={setSets}
                    accessibilityLabel="Target sets"
                  />
                </View>
                <View style={s.col}>
                  <Text style={s.label}>Reps</Text>
                  <TextInput
                    style={s.input}
                    keyboardType="number-pad"
                    value={reps}
                    onChangeText={setReps}
                    accessibilityLabel="Target reps"
                  />
                </View>
                <View style={s.col}>
                  <Text style={s.label}>Weight (kg)</Text>
                  <TextInput
                    style={s.input}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                    accessibilityLabel="Target weight in kg"
                  />
                </View>
              </View>

              <Pressable
                style={[s.addBtn, (!exName.trim() || saving) && s.addBtnDisabled]}
                onPress={handleAddExercise}
                disabled={!exName.trim() || saving}
                accessibilityLabel="Add exercise to plan"
                accessibilityRole="button"
              >
                <Text style={s.addBtnTxt}>{saving ? 'Adding…' : '+ Add exercise'}</Text>
              </Pressable>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  emptyMain: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 24 },

  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0f172a' },
  launchBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchTxt: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  emptyDay: {
    color: '#94a3b8',
    fontSize: 13,
    padding: 16,
    textAlign: 'center',
  },

  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  exInfo: { flex: 1 },
  exName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  exMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  deleteBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  deleteTxt: { color: '#94a3b8', fontSize: 16 },

  form: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569' },
  dayPills: { gap: 8, paddingVertical: 4 },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: '#4f46e5' },
  pillTxt: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  pillTxtActive: { color: '#ffffff' },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    fontSize: 15,
    color: '#0f172a',
    minHeight: 44,
  },
  row: { flexDirection: 'row', gap: 8 },
  col: { flex: 1, gap: 6 },
  addBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  addBtnDisabled: { backgroundColor: '#c7d2fe' },
  addBtnTxt: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
