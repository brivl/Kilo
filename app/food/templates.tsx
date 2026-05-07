import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { MealTemplate } from '@/db/models/MealTemplate';
import { observeAllTemplates } from '@/db/queries/mealTemplates';
import { deleteTemplate } from '@/store/mealTemplateStore';
import { Colors } from '@/utils/colors';

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);

  useEffect(() => {
    const sub = observeAllTemplates().subscribe(setTemplates);
    return () => sub.unsubscribe();
  }, []);

  return (
    <View style={s.screen}>
      <Text style={s.heading}>Meal templates</Text>
      <FlatList
        data={templates}
        keyExtractor={t => t.id}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.name}>{item.name}</Text>
            <Pressable
              onPress={() => deleteTemplate(item.id)}
              style={s.deleteBtn}
              accessibilityLabel={`Delete ${item.name}`}
              accessibilityRole="button"
            >
              <Text style={s.deleteTxt}>Delete</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No meal templates yet</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  heading: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 44,
  },
  name: { color: Colors.textPrimary, fontSize: 15, flex: 1 },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteTxt: { color: Colors.danger, fontSize: 14 },
  empty: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 32 },
});
