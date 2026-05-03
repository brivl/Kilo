# Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install all Phase 1 runtime and dev dependencies and wire up `app.config.ts`, `babel.config.js`, `jest.config.js`, and `jest.setup.ts` so that `npx tsc --noEmit` is clean and `npm test` exits with "no tests found."

**Architecture:** Pure setup task — no app code changes and no tests to write. Four config files are created from scratch; `package.json` gains two test scripts. The existing Expo 54 scaffolding stays intact; template cleanup is Task 2.

**Tech Stack:** Expo SDK 54.0.33, expo-router 6.x, WatermelonDB 0.27+, Zustand, Zod, Victory Native, react-native-svg, AsyncStorage, datetimepicker, Jest 29, jest-expo ~54, RNTL, Babel decorators plugin.

---

## File Map

| Action | Path              | Responsibility                                                                                |
| ------ | ----------------- | --------------------------------------------------------------------------------------------- |
| Create | `app.config.ts`   | Single Expo config with bundle ID, `extra.openFoodFactsBaseUrl`, and plugins                  |
| Create | `babel.config.js` | Decorators plugin (legacy: true) required by WatermelonDB + reanimated plugin last            |
| Create | `jest.config.js`  | jest-expo preset, moduleNameMapper for `@/*`, transformIgnorePatterns for all native packages |
| Create | `jest.setup.ts`   | Module mocks for reanimated, expo-constants, async-storage                                    |
| Modify | `package.json`    | Add `test` and `test:ci` scripts                                                              |

---

### Task 1: Create the feature branch

**Files:** none

- [ ] **Step 1: Verify you are on `main` and working tree is clean**

```bash
git status
git branch
```

Expected: `On branch main`, no modified files.

- [ ] **Step 2: Create and switch to the feature branch**

```bash
git checkout -b phase1/project-foundation
```

Expected: `Switched to a new branch 'phase1/project-foundation'`

---

### Task 2: Install runtime dependencies with `npx expo install`

Using `npx expo install` ensures each package gets a version that Expo 54 has vetted for compatibility. Do not use plain `npm install` for these packages.

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Run the install**

```bash
npx expo install \
  @nozbe/watermelondb \
  zustand \
  zod \
  victory-native \
  react-native-svg \
  @react-native-async-storage/async-storage \
  @react-native-community/datetimepicker \
  expo-build-properties
```

Expected: Command exits 0. `package.json` `dependencies` block gains all eight packages.

- [ ] **Step 2: Spot-check package.json**

Confirm all eight appear under `dependencies`:

```bash
node -e "const p=require('./package.json'); const keys=['@nozbe/watermelondb','zustand','zod','victory-native','react-native-svg','@react-native-async-storage/async-storage','@react-native-community/datetimepicker','expo-build-properties']; keys.forEach(k => console.log(k, k in p.dependencies ? '✓' : '✗ MISSING'));"
```

Expected: all eight print `✓`.

---

### Task 3: Install dev dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Run the install**

```bash
npm install --save-dev \
  jest \
  jest-expo \
  @testing-library/react-native \
  @types/jest \
  @babel/plugin-proposal-decorators
```

Expected: Command exits 0.

- [ ] **Step 2: Spot-check package.json**

```bash
node -e "const p=require('./package.json'); const keys=['jest','jest-expo','@testing-library/react-native','@types/jest','@babel/plugin-proposal-decorators']; keys.forEach(k => console.log(k, k in p.devDependencies ? '✓' : '✗ MISSING'));"
```

Expected: all five print `✓`.

---

### Task 4: Create `app.config.ts`

Replaces the deleted `app.json` as the single Expo config file. Keeps all existing expo-router wiring and adds the `extra.openFoodFactsBaseUrl` field required by the OFF client (Task 7) and `expo-build-properties` for iOS deployment target.

**Files:**

- Create: `app.config.ts`

- [ ] **Step 1: Create the file**

```ts
// app.config.ts
// Pinned SDK: expo@54.0.33 — do not upgrade mid-project
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GymTracker',
  slug: 'gymtracker',
  version: '1.0.0',
  scheme: 'gymtracker',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourname.gymtracker',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.yourname.gymtracker',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },
  plugins: ['expo-router', ['expo-build-properties', { ios: { deploymentTarget: '16.0' } }]],
  extra: {
    openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
  },
});
```

- [ ] **Step 2: Confirm TypeScript accepts the file**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see "cannot find module 'expo/config'", run `npx expo install expo` to ensure the expo package itself is up to date.

---

