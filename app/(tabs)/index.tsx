import withObservables from '@nozbe/with-observables';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { DateHeader } from '@/components/DateHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FoodEntryRow } from '@/components/FoodEntry';
import { MacroRing } from '@/components/MacroRing';
import { MealSectionHeader } from '@/components/MealSectionHeader';
import type { FoodEntry } from '@/db/models/FoodEntry';
import type { MealTemplate } from '@/db/models/MealTemplate';
import { observeEntriesForDate } from '@/db/queries/foodEntries';
import { observeAllTemplates } from '@/db/queries/mealTemplates';
import { deleteEntry } from '@/store/foodStore';
import { useSettingsStore } from '@/store/settingsStore';
import { sumMacros } from '@/utils/macros';

const MEALS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
];

function FoodLogInner({ entries, templates }: { entries: FoodEntry[]; templates: MealTemplate[] }) {
  const selectedDate = useSettingsStore(s => s.selectedDate);
  const totals = sumMacros(
    entries.map(e => ({
      calories: e.calories,
      proteinG: e.proteinG,
      carbsG: e.carbsG,
      fatG: e.fatG,
    })),
  );

  const sections = MEALS.map(m => ({
    mealType: m.key,
    label: m.label,
    data: entries.filter(e => e.mealType === m.key),
  }));

  const templateSummaries = templates.map(t => ({
    id: t.id,
    name: t.name,
    totalCal: 0,
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => (item as FoodEntry).id}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      ListHeaderComponent={
        <>
          <DateHeader />
          <View style={s.ring}>
            <MacroRing totals={totals} />
          </View>
        </>
      }
      renderSectionHeader={({ section }) => (
        <MealSectionHeader
          mealType={section.mealType}
          label={section.label}
          templates={templateSummaries}
        />
      )}
      renderItem={({ item }) => {
        const e = item as FoodEntry;
        return (
          <FoodEntryRow
            entry={{
              id: e.id,
              foodName: e.foodName,
              quantity: e.quantity,
              unit: e.unit,
              calories: e.calories,
              proteinG: e.proteinG,
              carbsG: e.carbsG,
              fatG: e.fatG,
            }}
            onDelete={deleteEntry}
          />
        );
      }}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? <Text style={s.empty}>No items — tap + Log food</Text> : null
      }
      stickySectionHeadersEnabled={false}
      style={s.list}
    />
  );
}

const enhance = withObservables(['selectedDate'], ({ selectedDate }: { selectedDate: string }) => ({
  entries: observeEntriesForDate(selectedDate),
  templates: observeAllTemplates(),
}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EnhancedFoodLog = enhance(FoodLogInner as any);

export default function FoodLogTab() {
  const selectedDate = useSettingsStore(s => s.selectedDate);
  return (
    <ErrorBoundary>
      <View style={s.screen}>
        <EnhancedFoodLog selectedDate={selectedDate} />
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  ring: { alignItems: 'center', paddingVertical: 16 },
  list: { flex: 1 },
  empty: { color: '#4b5563', fontSize: 13, paddingHorizontal: 16, paddingVertical: 8 },
});
