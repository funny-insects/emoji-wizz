# 18-spec-animated-gif-support.md

## Introduction/Overview

Today the app keeps only the first frame of an uploaded GIF: `HTMLImageElement` returns frame 1 as a static bitmap. Exporting as "GIF" also produces a PNG blob with a `.gif` extension. This spec adds animated GIFs from start to finish. A user can upload an animated GIF, position and resize it on the canvas like any other image, and download an animated GIF. The app automatically shrinks the file to fit under the selected platform's size limit (Slack: 128 KB).

## Goals

1. Import an animated GIF and keep every frame and frame delay.
2. Play the animation live on the canvas. Move, scale and rotate apply to every frame.
3. Export a real animated GIF at the preset's dimensions, with stickers and frames composited onto every frame.
4. Optionally (on by default), compress the export automatically until it is under `preset.maxFileSizeKb`. Report what was traded away to get there.
5. Fix the existing format bug so that selecting GIF or WebP produces a real file in that format.

## User Stories

- **As a user**, I want to drop an animated GIF onto the canvas and see it animate, so I know what I'm working with.
- **As a user**, I want to resize and position the GIF inside the Slack safe zone, so the emoji reads well at small sizes.
- **As a user**, I want the downloaded GIF to be under Slack's 128 KB limit without fiddling with settings, so the upload succeeds the first time.
- **As a user**, I want to see what quality was traded away (colors, frame rate, size), so I can decide whether to simplify the source instead.
- **As a user**, I want to add stickers or a frame on top of my GIF and have them appear on every frame.

## Demoable Units of Work

### Unit 1: GIF Import & Live Playback

**Purpose:** Get an animated GIF onto the canvas as one movable, resizable item that animates.

**Functional Requirements:**

- The system shall detect `image/gif` files on file input, drag/drop and paste in multi-image mode.
- The system shall decode GIFs with `gifuct-js`. It shall handle frame disposal methods and partial-frame patches, compositing each frame into a full RGBA `HTMLCanvasElement`.
- The system shall treat a GIF with exactly one frame as a normal static image.
- The system shall downscale decoded frames to fit within `MAX_IMAGE_SIZE` (256 px), the same as static images.
- The system shall cap input at 300 frames and 20 MB. Above either cap it shall show an error and import nothing.
- The system shall extend `CanvasImageItem` with optional `frames: { canvas: HTMLCanvasElement; delayMs: number }[]`. `item.canvas` stays the frame currently displayed, so existing render code keeps working.
- The system shall run one `requestAnimationFrame` loop in `MultiImageCanvas`. The loop advances each animated item's frame index by elapsed time, swaps the `KonvaImage` source and calls `batchDraw()`.
- The system shall normalize delays of 0–10 ms to 100 ms, the same as browsers do.
- The system shall provide a Play/Pause control. While paused, a frame scrubber shows a chosen frame.
- The system shall mark animated items in the Layer Panel with a "GIF" badge and show their frame count.
- The system shall apply move, scale, rotate and layer reordering to animated items, since these are Konva node transforms.

**Proof Artifacts:**

- Screenshot or recording of an uploaded GIF animating on the canvas after being resized.
- Unit tests: the decoder composites a fixture GIF that uses disposal methods 1, 2 and 3 into the expected frame pixels and delays.
- E2E test: upload `e2e/fixtures/test-animated.gif`, then assert the Layer Panel shows a GIF badge with the correct frame count.

### Unit 2: Animated GIF Export

**Purpose:** Produce a real animated GIF of the whole composition at the preset's dimensions.

**Functional Requirements:**

- The system shall encode GIFs with `gifenc`, using per-frame palette quantization and 1-bit transparency when the background is transparent.
- If the composition contains an animated item, the system shall auto-select GIF as the export format. Choosing PNG or WebP shall export the frame currently shown, with a note: "Static export: animation not included".
- The system shall build the frame timeline from the animated item's frames.
- To render each output frame, the system shall set each animated item to that frame, call `stage.toCanvas()` (UI layers hidden, background layer hidden when transparent) and reuse `downscaleCanvas` to reach the preset's dimensions.
- The system shall include stickers and decorative frames, unchanged, in every output frame.
- The system shall preserve the source's loop setting: infinite by default, or the original loop count.
- The system shall encode static GIF exports with `gifenc` instead of `canvas.toBlob('image/gif')`, so the output is a real GIF.
- The system shall encode static WebP exports with `toDataURL('image/webp')`.
- The system shall replace the three copies of the download flow in `App.tsx` with a single `exportComposition()` path.