### Task 5: Create `babel.config.js`

WatermelonDB model classes use TypeScript/Babel decorators (`@field`, `@date`, etc.). The `legacy: true` flag for `@babel/plugin-proposal-decorators` is required — WatermelonDB does not support the current Stage 3 decorator proposal. The `react-native-reanimated/plugin` must be **last** in the plugins array; reanimated will throw a build error if another plugin appears after it.

**Files:**

- Create: `babel.config.js`

- [ ] **Step 1: Create the file**

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};
```

- [ ] **Step 2: Verify Babel can parse a decorator**

Create a temporary file and delete it after:

```bash
echo "import { Model } from '@nozbe/watermelondb'; import { field } from '@nozbe/watermelondb/decorators'; class Foo extends Model { static table = 'foo'; @field('name') name!: string; }" > /tmp/test-decorator.ts && npx babel /tmp/test-decorator.ts --presets babel-preset-expo --plugins @babel/plugin-proposal-decorators 2>&1 | head -5 && rm /tmp/test-decorator.ts
```

Expected: Babel outputs transformed JS with no "Decorators are not enabled" error.

---

### Task 6: Create `jest.config.js`

The `transformIgnorePatterns` entry is the most critical part of this file. By default, Jest skips transforming `node_modules`. Native Expo/RN packages and WatermelonDB ship as ESM or use flow types — they must be in the allow-list or tests will fail with syntax errors when those modules are imported.

**Files:**

- Create: `jest.config.js`

- [ ] **Step 1: Create the file**

```js
// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['./jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@nozbe/watermelondb' +
      '|victory-native' +
      '|react-native-svg' +
      '|react-native-reanimated' +
      '|react-native-worklets' +
      '))',
  ],
};
```

- [ ] **Step 2: Confirm jest resolves the config**

```bash
npx jest --no-watchman --showConfig 2>/dev/null | grep '"preset"'
```

Expected: output contains `"jest-expo"`.

---

### Task 7: Create `jest.setup.ts`

Provides module-level mocks for the three packages that either use native modules (AsyncStorage, reanimated) or read runtime config (expo-constants) that wouldn't be available in a Node.js test environment. The expo-constants mock must mirror `app.config.ts`'s `extra` shape exactly — if the shapes diverge, tests that import the OFF base URL will silently get `undefined`.

**Files:**

- Create: `jest.setup.ts`

- [ ] **Step 1: Create the file**

```ts
// jest.setup.ts

// react-native-reanimated v4 mock — prevents "Cannot use import statement" during test
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// async-storage mock — uses the official mock provided by the package
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-constants mock — mirrors app.config.ts extra shape
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
      },
    },
  },
}));
```

> **Note on reanimated v4:** If `npm test` reports `Cannot find module 'react-native-reanimated/mock'`, replace that mock line with:
>
> ```ts
> jest.mock('react-native-reanimated');
> ```
>
> This uses Jest's auto-mock. The auto-mock is sufficient for Task 1–6 where no animated components are rendered in tests.

---

### Task 8: Add `test` and `test:ci` scripts to `package.json`

The `--no-watchman` flag is required in the Claude Code sandbox (watchman is not installed). CI adds `--ci` which disables interactive prompts and fails on missing snapshots.

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Open `package.json` and add two scripts to the `"scripts"` block**

Add these two entries alongside the existing scripts (do not remove anything already there):

```json
"test": "jest --no-watchman",
"test:ci": "jest --no-watchman --ci"
```

After the edit, the scripts block should look like:

```json
"scripts": {
  "start": "expo start",
  "reset-project": "node ./scripts/reset-project.js",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "eslint . --ext .ts,.tsx",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "jest --no-watchman",
  "test:ci": "jest --no-watchman --ci"
}
```

---

### Task 9: Verify TypeScript is clean

**Files:** none (read-only verification)

- [ ] **Step 1: Run TypeScript in no-emit mode**

```bash
npx tsc --noEmit
```

Expected: exits 0 with no output. If you see errors:

| Error                                                | Fix                                                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Cannot find module 'expo/config'`                   | `npx expo install expo`                                                                 |
| `Property 'XXX' does not exist on type 'ExpoConfig'` | Check the field name against Expo's TypeScript types in `node_modules/expo/config.d.ts` |
| Decorator errors                                     | Confirm `babel.config.js` has `{ legacy: true }`                                        |

---

### Task 10: Verify Jest runs and reports "no tests"

**Files:** none (read-only verification)

- [ ] **Step 1: Run Jest**

```bash
npm test
```

