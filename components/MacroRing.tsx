import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useSettingsStore } from '@/store/settingsStore';

interface Totals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const SIZE = 160;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function ring(pct: number, color: string, offset: number) {
  const dash = Math.min(pct, 1) * CIRC;
  return (
    <Circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={R}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeDasharray={`${dash} ${CIRC}`}
      strokeDashoffset={-offset * CIRC}
      strokeLinecap="round"
    />
  );
}

export function MacroRing({ totals }: { totals: Totals }) {
  const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = useSettingsStore();
  const label = `Calories ${totals.calories} of ${calorieGoal}. Protein ${totals.proteinG} of ${proteinGoal} grams. Carbs ${totals.carbsG} of ${carbsGoal} grams. Fat ${totals.fatG} of ${fatGoal} grams.`;
  return (
    <View style={s.container} accessibilityLabel={label}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE}
        />
        {ring(totals.proteinG / proteinGoal, '#6ee7b7', 0)}
        {ring(totals.carbsG / carbsGoal, '#93c5fd', 0.33)}
        {ring(totals.fatG / fatGoal, '#fca5a5', 0.66)}
      </Svg>
      <View style={s.center}>
        <Text style={s.cal}>{totals.calories}</Text>
        <Text style={s.label}>kcal</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  cal: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  label: { fontSize: 12, color: '#888' },
});
