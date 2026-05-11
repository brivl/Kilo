# Phase 6 — Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-screen first-run onboarding wizard that collects goal + stats + activity level, calculates TDEE-based calorie and macro targets via Mifflin-St Jeor, and saves them to `settingsStore`.

**Architecture:** `(onboarding)` route group at root level alongside `(auth)` and `(protected)`. `(protected)/_layout.tsx` checks `AsyncStorage` for `onboardingComplete` after auth and redirects to `/(onboarding)/goal` if missing. A non-persisted Zustand store carries wizard state across the 4 screens. Completing step 4 saves targets to `settingsStore`, sets the flag, and replaces to `/(protected)/(tabs)`. `EXPO_PUBLIC_SKIP_AUTH=true` bypasses both auth AND onboarding for local dev.

**Tech Stack:** Expo Router v3, Zustand (non-persisted), AsyncStorage, existing `settingsStore`, new `utils/tdee.ts`

---

## File map

| File                                                | Action                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `utils/tdee.ts`                                     | Create — BMR, TDEE, calorie target, macro split calculations                   |
| `store/onboardingStore.ts`                          | Create — non-persisted wizard state (goal, weight, height, age, sex, activity) |
| `app/_layout.tsx`                                   | Modify — add `(onboarding)` Stack.Screen                                       |
| `app/(onboarding)/_layout.tsx`                      | Create — headerless Stack for wizard                                           |
| `app/(onboarding)/goal.tsx`                         | Create — Step 1: goal selection                                                |
| `app/(onboarding)/stats.tsx`                        | Create — Step 2: weight / height / age / sex                                   |
| `app/(onboarding)/activity.tsx`                     | Create — Step 3: activity level                                                |
| `app/(onboarding)/targets.tsx`                      | Create — Step 4: review + edit targets, save                                   |
| `app/(protected)/_layout.tsx`                       | Modify — async onboarding gate                                                 |
| `__tests__/unit/tdee.test.ts`                       | Create — unit tests for TDEE calculations                                      |
| `__tests__/unit/onboardingStore.test.ts`            | Create — unit tests for store setters                                          |
| `__tests__/integration/ui/ProtectedLayout.test.tsx` | Modify — add waitFor + onboarding redirect test                                |
| `__tests__/integration/ui/TargetsScreen.test.tsx`   | Create — saves to store, sets flag, navigates                                  |

---

### Task 1: TDEE utilities

**Files:**

- Create: `utils/tdee.ts`
- Create: `__tests__/unit/tdee.test.ts`

- [ ] **Step 1: Create a feature branch**

```bash
git checkout -b feature/phase-6-onboarding
```

- [ ] **Step 2: Write the failing tests**

Create `__tests__/unit/tdee.test.ts`:

```ts
import {
  calculateBMR,
  calculateMacros,
  calculateTargetCalories,
  calculateTDEE,
} from '@/utils/tdee';

describe('calculateBMR', () => {
  it('calculates male BMR', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR(80, 180, 30, 'male')).toBe(1780);
  });

  it('calculates female BMR', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345.25);
  });
});

describe('calculateTDEE', () => {
  it('applies sedentary multiplier (×1.2)', () => {
    // BMR=1780, ×1.2 = 2136
    expect(calculateTDEE(80, 180, 30, 'male', 'sedentary')).toBe(2136);
  });

  it('applies moderate multiplier (×1.55)', () => {
    // BMR=1780, ×1.55 = 2759
    expect(calculateTDEE(80, 180, 30, 'male', 'moderate')).toBe(2759);
  });
});

describe('calculateTargetCalories', () => {
  it('subtracts 500 for lose', () => {
    expect(calculateTargetCalories(2000, 'lose')).toBe(1500);
  });
  it('adds 300 for gain', () => {
    expect(calculateTargetCalories(2000, 'gain')).toBe(2300);
  });
  it('is unchanged for maintain', () => {
    expect(calculateTargetCalories(2000, 'maintain')).toBe(2000);
  });
  it('is unchanged for recomp', () => {
    expect(calculateTargetCalories(2000, 'recomp')).toBe(2000);
  });
});

describe('calculateMacros', () => {
  it('calculates lose macros (40/30/30)', () => {
    // 1500 cal: protein 40%=600/4=150g, carbs 30%=450/4=113g, fat 30%=450/9=50g
    expect(calculateMacros(1500, 'lose')).toEqual({ proteinG: 150, carbsG: 113, fatG: 50 });
  });

  it('calculates gain macros (30/50/20)', () => {
    // 2300 cal: protein 30%=690/4=173g, carbs 50%=1150/4=288g, fat 20%=460/9=51g
    expect(calculateMacros(2300, 'gain')).toEqual({ proteinG: 173, carbsG: 288, fatG: 51 });
  });

  it('calculates maintain macros (30/45/25)', () => {
    // 2000 cal: protein 30%=600/4=150g, carbs 45%=900/4=225g, fat 25%=500/9=56g
    expect(calculateMacros(2000, 'maintain')).toEqual({ proteinG: 150, carbsG: 225, fatG: 56 });
  });

  it('calculates recomp macros (40/35/25)', () => {
    // 2000 cal: protein 40%=800/4=200g, carbs 35%=700/4=175g, fat 25%=500/9=56g
    expect(calculateMacros(2000, 'recomp')).toEqual({ proteinG: 200, carbsG: 175, fatG: 56 });
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/tdee.test.ts
```

