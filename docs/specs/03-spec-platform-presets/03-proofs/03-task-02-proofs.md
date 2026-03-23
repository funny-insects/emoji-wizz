# Task 2.0 Proofs — Preset Switch Confirmation Dialog, Canvas Resize, and Image Re-scale

## CLI Output

### `task test`

```
 RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

 Test Files  6 passed (6)
      Tests  19 passed (19)
   Start at  10:57:00
   Duration  569ms
```

### `task typecheck`

```
(exits 0, no output)
```

### `task lint`

```
(exits 0, no output)
```

### `task test:e2e`

```
Running 7 tests using 7 workers

  ✓  [chromium] › e2e/app.spec.ts:8:1 › app renders a preset selector dropdown
  ✓  [chromium] › e2e/canvas.spec.ts:15:1 › canvas renders non-empty pixel data (checkerboard is drawing)
  ✓  [chromium] › e2e/canvas.spec.ts:7:1 › canvas renders with Slack preset dimensions
  ✓  [chromium] › e2e/canvas.spec.ts:31:1 › switching to Apple preset with no image resizes canvas silently
  ✓  [chromium] › e2e/app.spec.ts:3:1 › app renders a canvas element
  ✓  [chromium] › e2e/canvas.spec.ts:44:1 › switching preset after image upload shows confirm dialog and resizes canvas
  ✓  [chromium] › e2e/canvas.spec.ts:61:1 › canvas pixel data changes after file upload

  7 passed (2.3s)
```

## Verification

- `EmojiCanvasProps` extended with `image`, `handleFileInput`, `handleDrop`, `handlePaste` ✓
- `useImageImport()` removed from `EmojiCanvas`, import deleted ✓
- `useImageImport()` added to `App` component ✓
- Four new props passed to `<EmojiCanvas>` in `App.tsx` ✓
- `handlePresetChange` guards with `window.confirm` when image is loaded ✓
- `EmojiCanvas.test.tsx` updated with `image={null}` and no-op handler props ✓
- E2E: silent switch to Apple preset (no image) resizes canvas to 512×512 without dialog ✓
- E2E: switch after image upload triggers confirm dialog; accepting resizes canvas to 512×512 ✓
- All 19 unit tests pass ✓
- TypeScript compilation exits 0 ✓
- ESLint exits 0 with max-warnings=0 ✓
