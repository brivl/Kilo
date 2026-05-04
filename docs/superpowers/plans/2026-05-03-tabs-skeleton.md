# Tab Skeleton + Template Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Expo template tab shell with the four Phase 1 tabs (Food Log, Journal, Plans, Progress), delete template-only files, and leave every tab showing a placeholder so the tab bar renders correctly.

**Architecture:** Pure scaffolding — no data, no stores, no native modules. Every new tab screen is a stateless functional component rendering a centered text label. The only existing components touched are `app/_layout.tsx` (drop modal route) and `app/(tabs)/_layout.tsx` (swap two template tabs for four product tabs). Icons use the existing `IconSymbol` wrapper; new SF Symbol names are added to the `MAPPING` in `components/ui/icon-symbol.tsx` so Android/web continue to work.

**Tech Stack:** Expo Router file-based navigation, `expo-symbols` (SF Symbols on iOS), `@expo/vector-icons/MaterialIcons` (Android/web fallback), `ThemedText` / `ThemedView` from kept template components.

---

## File Map

| Action | Path                                  | Responsibility                               |
| ------ | ------------------------------------- | -------------------------------------------- |
| Modify | `app/(tabs)/_layout.tsx`              | Declare four product tabs with correct icons |
| Modify | `app/(tabs)/index.tsx`                | Placeholder food-log screen                  |
| Create | `app/(tabs)/journal.tsx`              | Placeholder gym journal screen               |
| Create | `app/(tabs)/plans.tsx`                | Placeholder training plans screen            |
| Create | `app/(tabs)/progress.tsx`             | Placeholder progress screen                  |
| Modify | `app/_layout.tsx`                     | Remove modal `Stack.Screen` entry            |
| Modify | `components/ui/icon-symbol.tsx`       | Add three SF Symbol → Material Icon mappings |
| Delete | `app/(tabs)/explore.tsx`              | Template screen, not used in Phase 1         |
| Delete | `app/modal.tsx`                       | Template modal, not used in Phase 1          |
| Delete | `components/hello-wave.tsx`           | Template component, not used in Phase 1      |
| Delete | `components/parallax-scroll-view.tsx` | Template component, not used in Phase 1      |
| Delete | `components/external-link.tsx`        | Template component, not used in Phase 1      |

---

### Task 1: Create the feature branch

**Files:** none

- [ ] **Step 1: Verify you are on `main` and working tree is clean**

```bash
git status
git branch
```

Expected: `On branch main`, no modified files (only untracked `docs/superpowers/plans/` is fine).

- [ ] **Step 2: Create and switch to the feature branch**

```bash
git checkout -b phase1/tabs-skeleton
```

Expected: `Switched to a new branch 'phase1/tabs-skeleton'`

---

### Task 2: Add missing icon mappings to `components/ui/icon-symbol.tsx`

The `IconSymbol` component uses SF Symbols on iOS and maps them to Material Icons for Android/web. Three new SF Symbol names need entries in `MAPPING` before `_layout.tsx` can reference them.

**Files:**

- Modify: `components/ui/icon-symbol.tsx`

- [ ] **Step 1: Open `components/ui/icon-symbol.tsx` and extend `MAPPING`**

Replace the existing `MAPPING` constant (lines 16–21) with:

```ts
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'fork.knife': 'restaurant',
  'dumbbell.fill': 'fitness-center',
  calendar: 'calendar-today',
  'chart.bar.fill': 'bar-chart',
} as IconMapping;
```

- [ ] **Step 2: Verify TypeScript accepts the file**

```bash
npx tsc --noEmit
```

Expected: exits 0. If you see `Type 'string' is not assignable`, the Material Icons name you used is misspelled — check `@expo/vector-icons/MaterialIcons` type definitions in `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.d.ts` for the correct name.

---

### Task 3: Replace `app/(tabs)/_layout.tsx` with four-tab layout

**Files:**

- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Overwrite `app/(tabs)/_layout.tsx` with the four-tab version**

```tsx
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
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

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exits 0. If you see `Property 'fork.knife' does not exist`, Task 2 mapping was not saved correctly — re-check `icon-symbol.tsx`.

---

### Task 4: Replace `app/(tabs)/index.tsx` with placeholder food-log screen

**Files:**

- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Overwrite `app/(tabs)/index.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function FoodLogScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Food Log</ThemedText>
      <ThemedText>Phase 1 — Food Log coming soon</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

---

### Task 5: Create placeholder `app/(tabs)/journal.tsx`

**Files:**

- Create: `app/(tabs)/journal.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function JournalScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Journal</ThemedText>
      <ThemedText>Phase 2 — Gym Journal coming soon</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

---

### Task 6: Create placeholder `app/(tabs)/plans.tsx`

**Files:**

- Create: `app/(tabs)/plans.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function PlansScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Plans</ThemedText>
      <ThemedText>Phase 3 — Training Plans coming soon</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

