# Task 3.0 Proof Artifacts — Image Import: File Upload, Drag-and-Drop & Clipboard Paste

## Unit Tests — `task test`

```
 Test Files  6 passed (6)
       Tests  17 passed (17)
```

### imageScaling.test.ts assertions (4 tests):

- ✅ square image (128×128) into 128×128 canvas → `{ x: 0, y: 0, width: 128, height: 128 }`
- ✅ landscape image (256×128) into 128×128 → `width: 128, height: 64, x: 0, y: 32`
- ✅ portrait image (128×256) into 128×128 → `width: 64, height: 128, x: 32, y: 0`
- ✅ small image (32×32) into 128×128 → scales up to fill canvas exactly

## E2E Tests — `task test:e2e`

```
5 passed (2.0s)
```

### canvas.spec.ts — file upload test:

- ✅ canvas pixel data changes after file upload
  - Captures initial pixel data (checkerboard only)
  - Uploads `e2e/fixtures/test-emoji.png` (32×32 solid-red PNG) via file input
  - `waitForFunction` polls until pixel data differs from initial state
  - Confirms image has been drawn onto the canvas

## Verification

- `computeContainRect` scales images to fit within the canvas preserving aspect ratio, centered.
- `useImageImport` hook handles file input, drag-and-drop, and clipboard paste; ignores non-image types.
- `EmojiCanvas` redraws: clear → checkerboard → safe zone → image (if present).
- Drag-and-drop: `onDragOver` prevents default; `onDrop` calls hook handler.
- Clipboard paste: `document` `paste` listener registered/cleaned up via `useEffect`.
- File input wired with `accept="image/*"` to filter non-image files at the browser level.
