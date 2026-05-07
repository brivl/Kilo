import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { TrainingPlan } from '@/db/models/TrainingPlan';
import { observeAllPlans } from '@/db/queries/trainingPlans';
import { deletePlan } from '@/store/trainingPlanStore';
import { Colors } from '@/utils/colors';

function PlanCard({ plan }: { plan: TrainingPlan }) {
  const router = useRouter();
  return (
    <Pressable
      style={s.card}
      onPress={() => router.push(`/plan/${plan.id}`)}
      accessibilityLabel={`Open plan ${plan.name}`}
    >
      <Text style={s.cardName}>{plan.name}</Text>
      <Pressable
        onPress={() => deletePlan(plan.id)}
        style={s.deleteBtn}
        accessibilityLabel={`Delete plan ${plan.name}`}
        hitSlop={8}
      >
        <Text style={s.deleteTxt}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

export default function PlansTab() {
  const router = useRouter();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);

  useEffect(() => {
    const sub = observeAllPlans().subscribe(setPlans);
    return () => sub.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <View style={s.screen}>
        <Text style={s.heading}>Training Plans</Text>
        <FlatList
          data={plans}
          keyExtractor={p => p.id}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          contentContainerStyle={s.list}
          renderItem={({ item }) => <PlanCard plan={item} />}
          ListEmptyComponent={<Text style={s.empty}>No plans yet — tap + to create one</Text>}
        />
        <Pressable
          style={s.fab}
          onPress={() => router.push('/plan/new')}
          accessibilityLabel="Create new plan"
          accessibilityRole="button"
        >
          <Text style={s.fabTxt}>+ New plan</Text>
        </Pressable>
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
  cardName: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
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
