import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DateHeader } from '@/components/DateHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { WorkoutSession } from '@/db/models/WorkoutSession';
import { observeSessionsForDate } from '@/db/queries/workoutSessions';
import { useSettingsStore } from '@/store/settingsStore';
import { deleteSession } from '@/store/workoutStore';
import { Colors } from '@/utils/colors';

function SessionCard({ session }: { session: WorkoutSession }) {
  const router = useRouter();
  return (
    <Pressable
      style={s.card}
      onPress={() => router.push(`/session/${session.id}`)}
      accessibilityLabel={`Open workout ${session.name}`}
    >
      <View style={s.cardMain}>
        <Text style={s.cardName}>{session.name}</Text>
        {session.notes ? (
          <Text style={s.cardNotes} numberOfLines={1}>
            {session.notes}
          </Text>
        ) : null}
        {session.durationMin ? <Text style={s.cardMeta}>{session.durationMin} min</Text> : null}
      </View>
      <Pressable
        onPress={() => deleteSession(session.id)}
        style={s.deleteBtn}
        accessibilityLabel={`Delete workout ${session.name}`}
        hitSlop={8}
      >
        <Text style={s.deleteTxt}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

function JournalInner({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    const sub = observeSessionsForDate(selectedDate).subscribe(setSessions);
    return () => sub.unsubscribe();
  }, [selectedDate]);

  return (
    <View style={s.screen}>
      <DateHeader />
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        contentContainerStyle={s.list}
        renderItem={({ item }) => <SessionCard session={item} />}
        ListEmptyComponent={<Text style={s.empty}>No workouts — tap + to start one</Text>}
      />
      <Pressable
        style={s.fab}
        onPress={() => router.push({ pathname: '/session/new', params: { date: selectedDate } })}
        accessibilityLabel="Start new workout"
        accessibilityRole="button"
      >
        <Text style={s.fabTxt}>+ New workout</Text>
      </Pressable>
    </View>
  );
}

export default function JournalTab() {
  const selectedDate = useSettingsStore(s => s.selectedDate);
  return (
    <ErrorBoundary>
      <JournalInner selectedDate={selectedDate} />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 48 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardMain: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  cardNotes: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  deleteBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  deleteTxt: { color: Colors.textMuted, fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  fabTxt: { color: Colors.surface, fontSize: 16, fontWeight: '700' },
});