Expected: FAIL — "Cannot find module '@/utils/tdee'"

- [ ] **Step 4: Create `utils/tdee.ts`**

```ts
export type Goal = 'lose' | 'gain' | 'maintain' | 'recomp';
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  gain: 300,
  maintain: 0,
  recomp: 0,
};

const MACRO_SPLITS: Record<Goal, { protein: number; carbs: number; fat: number }> = {
  lose: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  gain: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  maintain: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  recomp: { protein: 0.4, carbs: 0.35, fat: 0.25 },
};

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activityLevel: ActivityLevel,
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateTargetCalories(tdee: number, goal: Goal): number {
  return tdee + GOAL_ADJUSTMENTS[goal];
}

export function calculateMacros(
  calories: number,
  goal: Goal,
): { proteinG: number; carbsG: number; fatG: number } {
  const { protein, carbs, fat } = MACRO_SPLITS[goal];
  return {
    proteinG: Math.round((calories * protein) / 4),
    carbsG: Math.round((calories * carbs) / 4),
    fatG: Math.round((calories * fat) / 9),
  };
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/tdee.test.ts
```

Expected: PASS — 10 tests

- [ ] **Step 6: Commit**

```bash
git add utils/tdee.ts __tests__/unit/tdee.test.ts
git commit -m "feat: TDEE and macro calculation utilities"
```

---

### Task 2: Onboarding store

**Files:**

- Create: `store/onboardingStore.ts`
- Create: `__tests__/unit/onboardingStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/unit/onboardingStore.test.ts`:

```ts
import { useOnboardingStore } from '@/store/onboardingStore';

beforeEach(() => {
  useOnboardingStore.setState({
    goal: null,
    weightKg: null,
    heightCm: null,
    age: null,
    sex: null,
    activityLevel: null,
  });
});

it('setGoal updates goal', () => {
  useOnboardingStore.getState().setGoal('lose');
  expect(useOnboardingStore.getState().goal).toBe('lose');
});

it('setStats updates all stats fields', () => {
  useOnboardingStore.getState().setStats({ weightKg: 80, heightCm: 180, age: 30, sex: 'male' });
  const s = useOnboardingStore.getState();
  expect(s.weightKg).toBe(80);
  expect(s.heightCm).toBe(180);
  expect(s.age).toBe(30);
  expect(s.sex).toBe('male');
});

it('setActivityLevel updates activityLevel', () => {
  useOnboardingStore.getState().setActivityLevel('moderate');
  expect(useOnboardingStore.getState().activityLevel).toBe('moderate');
});

it('reset clears all fields to null', () => {
  useOnboardingStore.getState().setGoal('gain');
  useOnboardingStore.getState().setActivityLevel('very');
  useOnboardingStore.getState().reset();
  const s = useOnboardingStore.getState();
  expect(s.goal).toBeNull();
  expect(s.activityLevel).toBeNull();
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/onboardingStore.test.ts
```

Expected: FAIL — "Cannot find module '@/store/onboardingStore'"

- [ ] **Step 3: Create `store/onboardingStore.ts`**

