# 02 Tasks - Smart Emoji Canvas

## Relevant Files

- `src/utils/presets.ts` - Defines the `PlatformPreset` TypeScript type and the `PLATFORM_PRESETS` array (Slack entry lives here).
- `src/utils/presets.test.ts` - Unit tests asserting each preset has correct field values.
- `src/utils/canvasDrawing.ts` - Pure functions for drawing onto a canvas context: `drawCheckerboard` and `drawSafeZone`.
- `src/utils/canvasDrawing.test.ts` - Unit tests for the drawing utility functions (mock canvas context).
- `src/utils/imageScaling.ts` - Pure function `computeContainRect` that calculates where to draw an image contained within the canvas.
- `src/utils/imageScaling.test.ts` - Unit tests for contain-scaling math (square, landscape, portrait cases).
- `src/hooks/useImageImport.ts` - Custom hook that handles file input, drag-and-drop, and clipboard paste; returns the current imported `HTMLImageElement | null`.
- `src/components/EmojiCanvas.tsx` - Main canvas component; uses a `useRef` for the 2D context, draws checkerboard + safe zone + imported image, attaches drag-and-drop listeners.
- `src/components/EmojiCanvas.test.tsx` - Unit tests verifying canvas renders with correct dimensions for the given preset.
- `src/components/PresetSelector.tsx` - Dropdown `<select>` component that renders one `<option>` per preset.
- `src/components/PresetSelector.test.tsx` - Unit tests verifying the dropdown renders all presets and fires `onChange`.
- `e2e/canvas.spec.ts` - Playwright E2E tests: canvas dimensions check, non-empty pixel data check, file upload check.
- `e2e/fixtures/test-emoji.png` - Small 32×32 solid-color PNG used as a file upload fixture in E2E tests.
- `src/App.tsx` - Wires `PresetSelector` and `EmojiCanvas` together with `useState` for the active preset.
- `src/App.test.tsx` - Updated app-level tests reflecting the new canvas layout.
- `src/App.css` - Layout styles (flexbox column, centered, gap between elements).

### Notes

- Unit tests are co-located with source files (e.g., `presets.ts` and `presets.test.ts` in the same directory).
- Run unit tests with `task test` and E2E tests with `task test:e2e`.
- Follow repository conventions: double quotes, semicolons, 2-space indent, trailing commas, 80-char line width (Prettier), strict TypeScript, no unused variables (ESLint).
- Verify work after each parent task with `task lint` and `task typecheck` before moving on.

---

## Tasks

### [x] 1.0 Platform Preset Configuration Module

#### 1.0 Proof Artifact(s)

- Test: `task test` output showing `src/utils/presets.test.ts` passes — demonstrates the Slack preset returns `{ id: "slack", width: 128, height: 128, safeZonePadding: 12 }` and that adding a new entry to the array is the only change needed to support a new platform.

#### 1.0 Tasks

- [x] 1.1 Create `src/utils/presets.ts` — define and export the `PlatformPreset` TypeScript interface with fields: `id: string`, `label: string`, `width: number`, `height: number`, `safeZonePadding: number`.
- [x] 1.2 In `src/utils/presets.ts`, create and export a `PLATFORM_PRESETS` array of type `PlatformPreset[]` containing one entry: `{ id: "slack", label: "Slack — 128×128", width: 128, height: 128, safeZonePadding: 12 }`.
- [x] 1.3 Create `src/utils/presets.test.ts` — write tests that assert: (a) `PLATFORM_PRESETS` has at least one entry, (b) the Slack entry has exactly `width: 128`, `height: 128`, `safeZonePadding: 12`, and (c) every entry in the array has all required fields defined.
- [x] 1.4 Run `task test` and confirm `presets.test.ts` passes with no errors.

---

### [~] 2.0 EmojiCanvas Component — Checkerboard & Safe Zone

#### 2.0 Proof Artifact(s)

