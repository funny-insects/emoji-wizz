# 18-tasks-animated-gif-support.md

## Relevant Files

- `package.json` - **Modified.** Adds `gifuct-js@2.1.2` (decode) and `gifenc@1.0.3` (encode + quantize), pinned exactly.
- `src/types/gifenc.d.ts` - **New file.** Ambient type declarations for `gifenc` (the package ships no types).
- `src/utils/gifDecode.ts` - **New file.** Pure GIF decoding: `decodeGif(buffer)` parses with `gifuct-js`, enforces the 20 MB / 300-frame / 2048×2048 caps, composites every frame (disposal methods 0–3, partial-frame patches) into a full RGBA buffer, normalizes 0–10 ms delays to 100 ms and reads the NETSCAPE loop count. `rgbaFramesToCanvases()` converts the result to downscaled `HTMLCanvasElement` frames (≤ `MAX_IMAGE_SIZE`).
- `src/utils/gifDecode.test.ts` - **New file.** Compositing tests against parsed-frame inputs and the `e2e/fixtures/test-animated.gif` fixture (disposal 1, 2, 3), delay normalization, caps.
- `src/utils/gifEncode.ts` - **New file.** Pure GIF encoding with `gifenc`: per-frame palette quantization, 1-bit transparency, loop count; `resizeRgba()` box-filter resampler used by the size ladder; `decimateFrames()` / `trimFrames()` timeline helpers.
- `src/utils/gifEncode.test.ts` - **New file.** Header/frame-count/loop round-trip tests (encode → `gifuct-js` decode) and timeline helper tests.
- `src/utils/fitToSizeLimit.ts` - **New file.** Pure quality-ladder search (palette → decimation → dimensions → duration trim) with per-dimension binary search and an injectable encoder.
- `src/utils/fitToSizeLimit.test.ts` - **New file.** Mock-encoder tests: least-lossy step chosen, never steps further than needed, fallback to smallest result, encode count.
- `src/workers/gifEncode.worker.ts` - **New file.** Web Worker that runs `encodeGif` / `fitToSizeLimit` off the main thread and posts progress messages.
- `src/utils/gifEncodeClient.ts` - **New file.** Main-thread wrapper that runs the worker (`new Worker(new URL(...), { type: "module" })`) and falls back to in-thread encoding when `Worker` is unavailable (jsdom).
- `src/utils/exportComposition.ts` - **New file.** Single export path: format → encoder routing, per-frame stage rendering (UI layers hidden), static PNG/WebP/GIF encoding, animated GIF encoding with optional auto-fit, result summary text.
- `src/utils/exportComposition.test.ts` - **New file.** Routing tests, static GIF header test (not PNG), summary formatting.
- `src/utils/canvasImageTypes.ts` - **Modified.** `CanvasImageItem` gains optional `frames` and `loopCount`; snapshot type references frame sets.
- `src/hooks/useMultiImageCanvas.ts` - **Modified.** `addAnimatedImage()`, one-animated-item rule, frame-set registry for history, per-frame `mapFrames` helper.
- `src/hooks/useMultiImageCanvas.test.ts` - **Modified.** Animated add/undo/redo, transform-only snapshots share frame-set references.
- `src/hooks/useGifPlayback.ts` - **New file.** Single `requestAnimationFrame` loop that advances the animated item's frame index by elapsed time and swaps the Konva node image.
- `src/utils/frameOps.ts` - **New file.** `mapFrames()`, `cropFrames()`, `transformFrames()`, `removeBackgroundFrames()` — apply existing canvas functions to every frame, keeping delays.
- `src/utils/frameOps.test.ts` - **New file.** Per-frame crop / flip / bg-removal tests.
- `src/components/MultiImageCanvas.tsx` - **Modified.** GIF detection on file input / drop / paste, playback, Play/Pause + scrubber, `ui` names on UI-only nodes, per-frame crop / transform / bg removal.
- `src/components/MultiImageCanvas.test.tsx` - **Modified.** Playback controls render only with an animated item.
- `src/components/LayerPanel.tsx` / `LayerPanel.test.tsx` - **Modified.** "GIF" badge + frame count.
- `src/components/ExportControls.tsx` / `ExportControls.test.tsx` - **Modified.** Auto-select GIF for animated compositions, static-export note, "Auto-fit to size limit" checkbox, progress indicator, result summary.
- `src/components/Toolbar.tsx` / `Toolbar.test.tsx` - **Modified.** Brush / eraser / text disabled with "Not available for animated GIFs" tooltip when an animated item is selected.
- `src/App.tsx` - **Modified.** GIF upload in single-image mode switches to multi-image mode; three download copies replaced by `exportComposition()`; playback state wiring.
- `src/App.css` - **Modified.** Playback controls, GIF badge, export result styles.
- `scripts/generate-gif-fixtures.mjs` - **New file.** Deterministic generator for the GIF fixtures using `gifenc`.
- `e2e/fixtures/test-animated.gif` - **New file.** Small multi-frame GIF using disposal methods 1, 2 and 3.
- `e2e/fixtures/test-large-animated.gif` - **New file.** ≈ 400 KB animated GIF for the auto-fit test.
- `e2e/animated-gif.spec.ts` - **New file.** Playwright tests for import, export, stickers, auto-fit, crop and disabled tools.