**Proof Artifacts:**

- E2E test: upload a GIF and download it. The downloaded file starts with `GIF89a`, decodes to more than one frame and is 128×128.
- E2E test: a GIF with a sticker added has the sticker's pixels present in both the first and last frames.
- Unit tests: format → encoder routing, and that a static GIF export has a GIF header (it is not a PNG).

### Unit 3: Auto-Fit to Platform Size Limit

**Purpose:** Guarantee that the GIF fits under `preset.maxFileSizeKb` (Slack 128 KB, Discord 256 KB, Apple 500 KB) without the user tuning anything.

**Functional Requirements:**

- The system shall offer an "Auto-fit to size limit" checkbox in ExportControls, checked by default for animated exports.
- When the first encode exceeds the limit, the system shall step through a quality ladder ordered from least to most visible loss:
  1. Palette 256 → 128 → 64 → 32 colors
  2. Frame decimation: drop every 2nd frame and merge its delay into the kept frame (≈ halves the fps, floor 8 fps). Repeat once more if needed.
  3. Dimensions 128 → 112 → 96 → 80 → 64 px, with the preset's aspect ratio kept
  4. Duration trim: keep frames from the start up to a cutoff of 3 s, then 2 s, then 1.5 s. The loop restarts from frame 1.
- The system shall stop at the first ladder step that fits.
- The system shall binary-search within each ladder dimension, so it typically needs ≤ 8 encodes rather than one per step.
- The system shall run encoding in a Web Worker so the UI stays responsive, and show a progress indicator ("Optimizing… step 3/8").
- The system shall show the result after export, for example: "118 KB — 64 colors, 12 fps, 128 px (was 412 KB)". When the duration was trimmed, the result shall say so explicitly, for example: "trimmed to 2.0 s of 4.6 s".
- If even the most aggressive step exceeds the limit, the system shall still download the smallest result. It shall show a warning suggesting fewer frames or a simpler source, using the existing `sizeWarning` slot.
- When auto-fit is unchecked, the system shall export at full quality and keep the current advisory `checkFileSizeWarning` behavior.

**Proof Artifacts:**

- Unit tests: given a mock encoder that returns sizes, the ladder picks the least-lossy step under the limit and never steps further than needed. When nothing fits it falls back to the smallest result.
- E2E test: a fixture GIF of about 400 KB downloads under 131,072 bytes with the Slack preset.
- Screenshot of the result summary.

### Unit 4: GIF Crop

**Purpose:** Let the user drag and resize a square over the GIF and remove everything outside it, on every frame.

**Functional Requirements:**

- The system shall reuse the existing crop tool for animated items: the square crop rectangle with a Konva Transformer, the dimmed outside area and the Confirm button (`MultiImageCanvas.tsx` crop rect).
- The system shall keep the GIF animating while the crop tool is active, so the user can check the square against every frame and not only the first.
- On confirm, the system shall apply `cropCanvas` with the same source-pixel rectangle to every entry in `item.frames`. Each frame keeps its delay. The item's position and size are then updated, the same as for a static crop.
- The system shall clamp the crop rectangle to the item's bounds. A rectangle that misses the image entirely shall be a no-op.
- The system shall record the crop as one history entry. Undo restores the uncropped frame set.
- The exported GIF shall contain only the cropped region on every frame.

**Proof Artifacts:**

- Recording: crop a GIF to a small square while it plays, confirm, and show it still animating at the cropped size.
- Unit tests: cropping a 3-frame fixture yields 3 frames of the expected dimensions and pixels, with delays unchanged. Undo restores the originals.
- E2E test: upload a GIF, crop it, export, and assert the output is still multi-frame with the content cropped.

### Unit 5: Other Editing Tools & History

**Purpose:** Keep the other existing tools working with animated items, or clearly disable them.

**Functional Requirements:**

