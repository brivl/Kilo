# E2E Tests (Maestro)

Requires a development build installed on the simulator — not Expo Go.
WatermelonDB uses native modules and will not run in Expo Go.

## Setup

```bash
brew install maestro
```

## Build the development client (once)

```bash
eas build --profile development --platform ios
```

Install the resulting `.app` on the simulator.

## Run

```bash
maestro test e2e/log-meal.yaml
```

## Flows

| File            | Journey                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| `log-meal.yaml` | Open app → Breakfast section → manual entry form → save → verify entry visible |
