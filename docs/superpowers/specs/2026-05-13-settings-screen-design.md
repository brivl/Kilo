# Settings Screen Design

## Goal

A profile avatar in every tab's header opens a full-screen modal settings screen covering account info, macro/calorie goals, preferences, data privacy, and account management.

## Entry Point

A `ProfileAvatar` component sits in `headerRight` of the Tabs `screenOptions` — visible on all 4 tabs. It renders as a circle with the user's initials (fallback when no photo). Reads `authStore.session.user` for name/email.

Tapping navigates to `app/(protected)/settings.tsx` via `router.push('/(protected)/settings')`, presented as a modal.

## Screen Layout

### Profile card (top, read-only)

- Avatar (circle, initials fallback)
- Display name (from `user.user_metadata.full_name` or email prefix as fallback)
- Email address

No editing in v1.

### Goals section

Editable number inputs for:

- Calorie goal (kcal)
- Protein goal (g)
- Carbs goal (g)
- Fat goal (g)

Pre-filled from `settingsStore`. A Save button commits changes via `settingsStore.setCalorieGoal` and `settingsStore.setMacroGoals`. Inputs use `keyboardType="numeric"`. Validation: all values must be positive integers.

### Preferences section

Weight unit toggle: `kg` / `lbs`. Segmented control style. Updates `settingsStore.weightUnit` immediately (no save button needed).

### Data & Privacy section

**Sync toggle** (default on): enables/disables cloud sync to Supabase. Reads/writes `settingsStore.syncEnabled` (new boolean field, default `true`).

When toggled off: confirmation sheet — "Opting out disables backup. Data lost on reinstall won't be recoverable." Confirm → sets `syncEnabled = false`. Cancel → toggle stays on.

### Account section

**Sign out**: calls `authStore.signOut()`, on success redirects to `/(auth)/welcome`. Shows error toast on failure.

**Delete account** (destructive, red text): confirmation dialog — "This permanently deletes your account and all synced data. This cannot be undone." On confirm: calls a Supabase Edge Function to delete the auth user, clears local WatermelonDB, clears AsyncStorage (`onboardingComplete`, `settings`), redirects to `/(auth)/welcome`.

> **Phase 7 dependency:** The Edge Function for user deletion is built as part of Phase 7 (cloud sync). This settings screen implements the full UI and local teardown; the Edge Function call is wired up when Phase 7 ships. Until then, the button can show a "Coming soon" toast or be omitted from the initial build.

## Navigation

- `app/(protected)/_layout.tsx`: add `<Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />`
- `app/(protected)/(tabs)/_layout.tsx`: add `screenOptions={{ headerRight: () => <ProfileAvatar /> }}` to `<Tabs>`

## New Files

| File                           | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `app/(protected)/settings.tsx` | Settings modal screen                |
| `components/ProfileAvatar.tsx` | Circle avatar with initials fallback |

## Modified Files

| File                                 | Change                                      |
| ------------------------------------ | ------------------------------------------- |
| `app/(protected)/_layout.tsx`        | Add settings Stack.Screen                   |
| `app/(protected)/(tabs)/_layout.tsx` | Add headerRight to Tabs screenOptions       |
| `store/settingsStore.ts`             | Add `syncEnabled: boolean` (default `true`) |

## Out of Scope (v1)

- Avatar photo upload / picker
- Display name editing
- Push notification settings
- Supabase Edge Function for account deletion (referenced in Phase 7 sync spec — implemented there)