- Screenshot: Browser showing the canvas centered on the page with a visible checkerboard background and dashed safe-zone guide inset 12 px from each edge — demonstrates the transparent surface and safe zone render correctly.
- Test: `task test` output showing `src/utils/canvasDrawing.test.ts` passes — demonstrates checkerboard and safe zone drawing logic is correct.
- E2E: `task test:e2e` output showing `e2e/canvas.spec.ts` passes — demonstrates the canvas element is present in the DOM with `width="128"` and `height="128"` and is rendering non-empty pixel data.

#### 2.0 Tasks

- [x] 2.1 Create `src/utils/canvasDrawing.ts` — write and export `drawCheckerboard(ctx: CanvasRenderingContext2D, width: number, height: number): void`. It should fill the canvas with 8×8 px alternating tiles using `#CCCCCC` and `#FFFFFF`.
- [x] 2.2 In `src/utils/canvasDrawing.ts`, write and export `drawSafeZone(ctx: CanvasRenderingContext2D, width: number, height: number, padding: number): void`. It should stroke a dashed rectangle inset by `padding` px from each edge, using a subtle color (e.g., `rgba(0, 120, 255, 0.5)`).
- [x] 2.3 Create `src/utils/canvasDrawing.test.ts` — write tests for both functions using a mocked `CanvasRenderingContext2D` object. Assert that `drawCheckerboard` calls `fillRect` and that `drawSafeZone` calls `strokeRect` with arguments that reflect the correct inset from the padding value.
- [x] 2.4 Create `src/components/PresetSelector.tsx` — a React component that accepts `presets: PlatformPreset[]`, `activePresetId: string`, and `onChange: (id: string) => void` as props. Render a `<select>` element with one `<option>` per preset, using `preset.id` as the value and `preset.label` as the display text.
- [x] 2.5 Create `src/components/PresetSelector.test.tsx` — write tests that: (a) render the component with the Slack preset and assert one `<option>` is in the DOM, and (b) simulate selecting an option and assert `onChange` is called with the correct preset id.
- [x] 2.6 Create `src/components/EmojiCanvas.tsx` — a React component that accepts `preset: PlatformPreset` as a prop. Render a `<div>` wrapper containing a `<canvas>` element. Use `useRef` to access the canvas's 2D context. In a `useEffect` (dependent on `preset`), clear the canvas then call `drawCheckerboard` and `drawSafeZone` using values from the preset.
- [x] 2.7 Create `src/components/EmojiCanvas.test.tsx` — write a test that renders `<EmojiCanvas preset={slackPreset} />` and asserts the `<canvas>` element has `width="128"` and `height="128"`.
- [x] 2.8 Create `e2e/canvas.spec.ts` — write a Playwright test that: (a) navigates to `http://localhost:5173`, (b) asserts a `<canvas>` element is visible with `width` attribute `"128"` and `height` attribute `"128"`, and (c) reads the canvas pixel data via `page.evaluate` and asserts it is not all zeros (checkerboard is rendering).
- [x] 2.9 Run `task test` and `task test:e2e` and confirm all tests pass.

---

### [ ] 3.0 Image Import — File Upload, Drag-and-Drop & Clipboard Paste

#### 3.0 Proof Artifact(s)

- Screenshot: Browser showing an imported image rendered on the canvas (fitted/contained, checkerboard visible in empty areas) after a file was uploaded via the file picker — demonstrates the full import-to-canvas flow.
- Test: `task test` output showing `src/utils/imageScaling.test.ts` passes with at least 3 aspect ratio cases — demonstrates contain-scaling math is correct.
- E2E: `task test:e2e` output showing the image upload test case in `e2e/canvas.spec.ts` passes — demonstrates pixel data changes after a PNG is uploaded.

#### 3.0 Tasks

