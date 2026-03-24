# Task 1.0 — Bounds Detection Utility: Proof Artifacts

## CLI Output — Test Results

```
RUN  v4.1.0 /Users/anmol/emoji-wizz

 Test Files  6 passed (6)
      Tests  20 passed (20)
   Start at  16:46:10
   Duration  933ms (transform 266ms, setup 427ms, import 452ms, tests 366ms, environment 2.99s)
```

## Test File

`src/utils/detectContentBounds.test.ts` — 3 tests covering:

- **Fully opaque 4×4 image** → `{ x: 0, y: 0, width: 4, height: 4 }`
- **4×4 image with 1px transparent padding** → `{ x: 1, y: 1, width: 2, height: 2 }`
- **Fully transparent 4×4 image** → `null`

## Files Created

- `src/utils/detectContentBounds.ts` — exports `ContentBounds` interface and `detectContentBounds(imageData)` function
- `src/utils/detectContentBounds.test.ts` — 3 unit tests, all passing
- `src/test-setup.ts` — amended with `ImageData` polyfill for jsdom environment

## Verification

All 3 new tests pass. No regressions in the existing 17 tests.