```ts
import { create } from 'zustand';

import type { ActivityLevel, Goal, Sex } from '@/utils/tdee';

interface OnboardingState {
  goal: Goal | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: Sex | null;
  activityLevel: ActivityLevel | null;
  setGoal: (goal: Goal) => void;
  setStats: (stats: { weightKg: number; heightCm: number; age: number; sex: Sex }) => void;
  setActivityLevel: (activityLevel: ActivityLevel) => void;
  reset: () => void;
}

const initialState = {
  goal: null,
  weightKg: null,
  heightCm: null,
  age: null,
  sex: null,
  activityLevel: null,
} as const;

export const useOnboardingStore = create<OnboardingState>()(set => ({
  ...initialState,
  setGoal: goal => set({ goal }),
  setStats: stats => set(stats),
  setActivityLevel: activityLevel => set({ activityLevel }),
  reset: () => set(initialState),
}));
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/onboardingStore.test.ts
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add store/onboardingStore.ts __tests__/unit/onboardingStore.test.ts
git commit -m "feat: onboarding wizard Zustand store"
```

---

### Task 3: Routing setup + protected layout onboarding gate

**Files:**

- Modify: `app/_layout.tsx`
- Create: `app/(onboarding)/_layout.tsx`
- Modify: `app/(protected)/_layout.tsx`
- Modify: `__tests__/integration/ui/ProtectedLayout.test.tsx`

**Context:** `(protected)/_layout.tsx` currently returns null while `isLoading`, redirects if no session, else renders Stack. We add an async AsyncStorage check. `skipAuth=true` bypasses both auth AND onboarding (dev bypass). Tests 3 and 4 in the existing file need updating to use `waitFor`. A new test 5 verifies the onboarding redirect.

- [ ] **Step 1: Add `(onboarding)` screen to root layout**

In `app/_layout.tsx`, add one `Stack.Screen` for `(onboarding)`:

```tsx
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Toast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </View>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Create `app/(onboarding)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Update `app/(protected)/_layout.tsx`**

```tsx
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
    AsyncStorage.getItem('onboardingComplete').then(val => {
      setOnboardingComplete(val === 'true');
      setOnboardingChecked(true);
    });
  }, []);

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
    </Stack>
  );
}
```

- [ ] **Step 4: Update `__tests__/integration/ui/ProtectedLayout.test.tsx`**

Replace the entire file:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';

import ProtectedLayout from '@/app/(protected)/_layout';
import { useAuthStore } from '@/store/authStore';

let mockRedirect: jest.Mock;

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  mockRedirect = jest.fn();
  return {
    Redirect: (props: { href: string }) => {
      mockRedirect(props);
      return null;
    },
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) => (
        <Text testID="protected-stack">{children}</Text>
      ),
      { Screen: () => null },
    ),
  };
});

jest.mock('@/store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('ProtectedLayout', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_SKIP_AUTH;
    await AsyncStorage.clear();
  });

  it('renders nothing while loading', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: null, isLoading: true }),
    );
    render(<ProtectedLayout />);
    expect(screen.toJSON()).toBeNull();
  });

  it('redirects to welcome when no session', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: null, isLoading: false }),
    );
    render(<ProtectedLayout />);
    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/welcome' }));
  });

  it('redirects to onboarding when session exists but onboarding not complete', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: { user: { id: '1' } }, isLoading: false }),
    );
    render(<ProtectedLayout />);
    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith({ href: '/(onboarding)/goal' }));
  });

  it('renders Stack when session exists and onboarding is complete', async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: { user: { id: '1' } }, isLoading: false }),
    );
    render(<ProtectedLayout />);
    await waitFor(() => expect(screen.getByTestId('protected-stack')).toBeTruthy());
  });

  it('renders Stack immediately when skipAuth is true', () => {
    process.env.EXPO_PUBLIC_SKIP_AUTH = 'true';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: null, isLoading: false }),
    );
    render(<ProtectedLayout />);
    expect(screen.getByTestId('protected-stack')).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run the updated ProtectedLayout tests**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/ProtectedLayout.test.tsx
