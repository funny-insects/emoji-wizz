# Task 3.0 Proof Artifacts — Wire Background Removal Through App and EmojiCanvas

## CLI Output — Full Test Suite

```
 RUN  v4.1.0 /Users/anmol/emoji-wizz

 Test Files  16 passed (16)
       Tests  110 passed (110)
    Start at  17:56:22
    Duration  2.78s (transform 1.11s, setup 1.19s, import 2.13s, tests 3.00s, environment 13.27s)
```

Command: `task test`

Zero regressions — all 110 tests pass across 16 test files.

## Files Modified

- `src/components/EmojiCanvas.tsx`
  - Imported `removeBackground` from `../utils/removeBackground`
  - Added `bgRemovalRequest?: { tolerance: number; seq: number } | null` to `EmojiCanvasProps`
  - Destructured `bgRemovalRequest = null` in function signature
  - Added `useEffect([bgRemovalRequest])`: reads offscreen canvas, applies `removeBackground`, creates new canvas with `putImageData`, calls `setDisplayCanvas(newCanvas)` to push history automatically

- `src/App.tsx`
  - Added `bgTolerance` state (default 15)
  - Added `bgRemovalRequest` state (default null)
  - Added `handleRemoveBackground` callback (increments `seq` on each call to re-trigger effect)
  - Wired `bgTolerance`, `onBgToleranceChange`, `onRemoveBackground` to `<Toolbar />`
  - Wired `bgRemovalRequest` to `<EmojiCanvas />`

## Verification

- Full suite: 16 test files, 110 tests, all green
- No new test files required for this wiring task (App.tsx and EmojiCanvas.tsx are integration-level)
- History push is automatic: `setDisplayCanvas` triggers the existing `useEffect([displayCanvas])` which calls `onPushStateRef.current`
- `seq` counter ensures repeated clicks on Remove BG always fire a new effect even with the same tolerance value
