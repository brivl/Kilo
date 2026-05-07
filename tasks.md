# Kilo — Task List

## Completed ✅

- [x] #10: Task 2 — Tab skeleton + template cleanup
- [x] #11: Task 3 — WatermelonDB schema, migrations, models, DB singleton
- [x] #12: Task 4 — Settings store
- [x] #13: Task 5 — Utility functions
- [x] #14: Toast + ErrorBoundary components
- [x] #15: Open Food Facts client (world endpoint)
- [x] #16: Food data layer (foodStore + queries)
- [x] #17: Meal template data layer
- [x] #18: MacroRing component (protein/carbs/fat stats)
- [x] #19: DateHeader component (date picker modal)
- [x] #20: FoodEntry row + MealTemplatePill components
- [x] #21: Food log screen (Phase 1)
- [x] #22: Manual food entry screen
- [x] #23: Food search screen + meal templates
- [x] #24: Phase 2 — Gym journal (sessions + sets screens)
- [x] #25: Phase 3 — Training plans (schema, store, plan screens)
- [x] #26: Phase 4 — Progress screen + body weight chart (Victory Native)

## Pending ⏳

### Phase 5 — Auth (next priority)

- [ ] #32: User registration + login flow (Supabase Auth)
- [ ] Auth state in Zustand store + secure token storage (expo-secure-store)
- [ ] Auth stack routing (welcome, sign-up, sign-in screens)
- [ ] Gate all tabs behind auth check

### Phase 6 — Onboarding Wizard

- [ ] #33: Goal selection screen (lose weight / gain muscle / maintain / recomp)
- [ ] Stats entry (weight, height, age, sex)
- [ ] Activity level multiplier
- [ ] Auto-calculate calorie + macro targets (Mifflin-St Jeor TDEE)
- [ ] Onboarding completion flag (AsyncStorage)

### Phase 7 — Cloud Sync

- [ ] Mirror WatermelonDB tables in Supabase Postgres
- [ ] Implement WatermelonDB sync protocol (pull + push)
- [ ] Row-level security for user data
- [ ] Conflict resolution (last-write-wins)

### Phase 8 — AI Analyser (Post-Launch, Paid)

- [ ] #34: AI analyser — macro gap + meal recommendations
- [ ] RevenueCat subscription setup
- [ ] Supabase Edge Function calling Claude API
- [ ] Free users see blurred preview + "Upgrade" CTA
- [ ] Pro entitlement gating

### Infrastructure & Launch

- [ ] #36: CI/CD pipeline — GitHub Actions with unit/integration/e2e tests + EAS builds
  - [x] Lint (format, eslint, typecheck) on PR/push
  - [x] Unit + integration tests on PR/push
  - [x] Preview build on main branch
  - [x] Production build on version tags
  - [ ] Add E2E tests (Maestro) to pipeline
  - [ ] Set up GitHub Secrets (EXPO_TOKEN, etc.)
  - [ ] Create eas.json with build profiles
  - [ ] Tag workflow: `git tag v1.0.0 && git push --tags`
- [ ] #27: Pre-launch observability — Sentry + PostHog
- [ ] #28: Monetization — RevenueCat subscription
- [x] #29: Light/dark theming system (central colors.ts)
- [ ] #30: Improve food search (min 2 chars, cache, ranking)
- [ ] #31: Integration tests for plan screens (plan/new, plan/[id])

## Legend

- **✅ Completed** — Shipped and tested
- **⏳ Pending** — Not yet started
- **Phase X** — Grouped by build phase for sequential delivery
