# Account Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed-in users permanently delete their account — calling a Supabase Edge Function to remove the auth user (and cascade-delete all Postgres rows), then wiping local WatermelonDB and AsyncStorage, and redirecting to the welcome screen.

**Architecture:** A Deno Edge Function (`delete-user`) verifies the caller's JWT then uses the Supabase service-role key to delete the auth user. `ON DELETE CASCADE` removes all Postgres rows for that user automatically. The client calls the function via `supabase.functions.invoke`, then wipes local data (`database.unsafeResetDatabase` + `AsyncStorage.multiRemove`) and signs out. A two-step confirmation in the settings screen (no `Alert.alert` — project rule) shows a warning box with Cancel/Confirm buttons after the first tap.

**Tech Stack:** Deno (Edge Function), `@supabase/supabase-js` admin client, WatermelonDB `unsafeResetDatabase`, AsyncStorage, Zustand authStore, React Native Pressable.

---

## File map

| File | Change |
|------|--------|
| `supabase/functions/delete-user/index.ts` | New — Deno Edge Function |
| `store/authStore.ts` | Add `deleteAccount()` action |
| `app/(protected)/settings.tsx` | Replace "Coming soon" stub with two-step confirm flow |
| `__tests__/unit/authStore.test.ts` | Add `deleteAccount` unit test |
| `__tests__/integration/ui/SettingsScreen.test.tsx` | Add delete-account integration tests |

---

### Task 1: Supabase Edge Function

Creates the server-side function that deletes the auth user. Must use the service-role key (never exposed to the client).

**Files:**
- Create: `supabase/functions/delete-user/index.ts`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/delete-user/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify caller's JWT by using the anon key + their token
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete the auth user via admin client — ON DELETE CASCADE handles all rows
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/delete-user/index.ts
git commit -m "feat: add delete-user supabase edge function"
```

No automated test for the Edge Function — it runs in the Deno runtime which is not available in the Jest environment. Manual verification step is in Task 4.

---

### Task 2: `deleteAccount` action in authStore + unit test

Adds `deleteAccount()` to the Zustand authStore so the settings screen can call it without importing `supabase` directly (keeps all Supabase calls inside the store layer, matching the existing pattern).

**Files:**
- Modify: `store/authStore.ts`
- Modify: `__tests__/unit/authStore.test.ts`

- [ ] **Step 1: Write the failing test**

Open `__tests__/unit/authStore.test.ts`. Add these imports at the top (alongside existing ones):

The file already imports `useAuthStore` and mocks `@/lib/supabase`. Add a `functions` key to the existing supabase mock so it looks like:

```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));
```

Then add a new describe block at the end of the file:

```typescript
describe('deleteAccount', () => {
  it('calls supabase.functions.invoke("delete-user")', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({ error: null });
    await useAuthStore.getState().deleteAccount();
    expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-user');
  });

  it('throws when Edge Function returns an error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      error: { message: 'deletion failed' },
    });
    await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('deletion failed');
  });
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/authStore.test.ts
```

Expected: FAIL — `useAuthStore.getState().deleteAccount is not a function`.

- [ ] **Step 3: Add `deleteAccount` to authStore**

In `store/authStore.ts`, add `deleteAccount: () => Promise<void>` to the interface (alongside `signOut`), then add the implementation inside `create(...)`:

```typescript
deleteAccount: async () => {
  const { error } = await supabase.functions.invoke('delete-user');
  if (error) throw new Error((error as { message?: string }).message ?? 'Failed to delete account');
},
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npm test -- --no-watchman --forceExit __tests__/unit/authStore.test.ts
```

Expected: all authStore tests pass.

- [ ] **Step 5: Commit**

```bash
git add store/authStore.ts __tests__/unit/authStore.test.ts
git commit -m "feat: add deleteAccount action to authStore"
```

---

### Task 3: Settings screen delete flow + integration tests

Replaces the "Coming soon" toast with a two-step confirmation UI. First tap reveals a warning box with Cancel and Confirm buttons. Confirming calls `deleteAccount()`, wipes WatermelonDB and AsyncStorage, then signs out (triggering redirect via `ProtectedLayout`).

**Files:**
- Modify: `app/(protected)/settings.tsx`
- Modify: `__tests__/integration/ui/SettingsScreen.test.tsx`

- [ ] **Step 1: Write the failing tests**

In `__tests__/integration/ui/SettingsScreen.test.tsx`:

1. Add a mock for `@/db/database` (insert near the top alongside other mocks):

```typescript
jest.mock('@/db/database', () => ({
  database: {
    write: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
    unsafeResetDatabase: jest.fn().mockResolvedValue(undefined),
  },
}));
```

2. Add `mockDeleteAccount` and `mockSignOut` to the mock setup. Update the authStore mock in `beforeEach` to include both:

```typescript
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockDeleteAccount = jest.fn().mockResolvedValue(undefined);
```

And in `mockUseAuthStore.mockImplementation(...)`:

```typescript
selector({
  session: {
    user: {
      email: 'test@example.com',
      user_metadata: { full_name: 'Jane Doe' },
    },
  },
  signOut: mockSignOut,
  deleteAccount: mockDeleteAccount,
}),
```

3. Add three new tests inside `describe('SettingsScreen', ...)`:

```typescript
it('shows confirmation box when Delete account pressed', () => {
  render(<SettingsScreen />);
  fireEvent.press(screen.getByLabelText('Delete account'));
  expect(screen.getByLabelText('Confirm delete account')).toBeTruthy();
  expect(screen.getByLabelText('Cancel deletion')).toBeTruthy();
});

