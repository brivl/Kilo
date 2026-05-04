import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Entry {
  id: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function FoodEntryRow({
  entry,
  onDelete,
}: {
  entry: Entry;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={s.row}>
      <View style={s.main}>
        <Text style={s.name} numberOfLines={1}>
          {entry.foodName}
        </Text>
        <Text style={s.sub}>
          {entry.quantity}
          {entry.unit} · P {entry.proteinG}g · C {entry.carbsG}g · F {entry.fatG}g
        </Text>
      </View>
      <Text style={s.cal}>{entry.calories} kcal</Text>
      <Pressable
        onPress={() => onDelete(entry.id)}
        style={s.del}
        accessibilityLabel={`Delete ${entry.foodName}`}
        hitSlop={8}
      >
        <Text style={s.delText}>✕</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 72,
  },
  main: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, color: '#fff', fontWeight: '500' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  cal: { fontSize: 14, color: '#ddd', marginRight: 8 },
  del: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  delText: { color: '#888', fontSize: 16 },
});
