# Settings Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a profile avatar to every tab header that opens a full-screen modal settings screen with goals, preferences, sync toggle, and account management.

**Architecture:** `ProfileAvatar` in `Tabs screenOptions.headerRight` navigates to `app/(protected)/settings.tsx` as a modal. Settings reads/writes `settingsStore` (which gains a new `syncEnabled` field) and `authStore`. Native tab headers are enabled and existing manual heading Text elements on plans/progress screens are removed.

**Tech Stack:** Expo Router (modal navigation), React Native (ScrollView, Switch, Alert, Pressable), Zustand (settingsStore, authStore, toastStore)

---

### Task 1: Add syncEnabled to settingsStore

**Files:**

- Modify: `store/settingsStore.ts`
- Modify: `__tests__/unit/settingsStore.test.ts`

- [ ] **Step 1: Write failing tests**

Add to the `beforeEach` `setState` call and append two tests at the bottom of the `describe` block in `__tests__/unit/settingsStore.test.ts`:

```typescript
// In beforeEach, add syncEnabled to setState:
useSettingsStore.setState({
  weightUnit: 'kg',
  selectedDate: today,
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
  syncEnabled: true, // ADD THIS
});

// New tests at end of describe block:
it('syncEnabled defaults to true', () => {
  expect(useSettingsStore.getState().syncEnabled).toBe(true);
});

it('setSyncEnabled updates syncEnabled', () => {
  useSettingsStore.getState().setSyncEnabled(false);
  expect(useSettingsStore.getState().syncEnabled).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/settingsStore.test.ts
```

Expected: FAIL — `syncEnabled` property does not exist, `setSyncEnabled` is not a function.

- [ ] **Step 3: Implement syncEnabled**

Replace `store/settingsStore.ts` with:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WeightUnit } from '@/types/weight-unit-type';
import { todayISO } from '@/utils/date';

