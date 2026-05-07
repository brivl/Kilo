import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useSettingsStore } from '@/store/settingsStore';
import { Colors } from '@/utils/colors';

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
            stroke={Colors.border}
            strokeWidth={STROKE}
          />
          {ring(totals.proteinG / proteinGoal, Colors.macroProtein, 0)}
          {ring(totals.carbsG / carbsGoal, Colors.macroCarbs, 0.33)}
          {ring(totals.fatG / fatGoal, Colors.macroFat, 0.66)}
        </Svg>
        <View style={s.center}>
          <Text style={s.cal}>{totals.calories}</Text>
          <Text style={s.calLabel}>kcal</Text>
        </View>
      </View>
      <View style={s.stats}>
        <MacroStat
          label="Protein"
          value={totals.proteinG}
          goal={proteinGoal}
          color={Colors.macroProtein}
        />
        <MacroStat label="Carbs" value={totals.carbsG} goal={carbsGoal} color={Colors.macroCarbs} />
        <MacroStat label="Fat" value={totals.fatG} goal={fatGoal} color={Colors.macroFat} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 16 },
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  cal: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  calLabel: { fontSize: 12, color: Colors.textSecondary },
  stats: { flexDirection: 'row', gap: 24 },
  stat: { alignItems: 'center', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  statGoal: { fontSize: 11, color: Colors.textMuted },
});
