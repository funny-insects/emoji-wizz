# 07-tasks-export

## Relevant Files

- `src/utils/exportUtils.ts` — New utility module with pure functions for building the offscreen export canvas, generating the filename, and checking file size against the preset limit.
- `src/utils/exportUtils.test.ts` — Unit tests for `exportUtils.ts`.
- `src/components/ExportControls.tsx` — New component: format selector dropdown, Download button, disabled state, and size warning display.
- `src/components/ExportControls.test.tsx` — Unit tests for `ExportControls.tsx`.
- `src/App.tsx` — Mount `ExportControls` below the canvas; add `handleDownload` and `sizeWarning` state.
- `src/App.test.tsx` — May need updates if App snapshot/render tests exist.
- `e2e/export.spec.ts` — New Playwright E2E tests for the full download flow and size warning.
- `e2e/fixtures/test-emoji.png` — Existing fixture; used by E2E tests for upload.

### Notes

- Unit tests are co-located next to source files (e.g., `exportUtils.ts` and `exportUtils.test.ts` in the same directory).
- Run unit tests with: `task test`
- Run E2E tests with: `task test:e2e`
- Canvas-dependent logic in unit tests should be mocked with `vi.fn()` — see `canvasDrawing.test.ts` for the pattern.
- `computeContainRect` from `src/utils/imageScaling.ts` must be reused (not duplicated) in the export canvas builder.
- All new code must pass `task lint` and `task typecheck` before committing — enforced by Husky pre-commit hook.

## Tasks

### [x] 1.0 Export Utility Module

Create `src/utils/exportUtils.ts` with all pure functions needed for the export pipeline, covered by unit tests. This is the foundation that all other tasks depend on.

#### 1.0 Proof Artifact(s)

- Test: `task test` passes with all tests in `src/utils/exportUtils.test.ts` green — demonstrates `buildExportCanvas`, `buildFilename`, and `checkFileSizeWarning` are correct in isolation.

#### 1.0 Tasks

