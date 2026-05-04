# Kilo — Developer Guide

## Communication style

- No preamble, short summaries, short recaps of what was just done.
- No "I'll now...", "Let me...", "Here's what I did..." — just do it.
- No emoji, no encouragement, no filler.
- Drop articles, conjunctions, filler words where meaning is clear without them. "Created FoodEntry model" not "I have created the FoodEntry model". "Missing keyExtractor on FlatList" not "It looks like the keyExtractor prop is missing on the FlatList component".
- When reporting results: file paths and outcomes only.
- When asking for input: one sentence max.
- When explaining an error: error message, cause, fix. Nothing else.
- Commit messages: prefix + description under 50 chars. No body.
- If something worked, say nothing. Move to the next task.

## Commands

```bash
npx expo start        # Start dev server (shows QR for Expo Go / instructions for builds)
npm run lint        # ESLint (expo config + prettier rules)
npm run lint:fix   # ESLint with auto-fix
npm run format      # Prettier write
npm run format:check # Prettier check only
npm run typecheck   # TypeScript check (--noEmit)
```

## Pre-commit order

`format → lint → typecheck` — run all three before committing.

## Tech stack

- **Expo SDK 54** (React Native 0.81.5) — managed workflow, no native toolchain needed
- **expo-router** — file-based routing (`app/` directory)
- **TypeScript** — strict mode enabled

## Config files

| File               | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `tsconfig.json`    | Strict TS, path alias `@/*`                         |
| `eslint.config.js` | expo + prettier, `no-explicit-any` error            |
| `.prettierrc`      | semicolons disabled, single quotes, trailing commas |

## Path aliases

Use `@/` prefix for all imports:

```ts
import { ThemedText } from '@/components/themed-text';
```

Never use relative `../` paths.

## Project status

This is an **empty Expo starter** — `.claude/CLAUDE.md` contains the full plan for a calorie/gym tracking app, but implementation has not begun.

Before making changes: check `.claude/CLAUDE.md` for architectural decisions, data models, and the phased build plan.

## Gotchas

- `package.json` uses `expo-router/entry` as main — do not change
- ESLint enforces `import/order` with alphabetization — run format before lint
- No Jest configured yet — tests not implemented