```

Expected: PASS — 5 tests

- [ ] **Step 6: Run the full test suite to catch regressions**

```bash
npm test -- --no-watchman --forceExit
```

Expected: all passing

- [ ] **Step 7: Commit**

```bash
git add app/_layout.tsx "app/(onboarding)/_layout.tsx" "app/(protected)/_layout.tsx" __tests__/integration/ui/ProtectedLayout.test.tsx
git commit -m "feat: onboarding routing and auth gate"
```

---

### Task 4: Goal screen

**Files:**

- Create: `app/(onboarding)/goal.tsx`

- [ ] **Step 1: Create `app/(onboarding)/goal.tsx`**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import type { Goal } from '@/utils/tdee';

const GOALS: { key: Goal; label: string; description: string }[] = [
  { key: 'lose', label: 'Lose weight', description: 'Burn fat and reduce body weight' },
  { key: 'gain', label: 'Gain muscle', description: 'Build strength and add mass' },
  { key: 'maintain', label: 'Maintain', description: 'Keep current weight and composition' },
  { key: 'recomp', label: 'Body recomp', description: 'Lose fat while building muscle' },
];

export default function GoalScreen() {
  const router = useRouter();
  const setGoal = useOnboardingStore(s => s.setGoal);
  const goal = useOnboardingStore(s => s.goal);

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/(protected)/(tabs)');
  };

  const handleSelect = (key: Goal) => {
    setGoal(key);
    router.push('/(onboarding)/stats');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 1 of 4</Text>
      <Text style={styles.title}>What's your primary goal?</Text>

      <View style={styles.options}>
        {GOALS.map(g => (
          <TouchableOpacity
            key={g.key}
            style={[styles.card, goal === g.key && styles.cardSelected]}
            onPress={() => handleSelect(g.key)}
            accessibilityLabel={g.label}
          >
            <Text style={[styles.cardLabel, goal === g.key && styles.cardLabelSelected]}>
              {g.label}
            </Text>
            <Text style={styles.cardDescription}>{g.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleSkip} accessibilityLabel="Skip onboarding">
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  step: { fontSize: 14, color: '#999', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 32 },
  options: { flex: 1, gap: 12 },
  card: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 16 },
  cardSelected: { borderColor: '#000', backgroundColor: '#f5f5f5' },
  cardLabel: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  cardLabelSelected: { color: '#000' },
  cardDescription: { fontSize: 14, color: '#666' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 16 },
});
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/goal.tsx"
git commit -m "feat: onboarding goal selection screen"
```

---

### Task 5: Stats screen

**Files:**

- Create: `app/(onboarding)/stats.tsx`

- [ ] **Step 1: Create `app/(onboarding)/stats.tsx`**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import type { Sex } from '@/utils/tdee';

export default function StatsScreen() {
  const router = useRouter();
  const setStats = useOnboardingStore(s => s.setStats);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');

  const isValid = !!parseFloat(weight) && !!parseFloat(height) && !!parseInt(age, 10);

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/(protected)/(tabs)');
  };

  const handleNext = () => {
    const weightKg = parseFloat(weight);
    const heightCm = parseFloat(height);
    const ageNum = parseInt(age, 10);
    if (!weightKg || !heightCm || !ageNum) return;
    setStats({ weightKg, heightCm, age: ageNum, sex });
    router.push('/(onboarding)/activity');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 2 of 4</Text>
      <Text style={styles.title}>Tell us about yourself</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 80"
          accessibilityLabel="Weight in kg"
        />

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 175"
          accessibilityLabel="Height in cm"
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          placeholder="e.g. 28"
          accessibilityLabel="Age"
        />

        <Text style={styles.label}>Biological sex</Text>
        <View style={styles.sexToggle}>
          {(['male', 'female'] as Sex[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sexButton, sex === s && styles.sexButtonSelected]}
              onPress={() => setSex(s)}
              accessibilityLabel={s.charAt(0).toUpperCase() + s.slice(1)}
            >
              <Text style={[styles.sexButtonText, sex === s && styles.sexButtonTextSelected]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isValid}
        accessibilityLabel="Next step"
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSkip} accessibilityLabel="Skip onboarding">
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  step: { fontSize: 14, color: '#999', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 32 },
  form: { flex: 1, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  sexToggle: { flexDirection: 'row', gap: 12 },
  sexButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexButtonSelected: { borderColor: '#000', backgroundColor: '#f5f5f5' },
  sexButtonText: { fontSize: 16, color: '#666' },
  sexButtonTextSelected: { color: '#000', fontWeight: '600' },
  nextButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: { backgroundColor: '#ccc' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 16 },
});
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/stats.tsx"
git commit -m "feat: onboarding stats entry screen"
```

---

### Task 6: Activity screen

**Files:**

- Create: `app/(onboarding)/activity.tsx`

- [ ] **Step 1: Create `app/(onboarding)/activity.tsx`**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import type { ActivityLevel } from '@/utils/tdee';

const LEVELS: { key: ActivityLevel; label: string; description: string }[] = [
  { key: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { key: 'light', label: 'Lightly active', description: '1–3 days/week' },
  { key: 'moderate', label: 'Moderately active', description: '3–5 days/week' },
  { key: 'very', label: 'Very active', description: '6–7 days/week' },
  { key: 'extreme', label: 'Extremely active', description: 'Physical job or 2× daily training' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const setActivityLevel = useOnboardingStore(s => s.setActivityLevel);
  const activityLevel = useOnboardingStore(s => s.activityLevel);

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/(protected)/(tabs)');
  };

  const handleSelect = (key: ActivityLevel) => {
    setActivityLevel(key);
    router.push('/(onboarding)/targets');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 3 of 4</Text>
      <Text style={styles.title}>Activity level</Text>

      <View style={styles.options}>
        {LEVELS.map(l => (
          <TouchableOpacity
            key={l.key}
            style={[styles.card, activityLevel === l.key && styles.cardSelected]}
            onPress={() => handleSelect(l.key)}
            accessibilityLabel={l.label}
          >
            <Text style={[styles.cardLabel, activityLevel === l.key && styles.cardLabelSelected]}>
              {l.label}
            </Text>
            <Text style={styles.cardDescription}>{l.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleSkip} accessibilityLabel="Skip onboarding">
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  step: { fontSize: 14, color: '#999', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 32 },
  options: { flex: 1, gap: 10 },
  card: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 14 },
  cardSelected: { borderColor: '#000', backgroundColor: '#f5f5f5' },
  cardLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  cardLabelSelected: { color: '#000' },
  cardDescription: { fontSize: 13, color: '#666' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 16 },
});
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/activity.tsx"
git commit -m "feat: onboarding activity level screen"
```

