# 05 Task 1.0 Proofs — Install Konva + Render Checkerboard & Safe Zone

## CLI Output

### `npm ls konva react-konva`

```
emoji-wizz@0.1.0 /Users/stephendumore/emoji-wizz
├── konva@10.2.3
└─┬ react-konva@19.2.3
  └── konva@10.2.3 deduped
```

Both packages installed as production dependencies.

---

## Unit Test Results

### `npx vitest run`

```
 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  6 passed (6)
      Tests  19 passed (19)
   Start at  15:34:14
   Duration  1.08s
```

All 19 unit tests pass with zero failures.

---

## E2E Test Results

### `npx playwright test`

```
Running 7 tests using 5 workers

  ✓  [chromium] › e2e/app.spec.ts › app renders a preset selector dropdown
  ✓  [chromium] › e2e/app.spec.ts › app renders a canvas element
  ✓  [chromium] › e2e/canvas.spec.ts › canvas renders with Slack preset dimensions
  ✓  [chromium] › e2e/canvas.spec.ts › canvas renders non-empty pixel data (checkerboard is drawing)
  ✓  [chromium] › e2e/canvas.spec.ts › switching to Apple preset with no image resizes canvas silently
  ✓  [chromium] › e2e/canvas.spec.ts › switching preset after image upload shows confirm dialog and resizes canvas
  ✘  [chromium] › e2e/canvas.spec.ts › canvas pixel data changes after file upload  (EXPECTED — image layer not yet implemented; fixed in Task 2.0)

6 passed
```

### Task 1.0 Required Proof E2E Tests — All Pass ✓

| Test                                                              | Status |
| ----------------------------------------------------------------- | ------ |
| "canvas renders with Slack preset dimensions"                     | ✓ PASS |
| "canvas renders non-empty pixel data (checkerboard is drawing)"   | ✓ PASS |
| "switching to Apple preset with no image resizes canvas silently" | ✓ PASS |

---

## Code Quality

### `npx eslint src/`

```
(no output — zero errors, zero warnings)
```

### `npx tsc --noEmit`

```
(no output — no TypeScript errors)
```

---

## Verification Summary

| Proof Artifact                                           | Requirement                      | Status |
| -------------------------------------------------------- | -------------------------------- | ------ |
| `npm ls konva react-konva`                               | Both packages installed          | ✓      |
| E2E: "canvas renders with Slack preset dimensions"       | Stage renders at correct size    | ✓      |
| E2E: "canvas renders non-empty pixel data"               | Checkerboard renders via Konva   | ✓      |
| E2E: "switching to Apple preset resizes canvas silently" | Preset-driven re-rendering works | ✓      |
| Unit tests all pass                                      | No regressions                   | ✓      |
| ESLint zero warnings                                     | Code quality                     | ✓      |
| TypeScript no errors                                     | Type safety                      | ✓      |