---

### Task 7: Create placeholder `app/(tabs)/progress.tsx`

**Files:**

- Create: `app/(tabs)/progress.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Progress</ThemedText>
      <ThemedText>Phase 4 — Progress Charts coming soon</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

---

### Task 8: Update `app/_layout.tsx` to remove the modal route

**Files:**

- Modify: `app/_layout.tsx`

- [ ] **Step 1: Overwrite `app/_layout.tsx`**

Remove the `modal` `Stack.Screen` entry and the `unstable_settings` export (no modal means no anchor override is needed):

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

---

### Task 9: Delete template-only files

**Files:**

- Delete: `app/(tabs)/explore.tsx`
- Delete: `app/modal.tsx`
- Delete: `components/hello-wave.tsx`
- Delete: `components/parallax-scroll-view.tsx`
- Delete: `components/external-link.tsx`

- [ ] **Step 1: Delete the five files**

```bash
rm app/(tabs)/explore.tsx app/modal.tsx components/hello-wave.tsx components/parallax-scroll-view.tsx components/external-link.tsx
```

- [ ] **Step 2: Confirm TypeScript is still clean after deletion**

```bash
npx tsc --noEmit
```

Expected: exits 0. If you see errors about deleted files still being imported, check `app/(tabs)/index.tsx` and any remaining component files for stale imports and remove them.

- [ ] **Step 3: Confirm the deleted files are gone**

```bash
ls app/(tabs)/ app/ components/
```

Expected output: no `explore.tsx`, `modal.tsx`, `hello-wave.tsx`, `parallax-scroll-view.tsx`, or `external-link.tsx` in their respective directories.

---

### Task 10: Run full verification

**Files:** none (read-only verification)

- [ ] **Step 1: TypeScript clean**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 2: Tests still pass**

```bash
npm test
```

Expected: exits with "no tests found" or "0 tests" — no crash, no import errors.

---

### Task 11: Commit

**Files:** all modified/created/deleted above

- [ ] **Step 1: Stage all changes**

```bash
git add app/(tabs)/_layout.tsx app/(tabs)/index.tsx app/(tabs)/journal.tsx app/(tabs)/plans.tsx app/(tabs)/progress.tsx app/_layout.tsx components/ui/icon-symbol.tsx
git rm app/(tabs)/explore.tsx app/modal.tsx components/hello-wave.tsx components/parallax-scroll-view.tsx components/external-link.tsx
```

- [ ] **Step 2: Confirm staged diff**

```bash
git diff --cached --stat
```

Expected: 7 modified/created files, 5 deletions.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: add four-tab skeleton and remove Expo template scaffolding

- (tabs)/_layout.tsx: four product tabs — Food Log, Journal, Plans, Progress
- index.tsx: placeholder food-log screen (Phase 1 coming soon)
- journal.tsx, plans.tsx, progress.tsx: placeholder screens for tabs
- _layout.tsx: removed modal Stack.Screen entry
- icon-symbol.tsx: added fork.knife, dumbbell.fill, calendar, chart.bar.fill mappings
- deleted: explore.tsx, modal.tsx, hello-wave.tsx, parallax-scroll-view.tsx, external-link.tsx

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds. Run `git log --oneline -3` to confirm.

---

## Self-Review

### Spec coverage check (from tasks.md Task 2)

| Requirement                                                                      | Covered       |
| -------------------------------------------------------------------------------- | ------------- |
| `(tabs)/_layout.tsx` declares four tabs: `index`, `journal`, `plans`, `progress` | Task 3 ✓      |
| Icons via `@expo/vector-icons` or `expo-symbols`                                 | Task 2 + 3 ✓  |
| `app/(tabs)/index.tsx` is a placeholder food-log screen                          | Task 4 ✓      |
| `app/(tabs)/journal.tsx` placeholder                                             | Task 5 ✓      |
| `app/(tabs)/plans.tsx` placeholder                                               | Task 6 ✓      |
| `app/(tabs)/progress.tsx` placeholder                                            | Task 7 ✓      |
| Deleted: `app/(tabs)/explore.tsx`                                                | Task 9 ✓      |
| Deleted: `app/modal.tsx`                                                         | Task 9 ✓      |
| Deleted: `components/hello-wave.tsx`                                             | Task 9 ✓      |
| Deleted: `components/parallax-scroll-view.tsx`                                   | Task 9 ✓      |
| Deleted: `components/external-link.tsx`                                          | Task 9 ✓      |
| Kept: themed components, haptic-tab, ui/ components                              | Not deleted ✓ |
| `app/_layout.tsx` drops modal route entry                                        | Task 8 ✓      |
| TS clean                                                                         | Task 10 ✓     |
| Committed to feature branch                                                      | Task 11 ✓     |

All requirements covered. No gaps.
