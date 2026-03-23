# Task 1.0 Proofs — Extend PlatformPreset Data Model

## CLI Output

### `task test`

```
 RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

 Test Files  6 passed (6)
      Tests  19 passed (19)
   Start at  10:54:38
   Duration  598ms
```

### `task typecheck`

```
(exits 0, no output)
```

### `task lint`

```
(exits 0, no output)
```

## Test Results

All 19 unit tests pass, including the new tests in `presets.test.ts`:

- `slack preset has correct dimensions, safe zone, and maxFileSizeKb` — asserts `maxFileSizeKb: 128`
- `discord preset has correct dimensions, safe zone, and maxFileSizeKb` — asserts `width: 128`, `height: 128`, `safeZonePadding: 10`, `maxFileSizeKb: 256`
- `apple preset has correct dimensions, safe zone, and maxFileSizeKb` — asserts `width: 512`, `height: 512`, `safeZonePadding: 40`, `maxFileSizeKb: 500`
- `every entry has all required fields defined` — now includes `maxFileSizeKb` in `requiredFields`

## Verification

- `PlatformPreset` interface extended with `maxFileSizeKb: number` (required field)
- `slack` preset: `maxFileSizeKb: 128` ✓
- `discord` preset added: `id: "discord"`, `label: "Discord — 128×128"`, `width: 128`, `height: 128`, `safeZonePadding: 10`, `maxFileSizeKb: 256` ✓
- `apple` preset added: `id: "apple"`, `label: "Apple — 512×512"`, `width: 512`, `height: 512`, `safeZonePadding: 40`, `maxFileSizeKb: 500` ✓
- TypeScript compilation exits 0 ✓
- ESLint exits 0 with max-warnings=0 ✓