- [ ] 3.1 Create `src/utils/imageScaling.ts` — write and export `computeContainRect(imageWidth: number, imageHeight: number, canvasWidth: number, canvasHeight: number): { x: number; y: number; width: number; height: number }`. The returned rect should fit entirely within the canvas, preserve the image's aspect ratio, and be centered.
- [ ] 3.2 Create `src/utils/imageScaling.test.ts` — write tests for at least 3 cases: (a) square image (128×128) into 128×128 canvas — rect fills the canvas exactly, (b) landscape image (256×128) into 128×128 canvas — rect width is 128 and height is 64, centered vertically, (c) portrait image (128×256) into 128×128 canvas — rect height is 128 and width is 64, centered horizontally.
- [ ] 3.3 Create `src/hooks/useImageImport.ts` — a custom React hook that manages a `HTMLImageElement | null` state. It should expose: (a) `handleFileInput(e: React.ChangeEvent<HTMLInputElement>)` for the file picker, (b) `handleDrop(e: React.DragEvent)` for drag-and-drop, (c) `handlePaste(e: ClipboardEvent)` for clipboard paste. Each handler should read an image file/blob, create an `HTMLImageElement`, wait for it to load, then set it in state. Ignore non-image types silently.
- [ ] 3.4 Update `src/components/EmojiCanvas.tsx` — import and call `useImageImport`; add a second `useEffect` (dependent on `preset` and the imported image) that redraws the canvas in order: clear → `drawCheckerboard` → `drawSafeZone` → draw image (using `computeContainRect` for positioning) if an image is present. Add `onDragOver` (prevent default) and `onDrop` handlers to the wrapper `<div>`.
- [ ] 3.5 In `src/components/EmojiCanvas.tsx`, add a `<input type="file" accept="image/*">` element below the canvas with an `onChange` handler wired to `handleFileInput`.
- [ ] 3.6 Add a small test fixture image at `e2e/fixtures/test-emoji.png` — create or copy any 32×32 solid-color PNG (it just needs to be a valid image file for the upload test).
- [ ] 3.7 Add a second test case to `e2e/canvas.spec.ts` — use `page.setInputFiles` to upload `e2e/fixtures/test-emoji.png` via the file input, wait for the canvas to update, then read pixel data and assert it has changed from the initial checkerboard-only state.
- [ ] 3.8 Run `task test` and `task test:e2e` and confirm all tests pass.

---

### [ ] 4.0 App Integration & Quality Gates

#### 4.0 Proof Artifact(s)

- Screenshot: Full browser view of the finished app — canvas centered, dropdown preset selector visible above it, file input visible below — demonstrates all components are wired together in `App.tsx`.
- CLI: `task lint` output showing 0 errors and 0 warnings — demonstrates no ESLint violations.
- CLI: `task typecheck` output showing no TypeScript errors — demonstrates strict-mode type safety.
- CLI: `task test` output showing all unit tests pass — demonstrates full unit test suite is green.
- CLI: `task test:e2e` output showing all E2E tests pass — demonstrates end-to-end flows work.

#### 4.0 Tasks

- [ ] 4.1 Update `src/App.tsx` — replace the existing placeholder heading and tagline with the full canvas UI. Use `useState<PlatformPreset>` initialized to the Slack preset. Render `<PresetSelector>` above `<EmojiCanvas>`, passing the active preset and an `onChange` handler that updates state.
- [ ] 4.2 Update `src/App.css` — add styles to center the app layout: a flex column container, horizontally centered, with a reasonable gap between the selector and the canvas.
- [ ] 4.3 Update `src/App.test.tsx` — update the existing tests to match the new App structure. At minimum, assert that a `<canvas>` element and a `<select>` element are present in the rendered output.
- [ ] 4.4 Run `task lint` — fix any ESLint errors or warnings until the output reports 0 errors and 0 warnings.
- [ ] 4.5 Run `task typecheck` — fix any TypeScript errors until the output is clean with no errors.
- [ ] 4.6 Run `task test` — confirm all unit tests pass.
- [ ] 4.7 Run `task test:e2e` — confirm all Playwright E2E tests pass.
