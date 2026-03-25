# 10-spec-unified-canvas-export

## Introduction/Overview

Currently, emoji-wizz ties the editing canvas size directly to the selected platform preset (128x128 for Slack/Discord, 512x512 for Apple). This causes a poor editing experience on smaller presets — images and stickers appear blurry at 128x128, making precise edits difficult. This feature decouples the editing canvas from the export resolution so that all editing happens at 512x512, and users choose their target platform only when downloading. The export step downscales to the target resolution with high-quality anti-aliasing.

## Goals

- Always render the editing canvas at 512x512 pixels for a crisp, high-fidelity editing experience regardless of export target
- Move platform selection from the editing phase to the export/download phase
- Downscale exports to 128x128 (Slack/Discord) or keep at 512x512 (Apple) with high-quality anti-aliasing
- Keep the analyzer functional, analyzing the 512x512 canvas and providing suggestions relative to the chosen export format
- Simplify the editing UI by removing the preset selector, dimension label, and safe zone overlay from the canvas area

## User Stories

- **As an emoji creator**, I want to edit my emoji at full 512x512 resolution so that I can see fine details and place stickers precisely without blurriness.
- **As an emoji creator**, I want to choose my target platform (Slack, Discord, Apple) when I download so that I don't have to think about resolution constraints while editing.
- **As an emoji creator**, I want my exported 128x128 emojis to look sharp and clean so that the downscaled result maintains quality from my high-resolution edits.
- **As an emoji creator**, I want the analyzer to still give me useful composition feedback relative to my chosen export format so that my emoji looks good on the target platform.

## Demoable Units of Work

### Unit 1: Unified 512x512 Editing Canvas

**Purpose:** Replace the preset-driven canvas sizing with a fixed 512x512 editing canvas, removing the preset selector and related UI elements from the editing area.

**Functional Requirements:**

- The system shall always render the editing canvas at 512x512 pixels regardless of export target
- The system shall display the canvas at 1x scale (no magnification) matching the current Apple preset display size
- The system shall remove the platform preset selector (PresetSelector component) from the top of the editing area
- The system shall remove the "CANVAS — NNNxNNNPX" dimension label from above the canvas
- The system shall remove the safe zone dashed border overlay from the editing canvas
- The system shall maintain all existing editing functionality (image import, brush, eraser, text, stickers, frames, background removal, undo/redo) at the 512x512 resolution

**Proof Artifacts:**

- Screenshot: Editing canvas displays at 512x512 without preset selector, dimension label, or safe zone overlay demonstrates clean unified canvas
- Screenshot: Stickers and brush strokes render crisply on the 512x512 canvas demonstrates improved editing fidelity
- Test: Existing editing tool tests pass at 512x512 resolution demonstrates no regression in editing functionality

### Unit 2: Export with Platform Format Dropdown

**Purpose:** Add a platform format dropdown to the export controls so users can choose their target platform at download time, with high-quality downscaling for smaller formats.

**Functional Requirements:**

- The system shall add a dropdown menu to the export controls area (next to the download button) with options: Slack (128x128), Discord (128x128), Apple (512x512)
- The system shall default the export format dropdown to a sensible default (e.g., Slack)
- The system shall downscale the 512x512 canvas to 128x128 when exporting for Slack or Discord using high-quality anti-aliasing (e.g., multi-step downscaling or `imageSmoothingQuality: 'high'`)
- The system shall export at full 512x512 when the Apple format is selected
- The system shall validate exported file size against the selected platform's limit (128 KB for Slack, 256 KB for Discord, 500 KB for Apple) and show a warning if exceeded
- The system shall generate the download filename reflecting the selected platform (e.g., `emoji-slack-2026-03-25.png`)

**Proof Artifacts:**

- Screenshot: Export controls area shows platform format dropdown next to the download button demonstrates new export UI
- Screenshot: Downloaded 128x128 Slack emoji appears sharp and clear (not blurry) demonstrates high-quality downscaling
- Test: Export at each platform format produces correctly sized output (128x128 or 512x512) demonstrates format-correct exports
- Test: File size warning triggers when export exceeds platform limit demonstrates size validation

### Unit 3: Analyzer with Export-Format-Aware Suggestions

**Purpose:** Update the analyzer to work on the 512x512 canvas while providing suggestions relative to the selected export format.