- [x] 1.1 Create `src/utils/exportUtils.ts` and define the `ExportFormat` type as `'png' | 'gif' | 'webp'`.
- [x] 1.2 Implement `buildExportCanvas(image: HTMLImageElement, preset: PlatformPreset): HTMLCanvasElement`. Create an offscreen `HTMLCanvasElement` at `preset.width × preset.height`. Clear it to fully transparent (`clearRect`). Draw the image centred using `computeContainRect` from `imageScaling.ts` (reuse, don't duplicate). Return the canvas. Do not draw checkerboard or safe-zone guides.
- [x] 1.3 Implement `buildFilename(format: ExportFormat): string`. Return a string in the form `emoji-YYYY-MM-DD.<ext>` where the date comes from `new Date().toISOString().slice(0, 10)` and `<ext>` maps: `png → png`, `gif → gif`, `webp → webp`.
- [x] 1.4 Implement `checkFileSizeWarning(blobSizeBytes: number, preset: PlatformPreset): string | null`. Return a warning string like `"Warning: file is 154 KB, exceeds Slack's 128 KB limit"` when `blobSizeBytes > preset.maxFileSizeKb * 1024`. Return `null` when within the limit.
- [x] 1.5 Create `src/utils/exportUtils.test.ts`. Write unit tests covering:
  - `buildExportCanvas` creates a canvas with the correct dimensions matching the preset.
  - `buildExportCanvas` draws the image (verify `drawImage` was called on the context) — mock the canvas context with `vi.fn()`.
  - `buildFilename('png')` returns a string matching `/^emoji-\d{4}-\d{2}-\d{2}\.png$/`.
  - `buildFilename('gif')` returns a string ending in `.gif`.
  - `buildFilename('webp')` returns a string ending in `.webp`.
  - `checkFileSizeWarning` returns `null` when blob size is within the preset limit.
  - `checkFileSizeWarning` returns a non-null string containing the preset label and both sizes when the limit is exceeded.

---

### [x] 2.0 ExportControls Component

Create `src/components/ExportControls.tsx` — the format dropdown and Download button — with unit tests. Wire it into `App.tsx` so it renders below the canvas with the correct disabled state. The download logic comes in Task 3; for now `onDownload` is wired up but does nothing yet.

#### 2.0 Proof Artifact(s)

- Screenshot: App with no image loaded showing a disabled Download button and format dropdown below the canvas — demonstrates disabled state is correct.
- Screenshot: App with an image loaded showing an enabled Download button and format dropdown (PNG selected by default) — demonstrates enabled state and UI placement.
- Test: `task test` passes with all tests in `src/components/ExportControls.test.tsx` green — demonstrates component renders correctly and button enables/disables based on `image` prop.

#### 2.0 Tasks

- [x] 2.1 Create `src/components/ExportControls.tsx`. Define the props interface:
  ```ts
  interface ExportControlsProps {
    image: HTMLImageElement | null;
    preset: PlatformPreset;
    onDownload: (format: ExportFormat) => void;
    sizeWarning: string | null;
  }
  ```
- [x] 2.2 Render a `<select>` element inside the component with three `<option>` elements: `PNG` (value `"png"`, selected by default), `GIF` (value `"gif"`), `WebP` (value `"webp"`). Track the selected format in local state with `useState<ExportFormat>('png')`.
- [x] 2.3 Render a `"Download"` button. Set `disabled={image === null}`. On click, call `onDownload(selectedFormat)`.
- [x] 2.4 Below the button, conditionally render the `sizeWarning` string as a `<p>` element with a warning style (e.g., a CSS class `export-warning` with amber/orange colour) when `sizeWarning` is not null.
- [x] 2.5 Create `src/components/ExportControls.test.tsx`. Write unit tests covering:
  - Download button is `disabled` when `image` prop is `null`.
  - Download button is not `disabled` when `image` prop is an `HTMLImageElement`.
  - `onDownload` is called with `'png'` when Download is clicked with PNG selected.
  - `onDownload` is called with `'webp'` after the user changes the format select to WebP and clicks Download.
  - Warning `<p>` is not rendered when `sizeWarning` is `null`.
  - Warning `<p>` is rendered with the warning text when `sizeWarning` is a non-null string.
- [x] 2.6 Import `ExportControls` in `src/App.tsx`. Render it below `<EmojiCanvas>`, passing `image={image}`, `preset={activePreset}`, `onDownload={() => {}}` (placeholder), and `sizeWarning={null}` (placeholder). The placeholders will be replaced in Task 3.

---

### [~] 3.0 Download Pipeline & File Size Warning

Replace the placeholder props in `App.tsx` with a real `handleDownload` function that renders an offscreen canvas, encodes it to the selected format, checks the file size, updates the warning state, and triggers a browser download.

#### 3.0 Proof Artifact(s)

- Screenshot: Browser download bar/notification showing `emoji-YYYY-MM-DD.png` appearing after clicking Download — demonstrates the download is triggered with the correct filename.
- Screenshot: Warning message visible below the export controls after downloading an image that exceeds the preset limit — demonstrates file size warning works and download still completes.
- Test: `task test` passes (all unit tests remain green) — demonstrates no regressions.

#### 3.0 Tasks

- [x] 3.1 Add `sizeWarning` state to `App.tsx`: `const [sizeWarning, setSizeWarning] = useState<string | null>(null)`.
- [x] 3.2 Add `handleDownload(format: ExportFormat)` function in `App.tsx`. Inside it:
  - Return early if `image` is null (safety guard).
  - Call `buildExportCanvas(image, activePreset)` to get an offscreen canvas.
  - Call `canvas.toBlob(callback, mimeType)` where `mimeType` maps: `'png' → 'image/png'`, `'gif' → 'image/gif'`, `'webp' → 'image/webp'`.
- [x] 3.3 Inside the `toBlob` callback:
  - If `blob` is null (e.g., GIF not supported by browser), call `setSizeWarning('Export failed: this format is not supported by your browser.')` and return.
  - Call `checkFileSizeWarning(blob.size, activePreset)` and pass the result to `setSizeWarning`.
  - Create a temporary `<a>` element: set `href = URL.createObjectURL(blob)` and `download = buildFilename(format)`. Append it to `document.body`, call `.click()`, then remove it and call `URL.revokeObjectURL(href)`.
- [x] 3.4 Replace the `onDownload={() => {}}` placeholder in `App.tsx` with `onDownload={handleDownload}`.
- [x] 3.5 Replace the `sizeWarning={null}` placeholder in `App.tsx` with `sizeWarning={sizeWarning}`.
- [x] 3.6 Reset `sizeWarning` to `null` when the active preset changes (add `setSizeWarning(null)` inside `handlePresetChange` after `setActivePreset`).

---

### [ ] 4.0 E2E Tests

Add Playwright tests in `e2e/export.spec.ts` covering the full export flow: upload an image, click Download, verify the download is triggered with the correct filename, and verify the size warning appears when appropriate.

#### 4.0 Proof Artifact(s)

- Test: `task test:e2e` passes with all new tests in `e2e/export.spec.ts` green — demonstrates the end-to-end download flow works in a real browser.

#### 4.0 Tasks

- [ ] 4.1 Create `e2e/export.spec.ts`. Add the standard imports and `__dirname` path helper matching the pattern in `canvas.spec.ts`.
- [ ] 4.2 Write test: **"Download button is disabled before image upload"**. Navigate to `/`. Assert the Download button (`page.getByRole('button', { name: 'Download' })`) has the `disabled` attribute.
- [ ] 4.3 Write test: **"Download button is enabled after image upload"**. Navigate to `/`. Upload `e2e/fixtures/test-emoji.png` via `page.locator('input[type="file"]').setInputFiles(fixturePath)`. Assert the Download button does not have the `disabled` attribute.
- [ ] 4.4 Write test: **"clicking Download PNG triggers a file download with correct filename"**. Navigate to `/`, upload the test fixture. Start waiting for the download event with `page.waitForEvent('download')`, then click the Download button. Assert `download.suggestedFilename()` matches `/^emoji-\d{4}-\d{2}-\d{2}\.png$/`.
- [ ] 4.5 Write test: **"clicking Download WebP triggers a file download with .webp extension"**. Navigate to `/`, upload the fixture, select `webp` in the format dropdown. Start waiting for the download event, click Download. Assert `download.suggestedFilename()` ends with `.webp`.
- [ ] 4.6 Write test: **"no size warning is shown after a normal download"**. Navigate to `/`, upload the test fixture (it should be small enough for the Slack 128 KB limit). Click Download. Assert there is no element matching `.export-warning` visible on the page, or that it contains no text.
