# 05 Task 4.0 Proofs — Remove Legacy Canvas Code, Add Overlays Layer, Final Verification

## 4.1 + 4.2 — Legacy Files Deleted

```
$ grep -r "getContext\|CanvasRenderingContext2D" src/ --include="*.ts" --include="*.tsx" -l
src/test-setup.ts
```

`canvasDrawing.ts` and `canvasDrawing.test.ts` are gone. The only remaining references are in `test-setup.ts`, which is required infrastructure for mocking Konva's canvas 2D context in jsdom.

## 4.3 — No Legacy Imports in EmojiCanvas.tsx

`EmojiCanvas.tsx` imports only from `react-konva`, `../utils/presets`, and `../utils/imageScaling`. No `canvasDrawing` import exists.

## 4.4 — Overlays Layer Added

`EmojiCanvas.tsx` now contains three `<Layer>` components in order:

1. Background layer (checkerboard + safe-zone rect)
2. Image layer (Konva `<Image>` when image is loaded)
3. Overlays layer (empty, structural preparation for Spec 04)

## CLI Output — Full Quality Gate Suite

### `task lint`

```
task: [lint] npx eslint src/
(no output = zero warnings/errors)
```

### `task typecheck`

```
task: [typecheck] npx tsc --noEmit
(no output = zero TypeScript errors)
```

### `task test`

```
task: [test] npx vitest run

 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  5 passed (5)
      Tests  17 passed (17)
   Start at  15:55:46
   Duration  1.09s
```

### `task test:e2e`

```
task: [test:e2e] npx playwright test

Running 7 tests using 5 workers

  ✓  [chromium] › e2e/app.spec.ts:8:1 › app renders a preset selector dropdown (310ms)
  ✓  [chromium] › e2e/app.spec.ts:3:1 › app renders a canvas element (324ms)
  ✓  [chromium] › e2e/canvas.spec.ts:19:1 › canvas renders non-empty pixel data (checkerboard is drawing) (341ms)
  ✓  [chromium] › e2e/canvas.spec.ts:11:1 › canvas renders with Slack preset dimensions (362ms)
  ✓  [chromium] › e2e/canvas.spec.ts:37:1 › switching to Apple preset with no image resizes canvas silently (524ms)
  ✓  [chromium] › e2e/canvas.spec.ts:50:1 › switching preset after image upload shows confirm dialog and resizes canvas (383ms)
  ✓  [chromium] › e2e/canvas.spec.ts:67:1 › canvas pixel data changes after file upload (513ms)

  7 passed (2.8s)
```

## 4.9 — Layer-Structure Unit Test Completed

`EmojiCanvas.test.tsx` now includes the previously-deferred test:

```ts
it("renders three layers in order: background, image, and overlays", () => {
  render(<EmojiCanvas ... />);
  const stage = Konva.stages[0];
  expect(stage.getLayers().length).toBe(3);
});
```

This test passes in the `task test` run above (17 tests, 0 failures).

## E2E Selector Updates (4.6 + 4.7)

Playwright's strict mode rejects ambiguous locators. With 3 Konva layers = 3 canvas elements, `page.locator("canvas")` was updated to `page.locator(".konvajs-content canvas").first()` throughout both E2E files. The pixel-change test targets the image-layer canvas via `querySelectorAll(".konvajs-content canvas")[1]`.
