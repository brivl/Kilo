import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import { observeAllWeightEntries } from '@/db/queries/bodyWeight';
import { deleteWeightEntry, logWeight } from '@/store/bodyWeightStore';
import { Colors } from '@/utils/colors';

type ChartPoint = { x: number; weight: number };

function WeightChart({ entries }: { entries: BodyWeightEntry[] }) {
  const data = useMemo<ChartPoint[]>(() => {
    const sorted = [...entries].reverse().slice(-60);
    return sorted.map((e, i) => ({ x: i, weight: e.weightKg }));
  }, [entries]);

  if (data.length < 2) {
    return (
      <View style={s.chartEmpty}>
        <Text style={s.chartEmptyTxt}>Log at least 2 entries to see your chart</Text>
      </View>
    );
  }

  return (
    <View style={s.chart}>
      <CartesianChart data={data} xKey="x" yKeys={['weight']}>
        {({ points }) => (
          <Line
            points={points.weight}
            color={Colors.brand}
            strokeWidth={2.5}
            animate={{ type: 'timing', duration: 300 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}

function EntryRow({ entry }: { entry: BodyWeightEntry }) {
  return (
    <View style={s.entryRow}>
      <View style={s.entryInfo}>
        <Text style={s.entryWeight}>{entry.weightKg} kg</Text>
        <Text style={s.entryDate}>{entry.date}</Text>
      </View>
      {entry.notes ? (
        <Text style={s.entryNotes} numberOfLines={1}>
          {entry.notes}
        </Text>
      ) : null}
      <Pressable
        onPress={() => deleteWeightEntry(entry.id)}
        style={s.deleteBtn}
        accessibilityLabel={`Delete entry for ${entry.date}`}
        hitSlop={8}
      >
        <Text style={s.deleteTxt}>✕</Text>
      </Pressable>
    </View>
  );
}

function LogForm() {
  const today = new Date().toISOString().slice(0, 10);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const kg = parseFloat(weight);
    if (!kg || kg <= 0) return;
    setSaving(true);
    try {
      await logWeight(today, kg, notes.trim() || null);
      setWeight('');
      setNotes('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.form}>
      <Text style={s.formTitle}>Log today's weight</Text>
      <View style={s.formRow}>
        <TextInput
          style={[s.input, s.weightInput]}
          placeholder="e.g. 80.5"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          accessibilityLabel="Body weight in kg"
        />
        <Text style={s.kgLabel}>kg</Text>
      </View>
      <TextInput
        style={s.input}
        placeholder="Notes (optional)"
        placeholderTextColor={Colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        accessibilityLabel="Notes"
      />
      <Pressable
        style={[s.saveBtn, (!weight || saving) && s.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!weight || saving}
        accessibilityLabel="Save weight"
        accessibilityRole="button"
      >
        <Text style={s.saveBtnTxt}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

export default function ProgressScreen() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);

  useEffect(() => {
    const sub = observeAllWeightEntries().subscribe(setEntries);
    return () => sub.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <View style={s.screen}>
        <Text style={s.heading}>Progress</Text>
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <>
              <WeightChart entries={entries} />
              <LogForm />
              {entries.length > 0 && <Text style={s.historyLabel}>History</Text>}
            </>
          }
          renderItem={({ item }) => <EntryRow entry={item} />}
          ListEmptyComponent={
            <Text style={s.empty}>No entries yet — log your first weight above</Text>
          }
        />
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  list: { padding: 16, gap: 12, paddingBottom: 40 },

  chartEmpty: {
    height: 160,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyTxt: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  chart: {
    height: 200,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    padding: 8,
  },

  form: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  weightInput: { flex: 1 },
  kgLabel: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  saveBtnDisabled: { backgroundColor: Colors.brandDisabled },
  saveBtnTxt: { color: Colors.surface, fontSize: 15, fontWeight: '700' },

  historyLabel: { fontSize: 14, fontWeight: '600', color: Colors.textLabel, marginTop: 4 },

  entryRow: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryInfo: { flex: 1 },
  entryWeight: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  entryDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  entryNotes: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  deleteBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  deleteTxt: { color: Colors.textMuted, fontSize: 16 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 24 },
});
