# T1.0 Proof Artifacts — Image Transform Utilities

## Files Created

- `src/utils/imageTransforms.ts` — pure utility functions: `rotateCanvas90`, `flipCanvas`, `cropCanvas`, `reframeCanvas`
- `src/utils/imageTransforms.test.ts` — 15 unit tests covering all functions

## Test Results

```
 ✓ src/utils/imageTransforms.test.ts (15 tests)
   ✓ rotateCanvas90 > CW: swaps width/height on a non-square canvas
   ✓ rotateCanvas90 > CW: translates and rotates context correctly then draws source
   ✓ rotateCanvas90 > CCW: swaps width/height correctly
   ✓ rotateCanvas90 > CCW: translates and rotates context correctly
   ✓ rotateCanvas90 > returns a new canvas (non-destructive)
   ✓ flipCanvas > horizontal: keeps same dimensions
   ✓ flipCanvas > horizontal: uses scale(-1,1) and translates by width
   ✓ flipCanvas > vertical: uses scale(1,-1) and translates by height
   ✓ flipCanvas > returns a new canvas (non-destructive)
   ✓ cropCanvas > creates a canvas of the correct crop size
   ✓ cropCanvas > calls drawImage with correct source and destination args
   ✓ cropCanvas > returns a new canvas (non-destructive)
   ✓ reframeCanvas > creates a canvas with the target dimensions
   ✓ reframeCanvas > draws the source scaled and centered (landscape → square)
   ✓ reframeCanvas > returns a new canvas (non-destructive)

 Test Files  1 passed (1)
      Tests  15 passed (15)
```

## CLI Output — Quality Gates

```
$ task lint && task typecheck && task test
task: [lint] npx eslint src/          ✅ passed
task: [typecheck] npx tsc --noEmit    ✅ passed
task: [test] npx vitest run           ✅ 133 tests passed (17 files)
```

## Verification

- ✅ Rotate 90° CW on non-square (4×2) swaps to 2×4
- ✅ Rotate 90° CCW produces correct dimensions
- ✅ Crop extracts exact region with correct drawImage args
- ✅ Reframe scales and centers content using computeContainRect
- ✅ All functions return a new canvas (input unchanged)