---

### Task 7: Targets screen + integration tests

**Files:**

- Create: `app/(onboarding)/targets.tsx`
- Create: `__tests__/integration/ui/TargetsScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/integration/ui/TargetsScreen.test.tsx`:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import TargetsScreen from '@/app/(onboarding)/targets';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

jest.mock('@/store/onboardingStore');
jest.mock('@/store/settingsStore');

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

describe('TargetsScreen', () => {
  const mockSetCalorieGoal = jest.fn();
  const mockSetMacroGoals = jest.fn();
  const mockReset = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: (s: any) => any) =>
      selector({ setCalorieGoal: mockSetCalorieGoal, setMacroGoals: mockSetMacroGoals }),
    );
  });

  it('auto-populates fields from onboarding store', async () => {
    mockUseOnboardingStore.mockReturnValue({
      goal: 'lose',
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: 'male',
      activityLevel: 'sedentary',
      setGoal: jest.fn(),
      setStats: jest.fn(),
      setActivityLevel: jest.fn(),
      reset: mockReset,
    });
    render(<TargetsScreen />);
    // BMR=1780, TDEE=round(1780×1.2)=2136, target=2136-500=1636
    await waitFor(() => expect(screen.getByDisplayValue('1636')).toBeTruthy());
  });

  it('saves targets to settingsStore, sets flag, resets store, navigates on submit', async () => {
    mockUseOnboardingStore.mockReturnValue({
      goal: 'maintain',
      weightKg: 70,
      heightCm: 170,
      age: 25,
      sex: 'female',
      activityLevel: 'moderate',
      setGoal: jest.fn(),
      setStats: jest.fn(),
      setActivityLevel: jest.fn(),
      reset: mockReset,
    });
    render(<TargetsScreen />);
    await waitFor(() => screen.getByAccessibilityLabel('Save targets'));
    await act(async () => {
      fireEvent.press(screen.getByAccessibilityLabel('Save targets'));
    });
    expect(mockSetCalorieGoal).toHaveBeenCalled();
    expect(mockSetMacroGoals).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(await AsyncStorage.getItem('onboardingComplete')).toBe('true');
    expect(mockReplace).toHaveBeenCalledWith('/(protected)/(tabs)');
  });

  it('skipping sets flag and navigates without saving goals', async () => {
    mockUseOnboardingStore.mockReturnValue({
      goal: null,
      weightKg: null,
      heightCm: null,
      age: null,
      sex: null,
      activityLevel: null,
      setGoal: jest.fn(),
      setStats: jest.fn(),
      setActivityLevel: jest.fn(),
      reset: mockReset,
    });
    render(<TargetsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByAccessibilityLabel('Use defaults instead'));
    });
    expect(mockSetCalorieGoal).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('onboardingComplete')).toBe('true');
    expect(mockReplace).toHaveBeenCalledWith('/(protected)/(tabs)');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/TargetsScreen.test.tsx