### Notes

- Unit tests are colocated with source files and run with `task test`; E2E with `task test:e2e`.
- jsdom's canvas is a no-op mock (`src/test-setup.ts`), so pixel-exact unit tests run on raw RGBA buffers (decode, encode, ladder). Canvas-based per-frame operations are unit-tested for routing, frame count, dimensions and delays; their pixels are proven in the browser via E2E.
- All per-frame operations return new frame arrays and new canvases; an animated item's `frames` array is never mutated, so history can share references.
- UI-only Konva nodes (transformers, overlay layer) carry `name="ui"` so export can hide them.
- Run `task lint`, `task typecheck` and `task test` after every parent task; commit after each.

---

## Tasks

### [x] 1.0 GIF Import & Live Playback

Decode an uploaded animated GIF into composited frames, add it to the multi-image canvas as one movable/resizable item, animate it with a single rAF loop, and expose Play/Pause, a frame scrubber and a Layer Panel "GIF" badge.

#### 1.0 Proof Artifact(s)

- Test: `gifDecode.test.ts` — the fixture using disposal methods 1, 2 and 3 composites to the expected frame pixels and delays.
- E2E: `animated-gif.spec.ts` — uploading `e2e/fixtures/test-animated.gif` shows a GIF badge with the correct frame count.
- Screenshot: uploaded GIF animating on the canvas after being resized.

#### 1.0 Tasks

- [x] 1.1 Add `gifuct-js@2.1.2` and `gifenc@1.0.3` (exact) and `src/types/gifenc.d.ts`.
- [x] 1.2 Write `scripts/generate-gif-fixtures.mjs` and generate `e2e/fixtures/test-animated.gif` (disposal 1/2/3) and `e2e/fixtures/test-large-animated.gif` (≈ 400 KB).
- [x] 1.3 Implement `src/utils/gifDecode.ts`: caps (20 MB, 300 frames, 2048×2048 screen) raising `GifImportError`, frame compositing for disposal 0–3 and partial patches, delay normalization (0–10 ms → 100 ms), loop count (0 = infinite default).
- [x] 1.4 Implement `rgbaFramesToCanvases()` downscaling to `MAX_IMAGE_SIZE` (256).
- [x] 1.5 Extend `CanvasImageItem` with optional `frames: { canvas; delayMs }[]` and `loopCount`; `item.canvas` is the displayed (poster / paused) frame.
- [x] 1.6 Add `addAnimatedImage()` to `useMultiImageCanvas`; reject a second animated item with a message; single-frame GIFs go through `addImage()` as static.
- [x] 1.7 History: snapshots keep animated items' frame sets by shared reference (keyed by id) instead of serializing frames, so move/undo never drops frames.
- [x] 1.8 Detect `image/gif` on file input, drag/drop and paste in `MultiImageCanvas`; show import errors (caps, second GIF) inline.
- [x] 1.9 Single-image mode: uploading an animated GIF switches to multi-image mode and imports it there.
- [x] 1.10 Implement `useGifPlayback`: one rAF loop advancing the frame index by elapsed time, swapping the `KonvaImage` source and calling `batchDraw()` on the image layer only.
- [x] 1.11 Play/Pause button and frame scrubber below the canvas, shown only when an animated item exists.
- [x] 1.12 Layer Panel "GIF" badge with frame count.
- [x] 1.13 Unit tests (decoder, hook, LayerPanel badge, controls visibility) and E2E badge test.

---

### [x] 2.0 Animated GIF Export

Encode a real animated GIF of the whole composition at preset dimensions with stickers and frames on every frame, fix the GIF/WebP format bug, and collapse the three download paths into `exportComposition()`.

#### 2.0 Proof Artifact(s)

