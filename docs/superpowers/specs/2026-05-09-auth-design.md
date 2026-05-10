# Phase 5 — Auth Design

**Date:** 2026-05-09
**Scope:** User authentication via email/password + Apple + Google. Route protection with local dev bypass.

---

## Folder structure changes

Current `app/` has `(tabs)/`, `session/`, `plan/`, `food/` at the root level. All authenticated routes move into a `(protected)` route group. `(protected)` is transparent in URLs — no navigation call strings change.

```
app/
  _layout.tsx                    ← shell only: ThemeProvider, Toast, top-level Stack
  (auth)/
    welcome.tsx                  ← landing: social + email entry points
    sign-up.tsx                  ← email/password/confirm + social buttons
    sign-in.tsx                  ← email/password + forgot password + social buttons
  (protected)/
    _layout.tsx                  ← auth gate: redirect or <Slot />
    (tabs)/
      _layout.tsx
      index.tsx
      journal.tsx
      plans.tsx
      progress.tsx
    food/
      search.tsx
      add.tsx
    session/
      new.tsx
      [id].tsx
    plan/
      new.tsx
      [id].tsx
```

Root `_layout.tsx` Stack has two screens: `(auth)` (headerShown false) and `(protected)` (headerShown false). All Stack.Screen options for session/plan/food move into `(protected)/_layout.tsx`.

---

## Data layer

### `lib/supabase.ts`

Creates a single Supabase client. URL and anon key read from `Constants.expoConfig.extra` (set in `app.config.ts`). Storage adapter is `expo-secure-store` — tokens are persisted in the iOS Keychain and refreshed automatically by the client.

```ts
// shape only
const supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### `store/authStore.ts`

Zustand store, **not** persisted (Supabase client owns persistence). The store is a thin adapter between Supabase auth events and React state.

```ts
interface AuthState {
  session: Session | null;
  isLoading: boolean;
  initialize: () => void; // call once on app start
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}
```

`initialize()` calls `supabase.auth.getSession()` then subscribes to `onAuthStateChange` to keep `session` current for the lifetime of the app. Called once from root `_layout.tsx` via `useEffect`.

All actions wrap Supabase calls in try/catch. Errors surface via `showToast`. Network errors show "Couldn't reach server. Check your connection." — no raw Supabase messages exposed to the user.

---

## Social auth

### Apple — `expo-apple-authentication`

```ts
const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [FULL_NAME, EMAIL],
});
await supabase.auth.signInWithIdToken({
  provider: 'apple',
  token: credential.identityToken,
});
```

- Apple Sign In button must use the official `AppleAuthentication.AppleAuthenticationButton` component (App Store requirement).
- Only available on iOS. Button is hidden on Android/web.

### Google — `@react-native-google-signin/google-signin`

```ts
await GoogleSignin.hasPlayServices();
const { idToken } = await GoogleSignin.signIn();
await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
```

- Configured with iOS client ID from `app.config.ts` extra.
- Config plugin added to `app.config.ts` plugins array.

Both providers: on first sign-in Supabase creates the user automatically. Subsequent sign-ins reuse the existing account.

---

## Auth screens

### `(auth)/welcome.tsx`

Social-first layout:

1. App name / logo area
2. Apple Sign In button (native component, iOS only)
3. Google Sign In button
4. Divider "or"
5. "Create account" → `/(auth)/sign-up`
6. "Sign in with email" → `/(auth)/sign-in`

### `(auth)/sign-up.tsx`

- Social buttons at top (same as welcome)
- Divider "or"
- Email input
- Password input
- Confirm password input
- Client-side validation: passwords match, email non-empty
- "Create account" button → `authStore.signUp` → on success `router.replace('/(protected)/(tabs)')`
- Errors via Toast

### `(auth)/sign-in.tsx`

- Social buttons at top
- Divider "or"
- Email input
- Password input
- "Sign in" button → `authStore.signIn` → on success `router.replace('/(protected)/(tabs)')`
- "Forgot password?" text button below form → `authStore.sendPasswordReset(email)` → Toast "Reset link sent to your email"
- Errors via Toast

---

## Route protection

### `(protected)/_layout.tsx`

```ts
const session = useAuthStore(s => s.session)
const isLoading = useAuthStore(s => s.isLoading)
const skipAuth = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true' // dev-only, Metro-inlined, never in EAS builds

if (isLoading) return null           // hold until session check resolves
if (!session && !skipAuth) return <Redirect href="/(auth)/welcome" />
return <Slot />
```

### Dev bypass

`.env.local` (git-ignored, never committed):

```
EXPO_PUBLIC_SKIP_AUTH=true
```

`EXPO_PUBLIC_SKIP_AUTH` is safe as a public var — it is not a secret. It is a build-time flag that only affects navigation logic. EAS build profiles (`preview`, `production`) do not load `.env.local`, so this flag never reaches any build that leaves the local machine.

`.env.local` added to `.gitignore`.

---

## app.config.ts additions

The values below are **public by design** — not secrets. Supabase's anon key is a JWT with the `anon` role, intended to be embedded in client apps and protected by Row Level Security. The Google iOS client ID is a public OAuth identifier; security comes from bundle ID verification, not secrecy.

```ts
extra: {
  openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
  supabaseUrl: 'https://yourproject.supabase.co',       // safe to commit
  supabaseAnonKey: 'your-anon-key',                     // safe to commit
  googleIosClientId: 'your-ios-client-id',              // safe to commit
},
plugins: [
  'expo-router',
  ['expo-build-properties', { ios: { deploymentTarget: '16.0' } }],
  '@react-native-google-signin/google-signin',
],
```

Values accessed in app code via `Constants.expoConfig.extra` — the existing pattern in this codebase.

**Never in the app:** Supabase service role key, any API key that costs money or grants write access to your database. Those stay server-side only.

---

## Error handling

| Scenario              | Behaviour                                              |
| --------------------- | ------------------------------------------------------ |
| Invalid credentials   | Toast: "Incorrect email or password"                   |
| Email already in use  | Toast: "An account with this email already exists"     |
| Passwords don't match | Inline error below confirm field, no Toast             |
| Network error         | Toast: "Couldn't reach server. Check your connection." |
| Apple auth cancelled  | Silent — user dismissed sheet intentionally            |
| Google auth cancelled | Silent                                                 |
| Password reset sent   | Toast: "Reset link sent to your email"                 |

---

## Packages to install

```bash
npx expo install @supabase/supabase-js expo-secure-store expo-apple-authentication
npm install @react-native-google-signin/google-signin
```

---

## Prerequisites (manual setup before running)

1. Create Supabase project → copy URL + anon key → add to `.env.local`
2. Supabase dashboard → Auth → Providers → enable Google + Apple
3. Apple Developer → enable "Sign In with Apple" capability for bundle ID
4. Google Cloud Console → create OAuth 2.0 iOS client ID → add to `.env.local`
5. `npx eas-cli init` to link EAS project (if not done)

---

## Testing

- **Unit:** `authStore` — mock `@/lib/supabase`, test each action updates state correctly and calls the right Supabase method
- **Integration:** `SignInScreen` — mock `@/lib/supabase`, render screen, fill email/password, press sign in, assert `router.replace` called with correct path
- **Integration:** `SignUpScreen` — same pattern, also test passwords-mismatch inline error
- **Integration:** `ProtectedLayout` — test redirect when no session, test renders children when session present, test renders children when `EXPO_PUBLIC_SKIP_AUTH=true`
- No E2E for auth in CI (requires live Supabase project); covered by manual testing on simulator
