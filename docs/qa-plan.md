# Manual QA Plan

## Journey 1 — New user signup + onboarding

- [ ] Fresh launch → lands on welcome screen (not tabs)
- [ ] Tap **Sign up** → enter password under 8 chars → blocked with error
- [ ] Enter valid email + password (8+ chars) → submit
- [ ] Step 1: pick a goal → Next
- [ ] Step 2: enter weight, height, age, sex → Next
- [ ] Step 3: pick activity level → Next
- [ ] Step 4: targets auto-populate from stats — verify numbers look reasonable, edit one field → Save
- [ ] Lands on Food Log tab

---

## Journey 2 — Food logging

- [ ] Search for a UK food ("Warburtons", "Cadbury", "Heinz") — results look real and have macros
- [ ] Tap a result → name/macros prefill → change quantity → Log
- [ ] Macro ring updates (protein/carbs/fat arcs move)
- [ ] Log a second food to a different meal section
- [ ] Tap **+ Manual** → enter name, calories, macros → Log
- [ ] Re-log from Recent foods list
- [ ] Delete one entry (✕) → macro ring updates
- [ ] Navigate to yesterday via date header → empty log
- [ ] Navigate back to today → entries still there

---

## Journey 3 — Gym journal

- [ ] Go to Journal tab → tap **New session**
- [ ] Name the session, add a note, set duration → Save
- [ ] Add 3 sets for "Bench press" (different weights/reps each)
- [ ] Tap exercise chip to quickly re-add "Bench press" as new set
- [ ] Add a second exercise "Squat" with 2 sets
- [ ] Navigate back → session appears in history for today
- [ ] Navigate to a different date → session not visible
- [ ] Navigate back → session reappears
- [ ] Delete one set → removed

---

## Journey 4 — Training plans

- [ ] Go to Plans tab → tap **New plan** → name it → Save
- [ ] Open plan → add exercise to Monday: "Deadlift", 4 sets × 5 reps @ 100 kg
- [ ] Add another exercise to Wednesday
- [ ] Tap **▶ Start** on Monday → launches session pre-loaded with Deadlift
- [ ] Session shows 4 sets scaffolded for Deadlift
- [ ] Log some sets → go back
- [ ] Return to plan → Monday still shows the exercise

---

## Journey 5 — Progress / body weight

- [ ] Go to Progress tab → log today's weight (e.g. 80.5 kg)
- [ ] Log a second entry → chart appears (needs 2+ points)
- [ ] Chart renders — line connects the two points
- [ ] Toggle weight unit to **lbs** in Settings → return to Progress → values convert
- [ ] Delete one entry → chart updates

---

## Journey 6 — Settings

- [ ] Open settings (avatar top-right)
- [ ] Toggle weight unit kg ↔ lbs → Progress tab and weight displays update
- [ ] Toggle **Sync** off → toast/confirmation appears
- [ ] Toggle Sync back on
- [ ] Tap **Restore from cloud** → toast shown (success or "nothing to restore")
- [ ] Tap **Delete account** → confirmation box appears
- [ ] Tap **Cancel** → box dismisses, nothing happens

---

## Journey 7 — Auth edge cases

- [ ] Sign out → lands on welcome screen, tabs not accessible
- [ ] Sign in with wrong password → error shown, no crash
- [ ] Tap **Forgot password** with empty email → blocked (error, not crash)
- [ ] Enter email → Forgot password → email arrives
- [ ] Sign back in → data still present

---

## Journey 8 — Cloud sync

- [ ] Signed in with sync on → log a food entry
- [ ] Sign out → sign back in → entry restored from cloud
- [ ] Navigate dates, check journal and progress data persists through sign-out/in

---

## Journey 9 — Empty states & edge cases

- [ ] Fresh date with no food → empty state message visible
- [ ] Food search with 1 character → waits or returns gracefully
- [ ] Search for nonsense ("xyzqwerty") → empty state, no crash
- [ ] Kill app mid-log → reopen → data not corrupted

---

## High-risk areas

- Date navigation (Journey 2, steps 8–9)
- Plan → session launch (Journey 4)
- Weight unit toggle affecting all display surfaces (Journey 5–6)
- Sign-out/sign-in data restore (Journey 8)
