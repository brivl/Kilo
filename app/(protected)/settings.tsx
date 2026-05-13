import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import type { WeightUnit } from '@/types/weight-unit-type';
import { Colors } from '@/utils/colors';
import { getInitials } from '@/utils/initials';

function GoalRow({
  label,
  unit,
  value,
  onChangeText,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.goalInputWrap}>
        <TextInput
          style={s.goalInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          accessibilityLabel={label}
          returnKeyType="done"
        />
        <Text style={s.goalUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function RowSeparator() {
  return <View style={s.separator} />;
}

export default function SettingsScreen() {
  const session = useAuthStore(s => s.session);
  const signOut = useAuthStore(s => s.signOut);

  const calorieGoal = useSettingsStore(s => s.calorieGoal);
  const proteinGoal = useSettingsStore(s => s.proteinGoal);
  const carbsGoal = useSettingsStore(s => s.carbsGoal);
  const fatGoal = useSettingsStore(s => s.fatGoal);
  const setCalorieGoal = useSettingsStore(s => s.setCalorieGoal);
  const setMacroGoals = useSettingsStore(s => s.setMacroGoals);
  const weightUnit = useSettingsStore(s => s.weightUnit);
  const setWeightUnit = useSettingsStore(s => s.setWeightUnit);
  const syncEnabled = useSettingsStore(s => s.syncEnabled);
  const setSyncEnabled = useSettingsStore(s => s.setSyncEnabled);

  const showToast = useToastStore(s => s.showToast);

  const [calories, setCalories] = useState(String(calorieGoal));
  const [protein, setProtein] = useState(String(proteinGoal));
  const [carbs, setCarbs] = useState(String(carbsGoal));
  const [fat, setFat] = useState(String(fatGoal));

  const user = session?.user;
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const email = user?.email ?? '';
  const displayName = fullName || email.split('@')[0] || 'Account';

  function handleSaveGoals() {
    const cal = parseInt(calories, 10);
    const pro = parseInt(protein, 10);
    const car = parseInt(carbs, 10);
    const f = parseInt(fat, 10);
    if ([cal, pro, car, f].some(v => !Number.isFinite(v) || v <= 0)) {
      showToast('All goals must be positive numbers', 'error');
      return;
    }
    setCalorieGoal(cal);
    setMacroGoals({ proteinG: pro, carbsG: car, fatG: f });
    showToast('Goals saved');
  }

  function handleSyncToggle(value: boolean) {
    if (!value) {
      setSyncEnabled(false);
      showToast("Sync disabled. Data won't be backed up on reinstall.");
    } else {
      setSyncEnabled(true);
      showToast('Sync enabled.');
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // authStore already shows toast on error
    }
  }

  function handleDeleteAccount() {
    showToast('Coming soon');
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{getInitials(fullName || undefined, email || undefined)}</Text>
        </View>
        <View style={s.profileInfo}>
          <Text style={s.profileName}>{displayName}</Text>
          {email ? <Text style={s.profileEmail}>{email}</Text> : null}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Goals</Text>
        <View style={s.card}>
          <GoalRow label="Calories" unit="kcal" value={calories} onChangeText={setCalories} />
          <RowSeparator />
          <GoalRow label="Protein" unit="g" value={protein} onChangeText={setProtein} />
          <RowSeparator />
          <GoalRow label="Carbs" unit="g" value={carbs} onChangeText={setCarbs} />
          <RowSeparator />
          <GoalRow label="Fat" unit="g" value={fat} onChangeText={setFat} />
        </View>
        <Pressable
          style={s.saveBtn}
          onPress={handleSaveGoals}
          accessibilityLabel="Save goals"
          accessibilityRole="button"
        >
          <Text style={s.saveBtnTxt}>Save goals</Text>
        </Pressable>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Preferences</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Weight unit</Text>
            <View style={s.segmented}>
              {(['kg', 'lbs'] as WeightUnit[]).map(unit => (
                <Pressable
                  key={unit}
                  style={[s.segment, weightUnit === unit && s.segmentActive]}
                  onPress={() => setWeightUnit(unit)}
                  accessibilityLabel={unit}
                  accessibilityRole="button"
                  accessibilityState={{ selected: weightUnit === unit }}
                >
                  <Text style={[s.segmentTxt, weightUnit === unit && s.segmentActiveTxt]}>
                    {unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Data & Privacy</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Sync my data</Text>
            <Switch
              value={syncEnabled}
              onValueChange={handleSyncToggle}
              trackColor={{ true: Colors.brand, false: Colors.border }}
              accessibilityLabel="Sync my data"
            />
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          <Pressable
            style={s.row}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Text style={s.rowLabel}>Sign out</Text>
          </Pressable>
          <RowSeparator />
          <Pressable
            style={s.row}
            onPress={handleDeleteAccount}
            accessibilityLabel="Delete account"
            accessibilityRole="button"
          >
            <Text style={[s.rowLabel, s.dangerText]}>Delete account</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 8, paddingBottom: 48 },

  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.surface, fontSize: 18, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  section: { gap: 6 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  rowLabel: { fontSize: 15, color: Colors.textPrimary },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 16 },

  goalInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalInput: {
    width: 72,
    textAlign: 'right',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 36,
  },
  goalUnit: { fontSize: 13, color: Colors.textMuted, width: 32 },

  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  segment: { paddingHorizontal: 16, paddingVertical: 6, minWidth: 48, alignItems: 'center' },
  segmentActive: { backgroundColor: Colors.brand },
  segmentTxt: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  segmentActiveTxt: { color: Colors.surface },

  saveBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  saveBtnTxt: { color: Colors.surface, fontSize: 15, fontWeight: '700' },

  dangerText: { color: Colors.danger },
});
