# Task 2.0 Proofs — Export with Platform Format Dropdown and High-Quality Downscaling

## Summary

Implemented platform export preset selection, high-quality two-step downscaling (512→256→128),
platform-aware filename generation, and updated ExportControls UI with a platform dropdown.

---

## CLI Output

### TypeScript type check

```
task: [typecheck] npx tsc --noEmit
(no output — clean pass)
```

### ESLint

```
task: [lint] npx eslint src/
(no output — clean pass)
```

### Test suite

```
task: [test] npx vitest run

 RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

 Test Files  16 passed (16)
       Tests  115 passed (115)
    Start at  10:12:48
    Duration  2.30s (transform 572ms, setup 664ms, import 1.20s, tests 2.33s, environment 6.72s)
```

---

## Test Results

### New tests added in `exportUtils.test.ts`

**`buildFilename` with platform ID:**

- `buildFilename("png", "slack")` → matches `/^emoji-slack-\d{4}-\d{2}-\d{2}\.png$/` ✅
- `buildFilename("webp", "discord")` → matches `/^emoji-discord-\d{4}-\d{2}-\d{2}\.webp$/` ✅

**`downscaleCanvas`:**

- Same-size passthrough (512→512) returns original canvas object ✅
- Simple downscale (256→128) sets correct target dimensions ✅
- 4x reduction (512→128) creates two canvases: mid at 256×256, final at 128×128 ✅

### New tests added in `ExportControls.test.tsx`

- Platform dropdown renders all three options: `slack`, `discord`, `apple` ✅
- `onPresetChange` is called with the new preset ID when platform dropdown changes ✅
- All existing download/warning tests updated to pass new required props ✅

---

## Implementation Summary

### `src/utils/exportUtils.ts`

- **`buildFilename(format, platformId?)`**: When `platformId` provided, filename is `emoji-${platformId}-${date}.${format}`.
- **`downscaleCanvas(source, targetWidth, targetHeight)`**: Returns source unchanged if dimensions match. For 4x reduction (source ≥ target×4), uses two-step downscaling: source→mid (half)→target. Otherwise single step. Both steps use `imageSmoothingEnabled = true` and `imageSmoothingQuality = "high"`.
- **`exportStageAsBlob(stage, targetPreset?)`**: If `targetPreset.width < 512`, converts the 512×512 dataURL to a canvas, downscales via `downscaleCanvas`, returns blob from downscaled canvas.

### `src/components/ExportControls.tsx`

- Added platform `<select>` before the format `<select>` with `aria-label="Platform"`.
- New props: `presets: PlatformPreset[]`, `activePresetId: string`, `onPresetChange: (id: string) => void`.
- Format select retains `aria-label="Format"` for distinguishable query in tests.

### `src/App.tsx`

- Added `exportPreset` state (`useState<PlatformPreset>(PLATFORM_PRESETS[0]!)`).
- Imported `downscaleCanvas` from exportUtils and `PlatformPreset` from presets.
- `triggerDownload`: uses `exportPreset` for `checkFileSizeWarning` and `buildFilename(..., exportPreset.id)`.
- `handleDownload`: stage path passes `exportPreset` to `exportStageAsBlob`; snapshot path downscales 512×512 canvas to `exportPreset` dimensions before triggering download.
- `<ExportControls>` receives `presets`, `activePresetId`, and `onPresetChange` handler.

---

## Verification

All proof artifact requirements met:

| Requirement                                          | Status                                           |
| ---------------------------------------------------- | ------------------------------------------------ |
| Platform dropdown shows Slack/Discord/Apple          | ✅ Verified by ExportControls test               |
| High-quality downscaling produces correct dimensions | ✅ Verified by downscaleCanvas tests             |
| Two-step downscaling for 4x reduction                | ✅ Verified by downscaleCanvas test              |
| Platform ID included in filename                     | ✅ Verified by buildFilename tests               |
| File size warning uses selected preset               | ✅ Implemented in triggerDownload/handleDownload |
| `task typecheck` passes                              | ✅                                               |
| `task lint` passes                                   | ✅                                               |
| `task test` passes (115 tests)                       | ✅                                               |
