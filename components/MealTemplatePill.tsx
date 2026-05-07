import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/utils/colors';

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
    backgroundColor: Colors.brandSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
    minHeight: 44,
    alignItems: 'center',
  },
  name: { color: Colors.brandPillText, fontSize: 13, fontWeight: '500' },
  cal: { color: Colors.brandSecondary, fontSize: 12 },
});
