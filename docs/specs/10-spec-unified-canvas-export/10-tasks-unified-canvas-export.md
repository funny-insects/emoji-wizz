# 10 Tasks — Unified Canvas Export

## Relevant Files

- `src/utils/presets.ts` - Platform preset definitions (Slack, Discord, Apple). Preserved for export/analysis use but no longer drives canvas size.
- `src/utils/presets.test.ts` - Existing tests for presets.
- `src/components/EmojiCanvas.tsx` - Canvas rendering component. Hardcode to 512x512, remove safe zone overlay, remove dimension label, simplify displayScale.
- `src/components/EmojiCanvas.test.tsx` - Tests for EmojiCanvas component.
- `src/components/PresetSelector.tsx` - Preset selector tabs. Will be removed from the editing area.
- `src/components/PresetSelector.test.tsx` - Tests for PresetSelector. May need removal or update.
- `src/App.tsx` - Main app orchestrator. Remove PresetSelector usage, add export preset state, update handleAnalyze and handleDownload.
- `src/App.test.tsx` - App-level tests. Update to reflect removal of preset selector and addition of export dropdown.
- `src/components/ExportControls.tsx` - Export UI (format dropdown + download button). Add platform dropdown.
- `src/components/ExportControls.test.tsx` - Tests for ExportControls.
- `src/utils/exportUtils.ts` - Export logic (buildExportCanvas, exportStageAsBlob, buildFilename, checkFileSizeWarning). Add downscaling and platform-aware filename.
- `src/utils/exportUtils.test.ts` - Tests for export utilities. Add downscaling and filename tests.
- `src/utils/generateSuggestions.ts` - Suggestion generation. Update to work with scaled safe zone values.
- `src/utils/generateSuggestions.test.ts` - Tests for suggestion generation. Add scaled safe zone test cases.
- `src/components/OptimizerPanel.tsx` - Optimizer/analyzer panel UI. May need minor updates for export-format-aware preview.
- `src/components/OptimizerPanel.test.tsx` - Tests for OptimizerPanel.

### Notes

- Unit tests are colocated with source files (`*.test.ts` / `*.test.tsx`).
- Use `task test` to run Vitest, `task lint` for ESLint, `task typecheck` for TypeScript checks.
- Follow existing coding patterns (React functional components, Konva.js for canvas, Vitest + Testing Library for tests).
- Pre-commit hooks enforce linting and formatting automatically.

## Tasks

### [x] 1.0 Unified 512x512 Editing Canvas

Remove the preset-driven canvas sizing and make all editing happen at a fixed 512x512 resolution. Remove the PresetSelector from the UI, remove the dimension label above the canvas, remove the safe zone dashed border, and simplify display scale to always 1x.

#### 1.0 Proof Artifact(s)

- Screenshot: Editing canvas displays at 512x512 without preset selector tabs, dimension label, or safe zone dashed border demonstrates clean unified canvas
- Screenshot: Importing an image, placing stickers, and using brush tool all work correctly on the 512x512 canvas demonstrates no regression in editing functionality
- CLI: `task typecheck` passes demonstrates type safety after refactoring preset usage

#### 1.0 Tasks

- [x] 1.1 In `EmojiCanvas.tsx`, remove the `preset` prop destructuring of `width`, `height`, and `safeZonePadding`. Replace with constants: `const width = 512; const height = 512;`. Remove `safeZonePadding` usage entirely.
- [x] 1.2 In `EmojiCanvas.tsx`, remove the `displayScale` calculation (line 94: `const displayScale = width === 128 ? 4 : 1;`) and replace with `const displayScale = 1;`.
- [x] 1.3 In `EmojiCanvas.tsx`, remove the safe zone `<Rect>` overlay (lines 553–562) — the dashed pink border inside the `<Layer>` background layer.
- [x] 1.4 In `EmojiCanvas.tsx`, remove the dimension label from the JSX. Replace `<span className="section-label">Canvas — {width}×{height}px</span>` (lines 505–507) with just `<span className="section-label">Canvas</span>` or remove the label entirely per spec.
- [x] 1.5 In `EmojiCanvas.tsx`, update the `EmojiCanvasProps` interface: remove the `preset` prop since it is no longer needed. Keep all other props.
- [x] 1.6 In `App.tsx`, remove the `PresetSelector` import and its JSX usage (lines 8, 348–352). Remove `handlePresetChange` function (lines 259–270). Remove `activePreset` state for now (it will be replaced by an export-only preset in task 2.0).
- [x] 1.7 In `App.tsx`, update the `<EmojiCanvas>` call to no longer pass `preset={activePreset}`.
- [x] 1.8 In `App.tsx`, update `createStickerDescriptor` (lines 118–134) to use 512 instead of `activePreset.width` / `activePreset.height` for initial sticker positioning.
- [x] 1.9 Update `App.test.tsx`: remove the test "renders a select element for preset selection" since the preset selector is removed from the editing area. Verify the canvas render test still passes.
- [x] 1.10 Update `EmojiCanvas.test.tsx` to remove any references to the preset prop and update expectations for the 512x512 canvas.

### [x] 2.0 Export with Platform Format Dropdown and High-Quality Downscaling

Add a platform format dropdown (Slack 128x128, Discord 128x128, Apple 512x512) to the export controls area. Implement high-quality downscaling from 512x512 to 128x128 for Slack/Discord exports. Update filename generation to include platform name. Validate file size against platform limits.

#### 2.0 Proof Artifact(s)

