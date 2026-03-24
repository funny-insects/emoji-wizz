# Task 2.0 — Suggestion Engine Utility: Proof Artifacts

## CLI Output — Test Results

```
RUN  v4.1.0 /Users/anmol/emoji-wizz

 Test Files  7 passed (7)
      Tests  23 passed (23)
   Start at  16:49:58
   Duration  1.19s (transform 400ms, setup 581ms, import 558ms, tests 371ms, environment 5.10s)
```

## Test File

`src/utils/generateSuggestions.test.ts` — 3 tests covering all three suggestion rules:

- **Trim padding rule**: bounds `{ x:10, y:10, w:108, h:108 }` on 128×128 canvas → includes `"Trim transparent padding"`
- **Fill-ratio rule**: content `{ x:0, y:0, w:20, h:20 }` (small) → includes string matching `/Increase content size by ~\d+%/`
- **No suggestions**: bounds equal full canvas (128×128), content area >> 60% of safe zone → empty array

## Files Created

- `src/utils/generateSuggestions.ts` — exports `MIN_FILL_RATIO = 0.6` and `generateSuggestions(bounds, preset)`
- `src/utils/generateSuggestions.test.ts` — 3 unit tests, all passing

## Verification

All 3 new tests pass. No regressions in existing 20 tests (23 total).
