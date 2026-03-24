# 04 Task 5.0 — Proofs: Transparency Preservation & Integration Verification

## Summary

Task 5.0 verifies that transparent PNGs maintain their alpha channel through all editing
operations (eraser, brush, text) and that multi-tool undo/redo works correctly.

A bug was discovered and fixed during this task: the `displayCanvas` useEffect in
`EmojiCanvas.tsx` was pushing a duplicate snapshot onto the undo stack after every
undo/redo restore, which cleared the redo stack and corrupted consecutive undos. Fixed
by adding an `isRestoringRef` guard that skips the push when `displayCanvas` changes
due to a snapshot restore rather than a new image load.

---

## CLI Output

### Lint

```
task: [lint] npx eslint src/
exit: 0 (no warnings, no errors)
```

### TypeCheck

```
task: [typecheck] npx tsc --noEmit
exit: 0 (no type errors)
```

### Unit Tests (task test)

```
task: [test] npx vitest run

 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  7 passed (7)
       Tests  53 passed (53)
    Start at  10:40:57
    Duration  1.36s
```

### E2E Tests (task test:e2e)

```
task: [test:e2e] npx playwright test

Running 19 tests using 5 workers

  ✓  e2e/app.spec.ts › app renders a canvas element
  ✓  e2e/app.spec.ts › app renders a preset selector dropdown
  ✓  e2e/canvas.spec.ts › canvas renders with Slack preset dimensions
  ✓  e2e/canvas.spec.ts › canvas renders non-empty pixel data (checkerboard is drawing)
  ✓  e2e/canvas.spec.ts › switching to Apple preset with no image resizes canvas silently
  ✓  e2e/canvas.spec.ts › switching preset after image upload shows confirm dialog and resizes canvas
  ✓  e2e/canvas.spec.ts › canvas pixel data changes after file upload
  ✓  e2e/brush.spec.ts › brush tool: drag draws black stroke on image layer and undo removes it
  ✓  e2e/brush.spec.ts › brush tool: crosshair cursor visible when brush is active with image loaded
  ✓  e2e/eraser.spec.ts › eraser tool: drag erases pixels to transparent (alpha=0) and undo restores them
  ✓  e2e/eraser.spec.ts › eraser cursor (circle) shows when eraser tool is active and mouse is over canvas
  ✓  e2e/text-tool.spec.ts › text tool: typing and pressing Enter renders text on canvas
  ✓  e2e/text-tool.spec.ts › text tool: undo removes placed text
  ✓  e2e/text-tool.spec.ts › text tool: changing color affects new text placement
  ✓  e2e/text-tool.spec.ts › text tool: text cursor visible when text tool is active with image loaded
  ✓  e2e/editor-integration.spec.ts › transparency preservation: transparent areas remain alpha=0 after eraser, brush, and text edits and full undo
  ✓  e2e/editor-integration.spec.ts › tool switching: switching from brush to eraser discards in-progress stroke
  ✓  e2e/editor-integration.spec.ts › tool switching: switching from text tool discards open text input
  ✓  e2e/editor-integration.spec.ts › undo/redo across tool boundaries: stepping back through eraser, brush, and text

  19 passed (5.0s)
```

---

## Test Results

### New tests added in `e2e/editor-integration.spec.ts`

| Test                                                                                                          | Result |
| ------------------------------------------------------------------------------------------------------------- | ------ |
| transparency preservation: transparent areas remain alpha=0 after eraser, brush, and text edits and full undo | ✓ PASS |
| tool switching: switching from brush to eraser discards in-progress stroke                                    | ✓ PASS |
| tool switching: switching from text tool discards open text input                                             | ✓ PASS |
| undo/redo across tool boundaries: stepping back through eraser, brush, and text                               | ✓ PASS |

### Coverage

- **5.1** — `e2e/fixtures/test-emoji-transparent.png` created: 32×32 RGBA PNG, top half
  (rows 0–15) opaque orange (255, 165, 0, 255), bottom half (rows 16–31) fully
  transparent (0, 0, 0, 0). When rendered in a 128×128 stage, canvas rows 0–63 are
  opaque and rows 64–127 are transparent — enabling deterministic alpha=0 verification.

- **5.2** — `editor-integration.spec.ts` "transparency preservation" test: uploads
  transparent fixture, verifies initial alpha=0 at y=96, applies eraser + brush + text
  in the opaque top half, re-verifies alpha=0 at y=96 and y=100, undoes all 3 actions,
  re-verifies alpha=0 and opaque area restored.

- **5.3** — Two tool-switching tests: (a) mid-stroke brush switch to eraser discards
  the in-progress Konva.Line and leaves the overlay layer empty; (b) open text input
  is discarded (no pixel change) when switching to eraser.

- **5.4** — Multi-step undo/redo test: verifies pixel state after each individual undo
  (text → brush → eraser), confirms Undo button becomes disabled at baseline, then
  redoes all 3 and confirms Redo button becomes disabled.

---

## Bug Fix

**File:** `src/components/EmojiCanvas.tsx`

**Problem:** `displayCanvas` useEffect called `onPushState` on every canvas change,
including snapshot restores triggered by undo/redo. This pushed a duplicate onto the
undo stack and cleared the redo stack after each undo, making consecutive undos fail.

**Fix:** Added `isRestoringRef` boolean ref. Set to `true` in the restore effect before
`setDisplayCanvas`, checked in the `displayCanvas` effect to skip the push, cleared at
the end of the effect.

```diff
+  const isRestoringRef = useRef(false);

   useEffect(() => {
     offscreenCanvasRef.current = displayCanvas;
-    if (displayCanvas) {
+    if (displayCanvas && !isRestoringRef.current) {
       onPushStateRef.current?.(displayCanvas.toDataURL("image/png"));
     }
+    isRestoringRef.current = false;
   }, [displayCanvas]);

   // in restore effect's img.onload:
+      isRestoringRef.current = true;
       setDisplayCanvas(canvas);
```

---

## Verification

All four blocking verifications pass:

1. **Proof file exists**: `04-proofs/04-task-05-proofs.md` ✓
2. **Git commit**: created after this proof file (see git log) ✓
3. **Task file**: parent task 5.0 marked `[x]` ✓
4. **Pattern compliance**: follows `isRestoringRef` guard pattern consistent with
   other refs used in EmojiCanvas (`isErasingRef`, `isBrushingRef`) ✓
