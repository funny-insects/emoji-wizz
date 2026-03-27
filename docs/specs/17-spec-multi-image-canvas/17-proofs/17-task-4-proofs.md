# 17 Task 4.0 Proofs — Export and Quality Gates

## Export Wiring

`App.tsx` `handleDownload` branches on `mode`:
- `mode === 'multiImage'` with `items.length > 0`: calls `exportStageAsBlob(stageRef.current, exportPreset)` — the same path used when stickers are present in single-image mode. `exportStageAsBlob` hides Layer 0 (checkerboard) before capture and restores it after, producing a transparent background in PNG/WebP.
- `ExportControls` receives `hasContent={multiImage.items.length > 0}` which enables the Download button when items exist.
- File size warning (`checkFileSizeWarning`) and ISO date filename (`buildFilename`) apply identically to the multi-image path.

---

## CLI Output — Lint

```
task lint
task: [lint] npx eslint src/
(exit 0 — no errors)
```

## CLI Output — Typecheck

```
task typecheck
task: [typecheck] npx tsc --noEmit
(exit 0 — no errors)
```

## CLI Output — Unit Tests

```
task test
task: [test] npx vitest run

 Test Files  23 passed (23)
       Tests  182 passed (182)
    Duration  5.91s
```

## CLI Output — E2E Tests

```
task test:e2e
npx playwright test

Running 30 tests using 5 workers
  ✓  [chromium] Mode toggle switches between Single Image and Multi-Image modes
  ✓  [chromium] Multi-Image mode: file picker adds images and shows them in layer panel
  ✓  [chromium] Multi-Image mode: Download button enabled after adding image
  ✓  [chromium] Multi-Image mode: Download triggers a file download
  ✓  [chromium] Multi-Image mode: clicking a layer row selects the image
  ✓  [chromium] Switching back to Single Image mode shows the single image canvas
  ... (24 existing tests also passing)

30 passed (9.9s)
```

## New E2E Tests (`e2e/multi-image-canvas.spec.ts`)

| Test | Result |
|------|--------|
| Mode toggle switches between modes | ✓ |
| File picker adds images and layer panel updates | ✓ |
| Download button disabled before / enabled after adding image | ✓ |
| Download triggers file download with correct filename | ✓ |
| Clicking layer row selects the image | ✓ |
| Switching back to Single Image hides layer panel | ✓ |

## No Regressions

All 24 pre-existing unit and E2E tests continue to pass. The single-image editor (`EmojiCanvas`, all tools, export) is completely unchanged from the user perspective — `mode === 'singleImage'` renders the exact same component tree as before.
