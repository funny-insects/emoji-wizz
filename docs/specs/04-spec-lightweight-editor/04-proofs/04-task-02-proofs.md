# 04 Task 2.0 — Manual Eraser Tool — Proof Artifacts

## CLI Output

### typecheck

```
$ npx tsc --noEmit
(no output — zero errors)
```

### lint

```
$ npx eslint src/ --max-warnings=0
(no output — zero errors, zero warnings)
```

### Unit Tests

```
$ npx vitest run

 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  7 passed (7)
       Tests  38 passed (38)
    Start at  08:26:36
    Duration  1.47s
```

### E2E Tests

```
$ npx playwright test --reporter=list

Running 9 tests using 5 workers

  ✓  [chromium] › e2e/app.spec.ts:3:1  › app renders a canvas element (347ms)
  ✓  [chromium] › e2e/app.spec.ts:8:1  › app renders a preset selector dropdown (362ms)
  ✓  [chromium] › e2e/canvas.spec.ts:11:1 › canvas renders with Slack preset dimensions (393ms)
  ✓  [chromium] › e2e/canvas.spec.ts:19:1 › canvas renders non-empty pixel data (399ms)
  ✓  [chromium] › e2e/canvas.spec.ts:37:1 › switching to Apple preset resizes canvas silently (556ms)
  ✓  [chromium] › e2e/canvas.spec.ts:50:1 › switching preset after image upload shows confirm dialog (495ms)
  ✓  [chromium] › e2e/canvas.spec.ts:67:1 › canvas pixel data changes after file upload (567ms)
  ✓  [chromium] › e2e/eraser.spec.ts:26:1 › eraser tool: drag erases pixels to transparent (alpha=0) and undo restores them (668ms)
  ✓  [chromium] › e2e/eraser.spec.ts:86:1 › eraser cursor (circle) shows when eraser tool is active (374ms)

  9 passed (3.0s)
```

## Implementation Summary

### Architecture

- **Offscreen canvas pattern**: On image load, an HTMLCanvasElement is created from the image and used as the Konva Image node's rendering source. This canvas is modified in-place during eraser strokes using `globalCompositeOperation: 'destination-out'`.
- **History integration**: `pushState` (from `useHistory`) is passed to `EmojiCanvas` as `onPushState`. An initial snapshot is pushed after canvas setup. Each completed stroke (mousedown → mouseup) pushes one additional snapshot.
- **Undo/redo restore**: `App.tsx` wraps `undo()` / `redo()` to capture the returned snapshot URL and passes it as `restoreSnapshot` prop to `EmojiCanvas`. The canvas is rebuilt from the snapshot inside `img.onload` (async) and `displayCanvas` state is updated.
- **Eraser cursor**: `cursor: 'none'` on the Stage container + a Konva `Circle` in the overlays layer (Layer 2) that tracks `eraserPos` state on mousemove.
- **Lint compliance**: Avoids `react-hooks/set-state-in-effect` by using React's "derived state during render" pattern for canvas initialization. Avoids `react-hooks/refs` by syncing `offscreenCanvasRef` in a dedicated effect.

### Files Changed

- `src/components/EmojiCanvas.tsx` — full eraser implementation
- `src/App.tsx` — wrapped undo/redo to capture and relay restore snapshots; passes `onPushState`, `restoreSnapshot`, `onSnapshotRestored` to EmojiCanvas
- `src/components/EmojiCanvas.test.tsx` — added 5 eraser unit tests
- `e2e/eraser.spec.ts` — 2 E2E tests (pixel alpha verification + cursor visibility)
- `docs/specs/04-spec-lightweight-editor/04-tasks-lightweight-editor.md` — sub-tasks 2.1–2.7 marked complete

## Test Evidence

### Unit Tests Added (EmojiCanvas.test.tsx)

| Test                                                       | Result  |
| ---------------------------------------------------------- | ------- |
| Pushes initial snapshot when image loads                   | ✅ PASS |
| Pushes exactly one snapshot after mousedown→mouseup stroke | ✅ PASS |
| No extra snapshot on mousemove without mousedown           | ✅ PASS |
| No snapshot push when tool is not eraser                   | ✅ PASS |
| Uses `destination-out` composite operation during stroke   | ✅ PASS |

### E2E Tests Added (eraser.spec.ts)

| Test                                                        | Result  |
| ----------------------------------------------------------- | ------- |
| Drag erases pixels to alpha=0 and undo restores them        | ✅ PASS |
| Eraser cursor (Circle) visible on canvas when eraser active | ✅ PASS |

## Verification Checklist

- [x] `task typecheck` passes — zero TypeScript errors
- [x] `task lint` passes — zero ESLint errors/warnings
- [x] `task test` passes — 38/38 unit tests pass
- [x] `task test:e2e` passes — 9/9 E2E tests pass
- [x] Eraser stroke sets affected pixels to alpha=0 (verified by E2E pixel read)
- [x] Undo after eraser stroke restores original pixels (verified by E2E)
- [x] Eraser cursor (circle outline) visible when tool is active (verified by E2E overlay layer check)
- [x] Exactly one `pushState` call per complete stroke (verified by unit test)
- [x] Task file updated with all sub-tasks marked `[x]`