```

Expected: FAIL — "Cannot find module '@/app/(onboarding)/targets'"

- [ ] **Step 3: Create `app/(onboarding)/targets.tsx`**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { calculateMacros, calculateTargetCalories, calculateTDEE } from '@/utils/tdee';

export default function TargetsScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const setCalorieGoal = useSettingsStore(s => s.setCalorieGoal);
  const setMacroGoals = useSettingsStore(s => s.setMacroGoals);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    const { goal, weightKg, heightCm, age, sex, activityLevel } = store;
    if (goal && weightKg && heightCm && age && sex && activityLevel) {
      const tdee = calculateTDEE(weightKg, heightCm, age, sex, activityLevel);
      const targetCal = calculateTargetCalories(tdee, goal);
      const macros = calculateMacros(targetCal, goal);
      setCalories(String(targetCal));
      setProtein(String(macros.proteinG));
      setCarbs(String(macros.carbsG));
      setFat(String(macros.fatG));
    }
  }, [store]);

  const handleSave = async () => {
    setCalorieGoal(parseInt(calories, 10) || 2000);
    setMacroGoals({
      proteinG: parseInt(protein, 10) || 150,
      carbsG: parseInt(carbs, 10) || 250,
      fatG: parseInt(fat, 10) || 65,
    });
    await AsyncStorage.setItem('onboardingComplete', 'true');
    store.reset();
    router.replace('/(protected)/(tabs)');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    store.reset();
    router.replace('/(protected)/(tabs)');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.step}>Step 4 of 4</Text>
      <Text style={styles.title}>Your daily targets</Text>
      <Text style={styles.subtitle}>Calculated from your stats. Adjust if needed.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Daily calories</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          accessibilityLabel="Daily calories"
        />

        <Text style={styles.label}>Protein (g)</Text>
        <TextInput
          style={styles.input}
          value={protein}
          onChangeText={setProtein}
          keyboardType="number-pad"
          accessibilityLabel="Protein goal"
        />

        <Text style={styles.label}>Carbohydrates (g)</Text>
        <TextInput
          style={styles.input}
          value={carbs}
          onChangeText={setCarbs}
          keyboardType="number-pad"
          accessibilityLabel="Carbs goal"
        />

        <Text style={styles.label}>Fat (g)</Text>
        <TextInput
          style={styles.input}
          value={fat}
          onChangeText={setFat}
          keyboardType="number-pad"
          accessibilityLabel="Fat goal"
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        accessibilityLabel="Save targets"
      >
        <Text style={styles.saveButtonText}>Save & get started</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSkip} accessibilityLabel="Use defaults instead">
        <Text style={styles.skip}>Use defaults instead</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingTop: 48 },
  step: { fontSize: 14, color: '#999', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  form: { gap: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 16 },
});
```

- [ ] **Step 4: Run TargetsScreen tests**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/TargetsScreen.test.tsx
```

Expected: PASS — 3 tests

- [ ] **Step 5: Run full suite**

```bash
npm test -- --no-watchman --forceExit
```

Expected: all passing

- [ ] **Step 6: Commit**

```bash
git add "app/(onboarding)/targets.tsx" __tests__/integration/ui/TargetsScreen.test.tsx
git commit -m "feat: onboarding targets screen with TDEE calculation and tests"
```

---

### Task 8: Final verification

**Files:** none — verification only

- [ ] **Step 1: Full test suite**

```bash
npm test -- --no-watchman --forceExit
```

Expected: all tests pass (was 91 before this phase; should now be ~105+)

- [ ] **Step 2: TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors (pre-existing `authStore.test.ts` `noUncheckedIndexedAccess` errors are acceptable)

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 4: Format check**

```bash
npm run format:check
```

If issues: `npm run format` then re-check.

- [ ] **Step 5: Update tasks.md** — mark #33 complete

- [ ] **Step 6: Final commit if needed**

```bash
git add -p
git commit -m "chore: phase 6 onboarding final verification"
```
