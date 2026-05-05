import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  name: string;
  totalCal: number;
  onPress: () => void;
}

export function MealTemplatePill({ name, totalCal, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={s.pill}
      accessibilityLabel={`Log ${name}, ${totalCal} calories`}
    >
      <Text style={s.name}>{name}</Text>
      <Text style={s.cal}> {totalCal} kcal</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
    minHeight: 44,
    alignItems: 'center',
  },
  name: { color: '#4338ca', fontSize: 13, fontWeight: '500' },
  cal: { color: '#6366f1', fontSize: 12 },
});