- The system shall apply flip and rotate 90° to every frame. These are already pure canvas→canvas functions in `imageTransforms.ts`, so the system maps them over `frames`.
- The system shall apply background removal to every frame with the same tolerance. `removeBackground` is a pure `ImageData` function.
- The system shall disable brush, eraser and text on animated items. A tooltip shall say "Not available for animated GIFs".
- The system shall store frame sets for history as immutable, shared references keyed by id. Snapshots of transform-only changes reference the existing frame set rather than serializing every frame to a dataUrl. `MAX_HISTORY` (20) still bounds memory.
- The system shall make undo/redo of per-frame operations (flip, crop, background removal) restore the previous frame set.

**Proof Artifacts:**

- Unit tests: per-frame flip and crop yield the correct pixels on every frame, and undo restores the original frame set.
- E2E test: brush and eraser are disabled while a GIF is selected.

## Non-Goals (Out of Scope)

1. **Single-image mode (`EmojiCanvas`)**: GIF support targets the multi-image canvas only. Uploading a GIF in single-image mode switches to multi-image mode.
2. **Multiple animated GIFs in one composition**: v1 allows one animated item. Adding a second shows a message. Static images alongside it are fine.
3. **Frame-level editing**: no per-frame painting, frame deletion, reordering, trimming or speed controls in v1.
4. **Animated WebP/APNG export or import.**
5. **Lossy GIF compression** (gifsicle-style `--lossy`): it needs a WASM build, so it is out of scope for v1.
6. **Creating animations from static images** (e.g., a "spin" or "shake" effect generator).
7. **GIF stickers**: GIFs can only be the emoji itself. The DecoratePanel custom-sticker upload stays PNG-only.
8. **Non-square crop**: the crop tool keeps its existing square shape.

## Design Considerations

- The Play/Pause button and frame scrubber sit beneath the canvas and appear only when an animated item exists.
- The auto-fit result line goes in ExportControls, next to the existing size-warning area, in the same style.
- The GIF badge in the Layer Panel matches the existing label style.

## Repository Standards

- Pure helpers in `src/utils/`: `gifDecode.ts`, `gifEncode.ts`, `fitToSizeLimit.ts`, with colocated `*.test.ts`.
- The worker lives at `src/workers/gifEncode.worker.ts`, using Vite's `new Worker(new URL(...), { type: 'module' })`.
- Verify with `task lint`, `task typecheck`, `task test` and `task test:e2e`.
- New GIF fixtures go in `e2e/fixtures/`.

## Technical Considerations

- **Libraries (both MIT, ~10 KB each):** `gifuct-js@2.1.2` for decoding and `gifenc@1.0.3` for encoding with quantization. `ImageDecoder` (WebCodecs) was rejected because it is not available in Firefox. `gif.js` was rejected because it is slower and unmaintained.
- **Memory:** 300 frames × 256² × 4 B ≈ 78 MB worst case, which is acceptable. Export frames are only 128², so they are cheap.
- **Encode cost:** 128×128 × ~60 frames with gifenc is tens of ms per encode, so an 8-step search stays well under 1 s.
- **Transparency:** GIF has 1-bit alpha. Pixels with alpha < 128 become the transparent index, so semi-transparent edges lose their softness. This is acceptable and is the same trade-off every GIF tool makes.
- **Timeline sampling:** export frames use the source delays exactly. Decimation sums the delays it merges, so total duration is preserved.
- **Konva redraw:** only the image layer is redrawn per tick, not the sticker or UI layers.

## Security Considerations

- All processing happens client-side, and no files are uploaded to a server.
- Frame and file-size caps guard against decompression-bomb GIFs (huge logical screen size or thousands of frames). The system shall also reject logical screens larger than 2048×2048.

## Success Metrics

- A typical 2–4 s reaction GIF (≤ 2 MB) exports under 128 KB with the Slack preset in under 2 s.
- The exported file uploads to Slack as an animated emoji without errors (manual check).
- No regressions in existing unit and e2e suites.

## Open Questions

None. Resolved decisions:

1. Auto-fit trims the duration as its last ladder step.
2. Uploading a GIF in single-image mode switches to multi-image mode.
3. One animated GIF per composition in v1.
4. GIFs are emoji-only and are not available as stickers.
