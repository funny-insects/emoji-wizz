# Task 3.0 Proof Artifacts — Freehand Brush/Pen Tool

## Summary

Implements the freehand brush tool: mousedown creates a `Konva.Line` on the overlays layer; mousemove extends it; mouseup flattens the stroke onto the offscreen canvas (destructive), removes the `Konva.Line`, and pushes one history snapshot. Switching tools away from brush cleans up any in-progress line. Cursor is `crosshair` when brush is active.

---

## CLI Output — Full Quality Gate

```
$ npx tsc --noEmit && npx eslint src/ --max-warnings=0 && npx vitest run && npx playwright test

# TypeScript: no output (clean)
# ESLint:     no output (clean)

 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  7 passed (7)
       Tests  42 passed (42)
    Start at  08:49:36
    Duration  1.36s

Running 11 tests using 5 workers

  ✓  [chromium] › e2e/app.spec.ts:3:1 › app renders a canvas element (566ms)
  ✓  [chromium] › e2e/app.spec.ts:8:1 › app renders a preset selector dropdown (567ms)
  ✓  [chromium] › e2e/canvas.spec.ts:11:1 › canvas renders with Slack preset dimensions (574ms)
  ✓  [chromium] › e2e/brush.spec.ts:89:1 › brush tool: crosshair cursor visible when brush is active with image loaded (668ms)
  ✓  [chromium] › e2e/canvas.spec.ts:19:1 › canvas renders non-empty pixel data (checkerboard is drawing) (233ms)
  ✓  [chromium] › e2e/canvas.spec.ts:37:1 › switching to Apple preset with no image resizes canvas silently (410ms)
  ✓  [chromium] › e2e/brush.spec.ts:26:1 › brush tool: drag draws black stroke on image layer and undo removes it (1.0s)
  ✓  [chromium] › e2e/canvas.spec.ts:50:1 › switching preset after image upload shows confirm dialog and resizes canvas (500ms)
  ✓  [chromium] › e2e/canvas.spec.ts:67:1 › canvas pixel data changes after file upload (596ms)
  ✓  [chromium] › e2e/eraser.spec.ts:83:1 › eraser cursor (circle) shows when eraser tool is active and mouse is over canvas (287ms)
  ✓  [chromium] › e2e/eraser.spec.ts:26:1 › eraser tool: drag erases pixels to transparent (alpha=0) and undo restores them (651ms)

  11 passed (3.5s)
```

---

## Test Results — Unit Tests (brush-specific)

New describe block `EmojiCanvas — brush tool` with 4 tests:

| Test                                                                                        | Result |
| ------------------------------------------------------------------------------------------- | ------ |
| creates a Konva.Line on the overlays layer with correct color and stroke width on mousedown | ✓ pass |
| pushes exactly one snapshot after a complete brush mousedown→mouseup stroke                 | ✓ pass |
| does not push a snapshot when tool is text (no mouse handling)                              | ✓ pass |
| appends points to the line on mousemove during a brush stroke                               | ✓ pass |

Verified:

- `line.stroke() === "#000000"`
- `line.strokeWidth() === 3` (128×128 canvas → `Math.round((128/128)*3) = 3`)
- `line.lineCap() === "round"`, `line.lineJoin() === "round"`
- Line destroyed (flattened to offscreen canvas) after mouseup — overlays layer shows 0 lines
- `onPushState` called exactly 2 times (1 initial + 1 stroke)

---

## Test Results — E2E Tests (brush.spec.ts)

```
✓ brush tool: drag draws black stroke on image layer and undo removes it (1.0s)
✓ brush tool: crosshair cursor visible when brush is active with image loaded (668ms)
```

E2E verifications:

- After brush drag: `pixel.r === 0, pixel.g === 0, pixel.b === 0, pixel.a > 0` (black stroke applied)
- After Cmd+Z undo: pixel restored to pre-draw values (`r, g, b, a` match `before`)
- Cursor style on canvas container element is `"crosshair"` when brush tool is active

---

## Implementation Details

### Files Changed

- `src/components/EmojiCanvas.tsx` — added brush event handlers (`handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `handleMouseLeave`), `flattenCurrentLine` callback, `brushStrokeWidth` constant, cleanup effect on tool change, crosshair cursor style
- `src/components/EmojiCanvas.test.tsx` — added 4 brush unit tests; updated one pre-existing eraser test that assumed brush was a no-op
- `e2e/brush.spec.ts` — new E2E test file with 2 tests

### Key Design Decisions

- **Flatten on mouseup**: Each completed stroke is immediately composited onto the offscreen canvas and removed from the overlays layer. This gives exactly one undo entry per stroke with correct snapshot content.
- **`brushStrokeWidth`**: `Math.round((width / 128) * 3)` — 3px at 128×128, 12px at 512×512.
- **Tool change cleanup**: A `useEffect` watching `activeTool` destroys any in-progress Konva.Line if the user switches tools mid-stroke (edge case).
