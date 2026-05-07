import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logTemplate } from '@/store/mealTemplateStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Colors } from '@/utils/colors';

import { MealTemplatePill } from './MealTemplatePill';

interface Template {
  id: string;
  name: string;
  totalCal: number;
}
interface Props {
  mealType: string;
  label: string;
  templates: Template[];
}

export function MealSectionHeader({ mealType, label, templates }: Props) {
  const router = useRouter();
  const { selectedDate } = useSettingsStore();
  return (
    <View style={s.container}>
      <View style={s.row}>
        <Text style={s.label}>{label}</Text>
        <Pressable
          onPress={() => router.push(`/food/search?mealType=${mealType}`)}
          style={s.addBtn}
          accessibilityLabel={`Log food for ${label}`}
        >
          <Text style={s.addText}>+ Log food</Text>
        </Pressable>
      </View>
      {templates.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pills}>
          {templates.map(t => (
            <MealTemplatePill
              key={t.id}
              name={t.name}
              totalCal={t.totalCal}
              onPress={() => logTemplate(t.id, selectedDate, mealType)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: Colors.background,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 8 },
  addText: { color: Colors.brandSecondary, fontSize: 14 },
  pills: { marginTop: 8 },
});
