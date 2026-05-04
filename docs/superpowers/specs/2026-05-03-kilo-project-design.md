# Kilo — Full Project Design

**Date:** 2026-05-03
**Scope:** Full v1 design including additions and changes from brainstorming session

---

## Overview

A personal mobile app for calorie/macro tracking, gym journaling, training plan building, and body progress tracking. Local-first, cloud sync later. iOS first.

This document extends the baseline spec in `CLAUDE.md` with everything agreed during the brainstorm session. Where this doc and `CLAUDE.md` conflict, this doc takes precedence.

---

## Phase structure

| Phase              | Core                                                                   | Additions from brainstorm                                    |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 — Food log       | Daily log, macro ring, food search, manual entry, recent foods, re-log | Saved meal templates, UK-first food search                   |
| 2 — Gym journal    | Log sessions, sets per exercise, session history                       | Exercise library (wger API), rest timer                      |
| 3 — Training plans | Plan templates, assign exercises to days, launch session               | Live workout mode with set-by-set guidance and "How to" demo |
| 4 — Progress       | Body weight chart, macro history, volume per exercise                  | Custom body measurements system                              |

---

## Phase 1 additions — Saved meal templates + UK food search

### Saved meal templates

A meal template is a named collection of food items the user logs together with one tap.

**UX:**

- Template pills appear directly on each meal section header on the food log (e.g. below "Breakfast" header before any entries).
- Tapping a pill logs all items from the template to that meal section instantly. A toast confirms ("Logged Morning bulk — 720 kcal").
- Templates are created two ways:
  1. From the food search screen: after adding items, a "Save as meal" button lets the user name and save the current selection.
  2. From a "Manage meal templates" screen accessible via settings — lists all templates, allows rename and delete.
- Template items inherit the quantity/unit at the time of saving. The user can edit quantities on the log screen after logging, same as any entry.

**Data model — new tables:**

`meal_templates`

```
id            string   PK (WatermelonDB-generated)
name          string   e.g. "Morning bulk"
created_at    number   timestamp
```

`meal_template_items`

```
id                  string   PK
meal_template_id    string   FK → meal_templates
food_name           string
calories            number
protein_g           number
carbs_g             number
fat_g               number
quantity            number
unit                string   g | ml | oz | serving
created_at          number   timestamp
```

### UK-first food search

- Use `https://uk.openfoodfacts.org` as the primary base URL (instead of `world.openfoodfacts.org`).
- Update `app.config.ts` extra: `openFoodFactsBaseUrl: "https://uk.openfoodfacts.org"`.
- No other change to the OFF client — same search endpoint, same Zod schema.

---

## Phase 2 additions — Exercise library + rest timer

### Exercise library (wger API)

The exercise library provides images, muscle group data, and cue text for exercises. It is not stored in WatermelonDB — it is fetched on demand and cached in AsyncStorage.

**API:** `https://wger.de/api/v2/` — free, no API key required.

**Service:** `services/wger.ts` exports:

- `searchExercises(query: string, signal?: AbortSignal): Promise<WgerExercise[]>` — used when creating plan exercises and when logging sessions to look up an exercise by name.
- `getExerciseDetail(id: number): Promise<WgerExerciseDetail>` — returns name, description/cues, images, primary/secondary muscle names.

**Caching:** Results cached in AsyncStorage keyed by exercise ID with a 7-day TTL. Cache miss fetches from wger; stale or missing entries fall back gracefully (no image shown, no error thrown).

**Data model change:** Exercise names remain plain strings on `workout_sets` (no FK to wger). The wger ID is stored in `training_plan_exercises` (Phase 3) so the "How to" button can load the correct demo. For free-form journal sessions, the user can search wger to associate an exercise — but it is optional.

**Schema addition to existing tables:**

- `workout_sets` gets `rest_seconds integer nullable` — the rest time that was active when this set was logged (for history reference).

### Rest timer

A countdown timer that appears automatically after the user logs a set as complete.

**Behaviour:**

- Default rest time: 90 seconds.
- Rest time is configurable per exercise in training plan templates (`default_rest_seconds` on `training_plan_exercises`).
- During a free-form session or if no plan default is set, rest time defaults to the last used value for that exercise (stored in AsyncStorage), falling back to 90s.
- The timer appears as a bottom sheet overlay after each set checkmark tap.
- Controls: −30s, +30s, Skip rest.
- On completion: vibrate (via `expo-haptics`) + a short system sound (via `expo-av`).
- The timer bottom sheet is dismissible — user can scroll back to logging without waiting. Timer continues in background and completes silently if dismissed.

**New dependencies:** `expo-haptics`, `expo-av`.

---

## Phase 3 additions — Live workout mode

### Live session flow

**Starting a session:**

- From the Plans tab: tap "▶ Start" on any plan template → creates a `workout_session` record linked to the plan and enters live mode.
- From the Journal tab: tap "+ Start empty session" → creates a session with no plan link, user adds exercises on the go.

**Live session screen:**

- Persistent header: session timer (elapsed, not countdown), Pause button, End button.
- Current exercise shown prominently with set list below.
- Each set row: weight input, reps input, optional RPE (1–10), checkmark button to complete the set. Completing a set triggers the rest timer.
- "How to" button on the exercise header opens a bottom sheet with the wger image + primary/secondary muscles + cue text.
- "+ Add set" appended below existing sets at all times.
- Exercise navigation: swipe or tap arrows to move between exercises in the plan. Can also add a new exercise on the fly (searches wger + adds to current session only, not to the plan template).
- Modify on the go: user can edit weight/reps on any set before or after completing it.