Expected output (exact wording may vary):

```
No tests found, exiting with code 1
```

or

```
Test Suites: 0 passed, 0 total
Tests:       0 total
```

Either is acceptable — "no tests" without a crash is the success condition.

- [ ] **Step 2: Triage if Jest errors on startup (not "no tests")**

Common failures and fixes:

| Error                                                                                    | Cause                                                  | Fix                                                                                                           |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `Cannot find module 'react-native-reanimated/mock'`                                      | v4 removed this file                                   | Replace with `jest.mock('react-native-reanimated')` in `jest.setup.ts`                                        |
| `Cannot find module '@react-native-async-storage/async-storage/jest/async-storage-mock'` | Old path                                               | Replace require path with `require('@react-native-async-storage/async-storage').default` and wrap it manually |
| `SyntaxError: Unexpected token 'export'` in a node_modules package                       | That package is missing from `transformIgnorePatterns` | Add the package name to the allow-list in `jest.config.js`                                                    |
| `jest.setup.ts: jest is not defined`                                                     | `setupFilesAfterFramework` misspelled or wrong key     | Confirm the key is exactly `setupFilesAfterFramework` in `jest.config.js`                                     |

---

### Task 11: Commit

- [ ] **Step 1: Stage only the relevant files**

```bash
git add app.config.ts babel.config.js jest.config.js jest.setup.ts package.json package-lock.json
```

- [ ] **Step 2: Confirm what is staged**

```bash
git diff --cached --stat
```

Expected: the five files above appear; no other files.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: install Phase 1 deps and configure babel/jest

- npx expo install: watermelondb, zustand, zod, victory-native, react-native-svg,
  async-storage, datetimepicker, expo-build-properties
- npm install --save-dev: jest, jest-expo, rntl, @types/jest, babel decorators plugin
- app.config.ts replaces deleted app.json; adds extra.openFoodFactsBaseUrl
- babel.config.js: decorators legacy:true (required by WatermelonDB) + reanimated plugin last
- jest.config.js: jest-expo preset, @/* mapper, transformIgnorePatterns for all native deps
- jest.setup.ts: mocks for reanimated, expo-constants, async-storage
- package.json: test and test:ci scripts added

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds. Run `git log --oneline -3` to confirm.

---

## Self-Review

### Spec coverage check

| Requirement (from tasks.md Task 1)                               | Covered in plan? |
| ---------------------------------------------------------------- | ---------------- |
| `@nozbe/watermelondb` installed                                  | Task 2 ✓         |
| `zustand` installed                                              | Task 2 ✓         |
| `zod` installed                                                  | Task 2 ✓         |
| `victory-native` installed                                       | Task 2 ✓         |
| `react-native-svg` installed                                     | Task 2 ✓         |
| `@react-native-async-storage/async-storage` installed            | Task 2 ✓         |
| `@react-native-community/datetimepicker` installed               | Task 2 ✓         |
| `expo-build-properties` installed                                | Task 2 ✓         |
| `jest` dev dep                                                   | Task 3 ✓         |
| `jest-expo` dev dep                                              | Task 3 ✓         |
| `@testing-library/react-native` dev dep                          | Task 3 ✓         |
| `@types/jest` dev dep                                            | Task 3 ✓         |
| `@babel/plugin-proposal-decorators` dev dep                      | Task 3 ✓         |
| `app.config.ts` with `extra.openFoodFactsBaseUrl`                | Task 4 ✓         |
| `app.config.ts` with bundle identifier `com.yourname.gymtracker` | Task 4 ✓         |
| `app.config.ts` SDK version comment                              | Task 4 ✓         |
| `babel.config.js` with decorators legacy:true                    | Task 5 ✓         |
| `babel.config.js` with reanimated plugin last                    | Task 5 ✓         |
| `jest.config.js` with jest-expo preset                           | Task 6 ✓         |
| `jest.setup.ts` mocking reanimated                               | Task 7 ✓         |
| `jest.setup.ts` mocking expo-constants                           | Task 7 ✓         |
| `jest.setup.ts` mocking async-storage                            | Task 7 ✓         |
| `package.json` `"test": "jest --no-watchman"`                    | Task 8 ✓         |
| `package.json` `"test:ci": "jest --no-watchman --ci"`            | Task 8 ✓         |
| TS clean                                                         | Task 9 ✓         |
| `npm test` reports "no tests" cleanly                            | Task 10 ✓        |
| Committed to feature branch                                      | Task 11 ✓        |

All requirements covered. No gaps.