interface SettingsState {
  weightUnit: WeightUnit;
  selectedDate: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  syncEnabled: boolean;
  setWeightUnit: (u: WeightUnit) => void;
  setSelectedDate: (d: string) => void;
  setCalorieGoal: (n: number) => void;
  setMacroGoals: (g: { proteinG: number; carbsG: number; fatG: number }) => void;
  setSyncEnabled: (v: boolean) => void;
  resetToToday: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      weightUnit: 'kg',
      selectedDate: todayISO(),
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
      syncEnabled: true,
      setWeightUnit: weightUnit => set({ weightUnit }),
      setSelectedDate: selectedDate => set({ selectedDate }),
      setCalorieGoal: calorieGoal => set({ calorieGoal }),
      setMacroGoals: ({ proteinG, carbsG, fatG }) =>
        set({ proteinGoal: proteinG, carbsGoal: carbsG, fatGoal: fatG }),
      setSyncEnabled: syncEnabled => set({ syncEnabled }),
      resetToToday: () => set({ selectedDate: todayISO() }),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/settingsStore.test.ts
```

Expected: PASS — all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add store/settingsStore.ts __tests__/unit/settingsStore.test.ts
git commit -m "feat: add syncEnabled to settingsStore"
```

---

### Task 2: Create ProfileAvatar component

**Files:**

- Create: `components/ProfileAvatar.tsx`

- [ ] **Step 1: Create the component**

Create `components/ProfileAvatar.tsx`:

```typescript
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/utils/colors';

function getInitials(name: string | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
    return (parts[0]![0] ?? '?').toUpperCase();
  }
  if (email) return email[0]!.toUpperCase();
  return '?';
}

export function ProfileAvatar() {
  const router = useRouter();
  const session = useAuthStore(s => s.session);
  const name = session?.user.user_metadata?.full_name as string | undefined;
  const email = session?.user.email;

  return (
    <Pressable
      onPress={() => router.push('/(protected)/settings')}
      style={s.avatar}
      accessibilityLabel="Open settings"
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={s.initials}>{getInitials(name, email)}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  initials: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors in `components/ProfileAvatar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ProfileAvatar.tsx
git commit -m "feat: add ProfileAvatar component"
```

---

### Task 3: Wire navigation — tab headers, settings route, remove stale headings

Enabling native tab headers (`headerShown: true`) means the manual `<Text style={s.heading}>` elements in `plans.tsx` and `progress.tsx` (which had `paddingTop: 60` to compensate for the missing header) become redundant and must be removed. `index.tsx` and `journal.tsx` use `DateHeader` instead of a heading text — those are unaffected.

**Files:**

- Modify: `app/(protected)/(tabs)/_layout.tsx`
- Modify: `app/(protected)/_layout.tsx`
- Modify: `app/(protected)/(tabs)/plans.tsx`
- Modify: `app/(protected)/(tabs)/progress.tsx`

- [ ] **Step 1: Update tab layout to enable headers with ProfileAvatar**

Replace `app/(protected)/(tabs)/_layout.tsx` with:

```typescript
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors as ThemeColors } from '@/constants/theme';
import { Colors } from '@/utils/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ThemeColors.light.tint,
        tabBarButton: HapticTab,
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: {
          color: Colors.textPrimary,
          fontWeight: '700' as const,
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerRight: () => <ProfileAvatar />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Food Log',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="fork.knife" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dumbbell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Add settings Stack.Screen to (protected)/\_layout.tsx**

In `app/(protected)/_layout.tsx`, add `<Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />` to **both** Stack blocks (the `skipAuth` block and the authenticated block). The full updated file:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/authStore';

export default function ProtectedLayout() {
  const session = useAuthStore(s => s.session);
  const isLoading = useAuthStore(s => s.isLoading);
  const skipAuth = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (skipAuth) return;
    AsyncStorage.getItem('onboardingComplete').then(val => {
      setOnboardingComplete(val === 'true');
      setOnboardingChecked(true);
    });
  }, [skipAuth]);

  if (skipAuth) {
    return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session/new"
          options={{ title: 'New workout', presentation: 'modal' }}
        />
        <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
        <Stack.Screen name="plan/new" options={{ title: 'New plan', presentation: 'modal' }} />
        <Stack.Screen name="plan/[id]" options={{ title: 'Plan' }} />
        <Stack.Screen
          name="food/search"
          options={{ title: 'Search food', presentation: 'modal' }}
        />
        <Stack.Screen name="food/add" options={{ title: 'Add food', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
      </Stack>
    );
  }

  if (isLoading || !onboardingChecked) return null;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!onboardingComplete) return <Redirect href="/(onboarding)/goal" />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="session/new" options={{ title: 'New workout', presentation: 'modal' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
      <Stack.Screen name="plan/new" options={{ title: 'New plan', presentation: 'modal' }} />
      <Stack.Screen name="plan/[id]" options={{ title: 'Plan' }} />
      <Stack.Screen name="food/search" options={{ title: 'Search food', presentation: 'modal' }} />
      <Stack.Screen name="food/add" options={{ title: 'Add food', presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
    </Stack>
  );
}
```

- [ ] **Step 3: Remove manual heading from plans.tsx**

In `app/(protected)/(tabs)/plans.tsx`:

1. Remove this line from the JSX (inside the `<View style={s.screen}>` block):

```typescript
<Text style={s.heading}>Training Plans</Text>
```

2. Remove the `heading` style from `StyleSheet.create`:

```typescript
heading: {
  fontSize: 22,
  fontWeight: '700',
  color: Colors.textPrimary,
  paddingHorizontal: 16,
  paddingTop: 60,
  paddingBottom: 8,
},
```

- [ ] **Step 4: Remove manual heading from progress.tsx**

In `app/(protected)/(tabs)/progress.tsx`:

1. Remove this line from the JSX (inside the `<View style={s.screen}>` block):

```typescript
<Text style={s.heading}>Progress</Text>
```

2. Remove the `heading` style from `StyleSheet.create`:

```typescript
heading: {
  fontSize: 22,
  fontWeight: '700',
  color: Colors.textPrimary,
  paddingHorizontal: 16,
  paddingTop: 60,
  paddingBottom: 8,
},
```

- [ ] **Step 5: Run typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/(protected)/(tabs)/_layout.tsx app/(protected)/_layout.tsx app/(protected)/(tabs)/plans.tsx app/(protected)/(tabs)/progress.tsx
git commit -m "feat: enable tab headers with ProfileAvatar, register settings route"
```

---

### Task 4: Write failing integration test for settings screen

Write the test before the screen exists so it fails correctly (module not found = red state).

**Files:**

- Create: `__tests__/integration/ui/SettingsScreen.test.tsx`

- [ ] **Step 1: Write the tests**

Create `__tests__/integration/ui/SettingsScreen.test.tsx`:

```typescript
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import SettingsScreen from '@/app/(protected)/settings';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/store/authStore');
jest.mock('@/store/settingsStore');
jest.mock('@/store/toastStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;
const mockUseToastStore = useToastStore as jest.MockedFunction<typeof useToastStore>;

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockSetCalorieGoal = jest.fn();
const mockSetMacroGoals = jest.fn();
const mockSetWeightUnit = jest.fn();
const mockSetSyncEnabled = jest.fn();
const mockShowToast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
    selector({
      session: {
        user: {
          email: 'test@example.com',
          user_metadata: { full_name: 'Jane Doe' },
        },
      },
      signOut: mockSignOut,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSettingsStore.mockImplementation((selector: (s: any) => any) =>
    selector({
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
      weightUnit: 'kg',
      syncEnabled: true,
      setCalorieGoal: mockSetCalorieGoal,
      setMacroGoals: mockSetMacroGoals,
      setWeightUnit: mockSetWeightUnit,
      setSyncEnabled: mockSetSyncEnabled,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseToastStore.mockImplementation((selector: (s: any) => any) =>
    selector({ showToast: mockShowToast }),
  );
});

describe('SettingsScreen', () => {
  it('renders profile name and email', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('saves goals when Save goals pressed with valid values', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Save goals'));
    expect(mockSetCalorieGoal).toHaveBeenCalledWith(2000);
    expect(mockSetMacroGoals).toHaveBeenCalledWith({ proteinG: 150, carbsG: 250, fatG: 65 });
    expect(mockShowToast).toHaveBeenCalledWith('Goals saved');
  });

  it('calls signOut when Sign out pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Sign out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows delete confirmation alert when Delete account pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Delete account'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete account?',
      expect.stringContaining('permanently deletes'),
      expect.any(Array),
    );
  });

  it('shows sync confirmation when sync toggled off', () => {
    render(<SettingsScreen />);
    fireEvent(screen.getByLabelText('Sync my data'), 'valueChange', false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Disable sync?',
      expect.stringContaining('disables backup'),
      expect.any(Array),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/SettingsScreen.test.tsx
```

Expected: FAIL — `Cannot find module '@/app/(protected)/settings'` (file does not exist yet).

- [ ] **Step 3: Commit the test**

```bash
git add __tests__/integration/ui/SettingsScreen.test.tsx
git commit -m "test: add failing SettingsScreen integration tests"
```

---

### Task 5: Implement settings screen

**Files:**

- Create: `app/(protected)/settings.tsx`

- [ ] **Step 1: Create the screen**

Create `app/(protected)/settings.tsx`:

```typescript
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import type { WeightUnit } from '@/types/weight-unit-type';
import { Colors } from '@/utils/colors';

function getInitials(name: string | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
    return (parts[0]![0] ?? '?').toUpperCase();
  }
  if (email) return email[0]!.toUpperCase();
  return '?';
}

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
    if ([cal, pro, car, f].some(v => !v || v <= 0)) {
      showToast('All goals must be positive numbers', 'error');
      return;
    }
    setCalorieGoal(cal);
    setMacroGoals({ proteinG: pro, carbsG: car, fatG: f });
    showToast('Goals saved');
  }

  function handleSyncToggle(value: boolean) {
    if (!value) {
      Alert.alert(
        'Disable sync?',
        "Opting out disables backup. Data lost on reinstall won't be recoverable.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: () => setSyncEnabled(false) },
        ],
      );
    } else {
      setSyncEnabled(true);
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
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all synced data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => showToast('Coming soon'),
        },
      ],
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {getInitials(fullName || undefined, email || undefined)}
          </Text>
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
```

- [ ] **Step 2: Run integration tests to verify they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/SettingsScreen.test.tsx
```

Expected: PASS — all 5 tests pass.

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --no-watchman --forceExit
```

Expected: all tests pass including previously passing tests.

- [ ] **Step 4: Run pre-commit checks**

```bash
npm run format && npm run lint && npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/(protected)/settings.tsx
git commit -m "feat: settings modal screen"
```