**Functional Requirements:**

- The system shall analyze the 512x512 canvas content (content bounds detection, fill ratio calculation)
- The system shall generate composition suggestions relative to the selected export format's safe zone and constraints (e.g., scaled safe zone padding for Slack at 512x512 is 48px)
- The system shall display the analyzed emoji preview at the selected export format's resolution in the optimizer panel
- The system shall use the selected export format from the dropdown to determine which platform constraints to apply

**Proof Artifacts:**

- Screenshot: Analyzer shows suggestions referencing the selected export format (e.g., "Content may be too small for Slack 128x128") demonstrates format-aware analysis
- Test: Suggestion generation uses scaled safe zone values appropriate to selected export format demonstrates correct constraint mapping

## Non-Goals (Out of Scope)

1. **Batch export to multiple formats at once**: Users export one format at a time via the dropdown
2. **User-configurable canvas resolution**: The editing canvas is fixed at 512x512; no option to change it
3. **Zoom/pan controls on the editing canvas**: The canvas displays at 1x; zoom functionality is not part of this feature
4. **Safe zone preview toggle**: Safe zone overlays are removed from editing; no toggle to show/hide them
5. **Custom export resolutions**: Only the three predefined platform formats are supported

## Design Considerations

- The export controls area currently has a format dropdown (PNG/GIF/WebP) and a download button. The new platform dropdown should sit alongside these controls in a logical grouping — platform format first, then file format, then download button.
- The platform dropdown should use styling consistent with the existing export format dropdown.
- Removing the preset selector, dimension label, and safe zone overlay will simplify the editing area. Ensure the visual balance of the page is maintained.

## Repository Standards

- Use `task lint`, `task typecheck`, and `task test` to verify changes
- Pre-commit hooks enforce linting and formatting — do not skip them
- Tests are colocated with source files (`*.test.ts` / `*.test.tsx`)
- Components live in `src/components/`, utilities in `src/utils/`, hooks in `src/hooks/`
- Follow existing Konva.js patterns in `EmojiCanvas.tsx` for canvas rendering changes
- Follow existing export patterns in `src/utils/exportUtils.ts` for export logic changes

## Technical Considerations

- **Canvas internals**: The `EmojiCanvas` component currently reads `width`, `height`, and `safeZonePadding` from the selected `PlatformPreset`. These will be hardcoded to 512x512 for editing. The `displayScale` calculation (currently 4x for 128px, 1x for 512px) should be simplified to always 1x.
- **Offscreen canvas**: The offscreen canvas used for image editing operations (`offscreenCanvasRef`) must also operate at 512x512.
- **High-quality downscaling**: Use `CanvasRenderingContext2D.imageSmoothingEnabled = true` and `imageSmoothingQuality = 'high'` when drawing the 512x512 content onto a 128x128 export canvas. Consider multi-step downscaling (512 -> 256 -> 128) for even better quality.
- **Export flow**: `buildExportCanvas` and `exportStageAsBlob` in `exportUtils.ts` need to accept the target platform dimensions and perform the downscale. The Konva stage is always 512x512, so `stage.toDataURL()` produces a 512x512 image that then needs to be scaled down.
- **Preset data model**: The `PlatformPreset` type and `PRESETS` array in `presets.ts` should be preserved — they are still needed for export constraints (dimensions, file size limits, safe zone padding for analysis). They just no longer drive the canvas size.
- **Analyzer**: `generateSuggestions` currently takes bounds and a preset. It should continue to work the same way, but the bounds come from the 512x512 canvas and the safe zone padding values need to be scaled proportionally (e.g., Slack's 12px at 128 -> 48px at 512).

## Security Considerations

No specific security considerations identified.

## Success Metrics

1. **Editing quality**: All editing (brush, stickers, text) renders at 512x512 with no blurriness at any export target
2. **Export accuracy**: Exported files match target platform dimensions exactly (128x128 or 512x512)
3. **Downscale quality**: 128x128 exports from 512x512 canvas appear visually sharp, comparable to or better than editing directly at 128x128
4. **No regression**: All existing tests continue to pass after the change
5. **Analyzer accuracy**: Analyzer suggestions remain relevant and correct for the selected export format

## Open Questions

No open questions at this time.