**Pausing:** Timer pauses, UI shows "Paused — tap to resume". Sets can still be logged while paused (e.g. user got interrupted but wants to finish logging).

**Ending a session:** Tap End → confirmation modal → session saved with actual duration (elapsed time minus paused time). Returns to Plans tab.

**State management:** Live session state (current exercise index, elapsed seconds, timer state) lives in a `activeSessionStore` Zustand store (not persisted — if app is killed mid-session, the session record exists but is marked incomplete). On app relaunch, if an incomplete session exists from today, offer to resume or discard.

**Schema addition:**
`training_plan_exercises` (new table, Phase 3):

```
id                      string   PK
plan_id                 string   FK → training_plans
exercise_name           string
wger_exercise_id        integer  nullable
day_of_week             integer  nullable  0=Mon … 6=Sun
order_index             integer
default_sets            integer  nullable
default_reps            integer  nullable
default_weight_kg       number   nullable
default_rest_seconds    integer  nullable  defaults to 90
created_at              number   timestamp
```

---

## Phase 4 additions — Custom body measurements

### Measurement types

Presets (seeded on first launch, `is_preset = true`, cannot be deleted):

- Body weight (kg)
- Height (cm)
- Waist (cm)
- Chest (cm)
- Bicep (cm)
- Hip (cm)

User can create custom types with any name and unit from: cm, mm, in, kg, lbs, %.

### Logging

- "Log measurement" button on the Progress tab opens a form showing all measurement types (presets first, custom below).
- Only fill in what was measured that day — blank fields are skipped and no record is created for them.
- Multiple measurements for the same type+date are allowed (e.g. morning and evening weight) — the chart shows the average for that day.

### Progress tab chart

- Pill selector at top: one pill per measurement type the user has ever logged. Tap to switch active chart.
- Chart shows last 90 days by default, scrollable back.
- Summary stats below chart: today's value, change vs 30 days ago, starting value.

**New tables:**

`measurement_types`

```
id            string   PK
name          string
unit          string   cm | mm | in | kg | lbs | %
is_preset     boolean
created_at    number   timestamp
```

`measurement_entries`

```
id                    string   PK
measurement_type_id   string   FK → measurement_types
value                 number
date                  string   YYYY-MM-DD
notes                 string   nullable
created_at            number   timestamp
```

---

## Updated data model summary

All tables from `CLAUDE.md` remain. Additions:

| Table                 | Phase | Purpose                                               |
| --------------------- | ----- | ----------------------------------------------------- |
| `meal_templates`      | 1     | Named meal presets                                    |
| `meal_template_items` | 1     | Individual food items within a template               |
| `measurement_types`   | 4     | User-defined measurement categories (preset + custom) |
| `measurement_entries` | 4     | Individual measurement log entries                    |

Modified existing tables:
| Table | Field added | Phase |
|-------|------------|-------|
| `workout_sets` | `rest_seconds integer nullable` | 2 |
| `workout_sessions` | `completed_at number nullable` (timestamp; null = session ended abnormally or still active) | 3 |

New tables added in Phase 3:
| Table | Purpose |
|-------|---------|
| `training_plans` | Plan templates (name, notes) |
| `training_plan_exercises` | Exercises assigned to a plan, including wger ID and rest defaults |

`training_plan_exercises` full schema is defined in the Phase 3 section above — `wger_exercise_id` and `default_rest_seconds` are part of its initial definition, not additions to an existing table.

---

## New external dependencies

| Dependency             | Purpose                                  | Notes                                                                     |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `uk.openfoodfacts.org` | UK-first food database                   | Same API shape as world.openfoodfacts.org, no code change beyond base URL |
| `wger.de/api/v2`       | Exercise library (images, muscles, cues) | Free, no API key, fetched on demand, AsyncStorage cache                   |
| `expo-haptics`         | Rest timer completion vibration          | Install via `npx expo install expo-haptics`                               |
| `expo-av`              | Rest timer completion sound              | Install via `npx expo install expo-av`                                    |

---

## New Zod schemas needed

- `services/schemas/wger.ts` — validates wger exercise search and detail responses. Invalid responses return empty/null, never crash.

---

## New stores

- `store/activeSessionStore.ts` — live workout session state (current exercise index, elapsed seconds, timer running/paused). Not persisted to AsyncStorage (intentionally volatile).
- `store/mealTemplateStore.ts` — actions for creating, deleting, and logging meal templates. Reads via WatermelonDB observables.

---

## Out of scope for v1 (unchanged)

- Cloud sync
- Barcode scanner
- AI food parsing
- Social / sharing
- Push notifications
- Custom macro goals per day (single goal applies to all days)
- Voice cues during workout
- Inline "vs last session" progress during live workout (add in v2)

---

## Definition of done (unchanged from CLAUDE.md)

1. `npx tsc --noEmit` reports zero errors
2. Unit tests written and passing
3. Integration test written and passing for any new screen
4. Feature runs correctly on iOS simulator
5. Changes committed to the feature branch