- Screenshot: Export controls show platform dropdown (Slack/Discord/Apple) next to file format dropdown and download button demonstrates new export UI layout
- Screenshot: Downloaded Slack emoji is exactly 128x128 pixels and appears sharp demonstrates high-quality downscaling
- Test: `exportUtils.test.ts` passes — verifies downscaling produces correct dimensions and file size warning logic works with new flow demonstrates export correctness

#### 2.0 Tasks

- [x] 2.1 In `App.tsx`, add a new state for the selected export preset: `const [exportPreset, setExportPreset] = useState<PlatformPreset>(PLATFORM_PRESETS[0]!)`. This replaces the removed `activePreset` state from task 1.0.
- [x] 2.2 In `exportUtils.ts`, add a new function `downscaleCanvas(sourceCanvas: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement` that creates a target-size canvas using `imageSmoothingEnabled = true` and `imageSmoothingQuality = 'high'`, drawing the source onto the target. For 512→128 (4x reduction), implement two-step downscaling (512→256→128) for best quality.
- [x] 2.3 In `exportUtils.ts`, update `exportStageAsBlob` to accept an optional `targetPreset: PlatformPreset` parameter. After getting the 512x512 data URL from the stage, if `targetPreset.width < 512`, convert to a canvas, downscale using `downscaleCanvas`, and return a blob from the downscaled canvas.
- [x] 2.4 In `exportUtils.ts`, update `buildFilename` to accept an optional `platformId: string` parameter: `buildFilename(format, platformId?)`. When provided, the filename becomes `emoji-${platformId}-${date}.${format}` (e.g., `emoji-slack-2026-03-25.png`).
- [x] 2.5 In `ExportControls.tsx`, add a platform dropdown `<select>` before the file format dropdown. It should list all `PLATFORM_PRESETS` and call a new `onPresetChange` callback prop when changed. Update the props interface to accept `presets: PlatformPreset[]`, `activePresetId: string`, and `onPresetChange: (id: string) => void`.
- [x] 2.6 In `App.tsx`, update `handleDownload` to use `exportPreset` for downscaling. For the stage export path (stickers/frames present), pass `exportPreset` to `exportStageAsBlob`. For the image-only path, downscale the 512x512 canvas/snapshot to the export preset dimensions. Pass `exportPreset.id` to `buildFilename`. Use `exportPreset` for `checkFileSizeWarning`.
- [x] 2.7 In `App.tsx`, pass the new props to `<ExportControls>`: `presets={PLATFORM_PRESETS}`, `activePresetId={exportPreset.id}`, `onPresetChange` handler that sets `exportPreset`.
- [x] 2.8 In `exportUtils.test.ts`, add tests for `downscaleCanvas`: verify output dimensions match target, verify it handles same-size input (512→512 passthrough). Add test for `buildFilename` with platform ID.
- [x] 2.9 Update `ExportControls.test.tsx` to verify the platform dropdown renders with all three platform options.

### [x] 3.0 Analyzer with Export-Format-Aware Suggestions

Update the analyzer to work on the 512x512 canvas while generating suggestions relative to the selected export format's constraints. Scale safe zone padding proportionally (e.g., Slack 12px at 128 becomes 48px at 512). Show the emoji preview at the selected export format's resolution in the optimizer panel.

#### 3.0 Proof Artifact(s)

- Screenshot: Analyzer suggestions reference the selected export format constraints demonstrates format-aware analysis
- Test: `generateSuggestions.test.ts` passes — verifies suggestion generation uses correctly scaled safe zone values for each platform demonstrates correct constraint mapping

#### 3.0 Tasks

- [x] 3.1 In `generateSuggestions.ts`, update `generateSuggestions` to accept an optional `canvasSize` parameter (default 512). When `canvasSize` differs from `preset.width`, scale `safeZonePadding` proportionally: `scaledPadding = preset.safeZonePadding * (canvasSize / preset.width)`. Use `canvasSize` instead of `preset.width`/`preset.height` for the canvas boundary checks.
- [x] 3.2 In `App.tsx`, update `handleAnalyze` to pass `exportPreset` (instead of the old `activePreset`) to `generateSuggestions`, along with the canvas size (512). Update `getImageData` to use 512x512 dimensions.
- [x] 3.3 In `App.tsx`, update the analyzer's `customEmojiDataUrl` generation: after getting the 512x512 `stage.toDataURL()`, downscale it to the `exportPreset` dimensions for the preview image shown in the optimizer panel. Use `downscaleCanvas` from `exportUtils.ts`.
- [x] 3.4 In `generateSuggestions.test.ts`, add test cases that verify: (a) suggestions for a Slack preset with 512x512 canvas use scaled safe zone padding (48px instead of 12px), (b) suggestions for Apple preset with 512x512 canvas use original padding (40px), (c) existing tests still pass.

### [x] 4.0 Quality Gate — Lint, Typecheck, and Test Pass

Run all quality checks to ensure the full change set passes linting, type checking, and unit tests with no regressions.

#### 4.0 Proof Artifact(s)

- CLI: `task lint` passes with no errors demonstrates code quality
- CLI: `task typecheck` passes with no errors demonstrates type safety
- CLI: `task test` passes with no failures demonstrates no regressions

#### 4.0 Tasks

- [x] 4.1 Run `task lint` and fix any ESLint errors or warnings.
- [x] 4.2 Run `task typecheck` and fix any TypeScript errors.
- [x] 4.3 Run `task test` and fix any failing tests.
- [x] 4.4 Run `task format:check` and fix any formatting issues with `task format`.