- E2E: uploaded GIF downloads as `GIF89a`, > 1 frame, 128×128.
- E2E: sticker pixels present in first and last frames of the exported GIF.
- Test: `exportComposition.test.ts` — format → encoder routing; static GIF export starts with a GIF header.

#### 2.0 Tasks

- [x] 2.1 Implement `src/utils/gifEncode.ts` (`encodeGif` with one shared palette quantized across all frames — per-frame quantization was too slow for the auto-fit ladder, transparency index for alpha < 128 when the background is transparent, loop count).
- [x] 2.2 Name UI-only Konva nodes `ui`; implement per-frame rendering: set animated node to frame i, `stage.toCanvas()` with UI (and transparent background) hidden, `downscaleCanvas` to preset size, restore.
- [x] 2.3 Implement `exportComposition()` with routing: animated + GIF → animated encode; static GIF → `gifenc`; WebP → `toDataURL('image/webp')`; PNG → canvas PNG.
- [x] 2.4 Replace the three download copies in `App.tsx` with `exportComposition()`.
- [x] 2.5 ExportControls: auto-select GIF when an animated item exists; PNG/WebP show "Static export: animation not included".
- [x] 2.6 Unit + E2E tests.

---

### [x] 3.0 Auto-Fit to Platform Size Limit

Compress animated exports under `preset.maxFileSizeKb` using a binary-searched quality ladder in a Web Worker, with progress and a result summary.

#### 3.0 Proof Artifact(s)

- Test: `fitToSizeLimit.test.ts` — mock encoder: least-lossy fitting step, no over-stepping, smallest-result fallback.
- E2E: `test-large-animated.gif` downloads under 131,072 bytes with the Slack preset.
- Screenshot: result summary line.

#### 3.0 Tasks

- [x] 3.1 Implement `decimateFrames()` (merge delays, 8 fps floor), `trimFrames()` (3 s / 2 s / 1.5 s) and `resizeRgba()`.
- [x] 3.2 Implement `fitToSizeLimit()`: palette 256→128→64→32, decimation ×2 (twice), dimensions 100/87.5/75/62.5/50 % of preset (128→112→96→80→64), trim; binary search per dimension; fallback to the smallest result.
- [x] 3.3 Worker `src/workers/gifEncode.worker.ts` + `gifEncodeClient.ts` with progress messages.
- [x] 3.4 ExportControls: "Auto-fit to size limit" checkbox (default on), "Optimizing… step n/m" indicator, result summary ("118 KB — 64 colors, 12 fps, 128 px (was 412 KB)", plus "trimmed to X s of Y s"), warning in `sizeWarning` when nothing fits; unchecked keeps `checkFileSizeWarning`.
- [x] 3.5 Unit + E2E tests.

---

### [x] 4.0 GIF Crop

Reuse the square crop tool on animated items, cropping every frame with the same source rectangle while the GIF keeps playing.

#### 4.0 Proof Artifact(s)

- Test: `frameOps.test.ts` — 3-frame crop yields 3 frames of the expected size with delays unchanged; undo restores originals (`useMultiImageCanvas.test.ts`).
- E2E: crop a GIF, export, output is still multi-frame with cropped content.

#### 4.0 Tasks

- [x] 4.1 Implement `cropFrames()` in `src/utils/frameOps.ts`.
- [x] 4.2 Keep playback running while the crop tool is active.
- [x] 4.3 On confirm, clamp the crop rect to the item bounds (miss → no-op), crop every frame, update position/size, push one history entry.
- [x] 4.4 Unit + E2E tests.

---

### [x] 5.0 Other Editing Tools & History

Flip / rotate 90° and background removal on every frame; brush, eraser and text disabled for animated items; per-frame operations undoable.

#### 5.0 Proof Artifact(s)

- Test: per-frame flip and crop on every frame; undo restores the original frame set.
- E2E: brush and eraser are disabled while a GIF is selected.

#### 5.0 Tasks

- [x] 5.1 `transformFrames()` (rotate / flip + reframe) and `removeBackgroundFrames()` in `frameOps.ts`; route `MultiImageCanvas` transform and bg-removal effects through them for animated items.
- [x] 5.2 Toolbar: disable brush / eraser / text with "Not available for animated GIFs" when the active item is animated; switch away from those tools if one is active.
- [x] 5.3 Verify frame-set history: transform-only snapshots share references; per-frame ops create a new frame set; `MAX_HISTORY` bounds memory.
- [x] 5.4 Unit + E2E tests; final `task test:e2e`.
