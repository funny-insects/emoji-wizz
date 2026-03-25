# Task 2.0 Proofs: Implement edge-pixel contrast detection utility

## Implementation

Created `src/utils/detectContrastIssues.ts` with:

- Edge pixel perimeter sampling using ContentBounds
- Euclidean RGB distance comparison against dark (#1a1a1a) and light (#ffffff) backgrounds
- Threshold of 55 for distance, 25% proportion for triggering warnings
- Skips fully transparent pixels (alpha === 0)

## Test Results

```
$ task test
 Test Files  18 passed (18)
      Tests  138 passed (138)
```

4 new tests in `detectContrastIssues.test.ts`:

- Nearly white emoji triggers light background warning
- Nearly black emoji triggers dark background warning
- Bright colored emoji triggers no warnings
- Fully transparent image returns no warnings

## CLI Output

```
$ task lint
task: [lint] npx eslint src/

$ task typecheck
task: [typecheck] npx tsc --noEmit

$ task test
 Test Files  18 passed (18)
      Tests  138 passed (138)
```

## Verification

- All quality gates pass cleanly
- Edge pixel sampling correctly walks bounding box perimeter
- Contrast detection thresholds produce expected results for all test cases
