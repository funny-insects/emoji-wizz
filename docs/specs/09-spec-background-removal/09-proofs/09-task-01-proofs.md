# Task 1.0 Proof Artifacts — Implement `removeBackground` Utility and Unit Tests

## CLI Output — Test Run

```
 RUN  v4.1.0 /Users/anmol/emoji-wizz

 Test Files  1 passed (1)
       Tests  3 passed (3)
    Start at  17:48:35
    Duration  667ms (transform 27ms, setup 58ms, import 16ms, tests 4ms, environment 507ms)
```

Command: `npx vitest run src/utils/removeBackground.test.ts`

## Test Results

All 3 tests passed:

1. **zeroes border-connected white pixels and preserves red center** — verifies the BFS flood-fill correctly removes border-connected white pixels (alpha → 0) and preserves the red center (alpha stays 255).
2. **does not mutate the input imageData** — verifies the function returns a new `ImageData` without modifying the original.
3. **applying twice leaves no border pixels with alpha > 0** — verifies repeated application produces the same result (idempotent).

## Files Created

- `src/utils/removeBackground.ts` — exports `removeBackground(imageData, tolerance): ImageData` using corner-sampling and BFS flood-fill.
- `src/utils/removeBackground.test.ts` — unit tests using a `makeImageData` helper matching the pattern in `detectContentBounds.test.ts`.

## Verification

- Proof artifact: `09-task-01-proofs.md` exists in `09-proofs/`
- All tests green: 3/3 passed
- No mutations of input `ImageData`
- Algorithm: average 4 corners → BFS from corners → zero alpha for pixels within Euclidean RGB distance ≤ tolerance