it('hides confirmation box when Cancel pressed', () => {
  render(<SettingsScreen />);
  fireEvent.press(screen.getByLabelText('Delete account'));
  fireEvent.press(screen.getByLabelText('Cancel deletion'));
  expect(screen.queryByLabelText('Confirm delete account')).toBeNull();
});

it('calls deleteAccount, clears storage, and signs out when Confirm delete pressed', async () => {
  render(<SettingsScreen />);
  fireEvent.press(screen.getByLabelText('Delete account'));
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Confirm delete account'));
  });
  expect(mockDeleteAccount).toHaveBeenCalled();
  expect(mockSignOut).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/SettingsScreen.test.tsx
```

Expected: FAIL — confirmation elements not found.

- [ ] **Step 3: Update `app/(protected)/settings.tsx`**

Add the following imports at the top alongside existing ones:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

import { database } from '@/db/database';
```

Add `deleteAccount` selector inside `SettingsScreen()` — `signOut` is already selected, don't duplicate it:

```typescript
const deleteAccount = useAuthStore(s => s.deleteAccount);
```

Add state for the delete step (alongside other `useState` calls):

```typescript
const [deleteStep, setDeleteStep] = useState<'idle' | 'confirming' | 'deleting'>('idle');
```

Replace the existing `handleDeleteAccount` function with:

```typescript
function handleDeleteAccount() {
  setDeleteStep('confirming');
}

async function handleConfirmDelete() {
  setDeleteStep('deleting');
  try {
    await deleteAccount();
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    await AsyncStorage.multiRemove(['onboardingComplete', 'settings']);
    await signOut();
  } catch {
    setDeleteStep('idle');
    showToast("Couldn't delete account", 'error');
  }
}
```

Replace the existing "Delete account" `Pressable` (in the Account card) with:

```typescript
<RowSeparator />
<Pressable
  style={s.row}
  onPress={handleDeleteAccount}
  disabled={deleteStep !== 'idle'}
  accessibilityLabel="Delete account"
  accessibilityRole="button"
>
  <Text style={[s.rowLabel, s.dangerText]}>Delete account</Text>
</Pressable>
{deleteStep !== 'idle' ? (
  <View style={s.deleteConfirmBox}>
    <Text style={s.deleteConfirmText}>
      This permanently deletes your account and all data. This cannot be undone.
    </Text>
    <View style={s.deleteConfirmRow}>
      <Pressable
        style={s.cancelBtn}
        onPress={() => setDeleteStep('idle')}
        disabled={deleteStep === 'deleting'}
        accessibilityLabel="Cancel deletion"
        accessibilityRole="button"
      >
        <Text style={s.cancelBtnTxt}>Cancel</Text>
      </Pressable>
      <Pressable
        style={s.confirmDeleteBtn}
        onPress={handleConfirmDelete}
        disabled={deleteStep === 'deleting'}
        accessibilityLabel="Confirm delete account"
        accessibilityRole="button"
      >
        <Text style={s.confirmDeleteBtnTxt}>
          {deleteStep === 'deleting' ? 'Deleting…' : 'Confirm delete'}
        </Text>
      </Pressable>
    </View>
  </View>
) : null}
```

Add these styles to the `StyleSheet.create` block:

```typescript
deleteConfirmBox: {
  backgroundColor: Colors.background,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
  padding: 16,
  gap: 12,
},
deleteConfirmText: {
  fontSize: 13,
  color: Colors.textMuted,
  lineHeight: 18,
},
deleteConfirmRow: {
  flexDirection: 'row',
  gap: 8,
},
cancelBtn: {
  flex: 1,
  backgroundColor: Colors.surface,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: Colors.border,
  paddingVertical: 10,
  alignItems: 'center',
  minHeight: 44,
  justifyContent: 'center',
},
cancelBtnTxt: {
  fontSize: 14,
  color: Colors.textPrimary,
  fontWeight: '600',
},
confirmDeleteBtn: {
  flex: 1,
  backgroundColor: Colors.danger,
  borderRadius: 8,
  paddingVertical: 10,
  alignItems: 'center',
  minHeight: 44,
  justifyContent: 'center',
},
confirmDeleteBtnTxt: {
  fontSize: 14,
  color: Colors.surface,
  fontWeight: '600',
},
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test -- --no-watchman --forceExit __tests__/integration/ui/SettingsScreen.test.tsx
```

Expected: all 10 SettingsScreen tests pass (7 existing + 3 new).

- [ ] **Step 5: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add app/(protected)/settings.tsx __tests__/integration/ui/SettingsScreen.test.tsx
git commit -m "feat: wire account deletion in settings screen"
```

---

### Task 4: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --no-watchman --forceExit
```

Expected: all suites pass.

- [ ] **Step 2: Verify file list**

```bash
ls supabase/functions/delete-user/index.ts
```

Expected: file exists.

- [ ] **Step 3: Manual smoke-test instructions (informational — no commit)**

To verify end-to-end:
1. Deploy the Edge Function: `npx supabase functions deploy delete-user` (requires Supabase CLI and project linked via `supabase link`)
2. Run the app on simulator, sign in
3. Go to Settings → Account → Delete account
4. Tap Delete account, read the warning, tap Confirm delete
5. App should redirect to the welcome screen
6. In the Supabase dashboard: Auth → Users — the user should be gone
7. All 8 tables should have zero rows for that user_id

- [ ] **Step 4: Commit (only if formatter changed anything)**

```bash
npm run format
git add -A
git commit -m "chore: format"
```

Only commit if `npm run format` modified files.
