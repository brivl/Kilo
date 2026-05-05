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

function MacroStat({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  return (
    <View style={s.stat}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.statValue}>{Math.round(value)}g</Text>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statGoal}>of {goal}g</Text>
    </View>
  );
}

export function MacroRing({ totals }: { totals: Totals }) {
  const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = useSettingsStore();
  const label = `Calories ${totals.calories} of ${calorieGoal}. Protein ${totals.proteinG} of ${proteinGoal} grams. Carbs ${totals.carbsG} of ${carbsGoal} grams. Fat ${totals.fatG} of ${fatGoal} grams.`;
  return (
    <View style={s.wrapper} accessibilityLabel={label}>
      <View style={s.container}>
        <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={STROKE}
          />
          {ring(totals.proteinG / proteinGoal, '#6ee7b7', 0)}
          {ring(totals.carbsG / carbsGoal, '#93c5fd', 0.33)}
          {ring(totals.fatG / fatGoal, '#fca5a5', 0.66)}
        </Svg>
        <View style={s.center}>
          <Text style={s.cal}>{totals.calories}</Text>
          <Text style={s.calLabel}>kcal</Text>
        </View>
      </View>
      <View style={s.stats}>
        <MacroStat label="Protein" value={totals.proteinG} goal={proteinGoal} color="#6ee7b7" />
        <MacroStat label="Carbs" value={totals.carbsG} goal={carbsGoal} color="#93c5fd" />
        <MacroStat label="Fat" value={totals.fatG} goal={fatGoal} color="#fca5a5" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 16 },
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  cal: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  calLabel: { fontSize: 12, color: '#64748b' },
  stats: { flexDirection: 'row', gap: 24 },
  stat: { alignItems: 'center', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b' },
  statGoal: { fontSize: 11, color: '#94a3b8' },
});
