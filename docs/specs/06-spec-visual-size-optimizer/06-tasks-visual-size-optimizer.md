# 06 Tasks - Visual Size Optimizer

## Relevant Files

- `src/utils/detectContentBounds.ts` - New utility: pixel-scan function that returns the bounding box of non-transparent content.
- `src/utils/detectContentBounds.test.ts` - Unit tests for `detectContentBounds`.
- `src/utils/generateSuggestions.ts` - New utility: rules engine that converts detected bounds into suggestion strings.
- `src/utils/generateSuggestions.test.ts` - Unit tests for `generateSuggestions`.
- `src/utils/presets.ts` - Read-only: `PlatformPreset` type is imported by `generateSuggestions`.
- `src/components/OptimizerPanel.tsx` - New component: Analyze button + suggestions list + side-by-side comparison.
- `src/components/OptimizerPanel.test.tsx` - Unit tests for `OptimizerPanel`.
- `src/components/EmojiCanvas.tsx` - Modify: accept an optional `stageRef` prop and forward it to the Konva `<Stage>`.
- `src/components/EmojiCanvas.test.tsx` - No changes required (existing tests pass no stageRef; prop is optional).
- `src/App.tsx` - Modify: create `stageRef`, implement `handleAnalyze`, hold analysis state, render `OptimizerPanel`.
- `src/assets/reference-emoji.png` - New static asset: bundled yellow smiley face PNG (freely licensed).
- `docs/specs/06-spec-visual-size-optimizer/06-proofs/analyze-result.png` - Screenshot proof artifact collected during Task 4.

### Notes

- Run tests with `task test`. Run lint with `task lint`. Run type-checking with `task typecheck`.
- Test files are co-located alongside source files (e.g., `detectContentBounds.ts` and `detectContentBounds.test.ts` in the same directory).
- `ImageData` is available in the jsdom test environment — you can construct synthetic pixel arrays using `new ImageData(new Uint8ClampedArray([...]), width, height)`.
- The reference emoji PNG must have a permissive license (e.g., Twemoji Apache 2.0). Verify the license before committing the file.

---

## Tasks

### [x] 1.0 Bounds Detection Utility

#### 1.0 Proof Artifact(s)

- Test: `src/utils/detectContentBounds.test.ts` passes all assertions — demonstrates correct bounding-box detection for fully opaque, padded, and fully transparent inputs

#### 1.0 Tasks

- [x] 1.1 Create `src/utils/detectContentBounds.ts` and export a `ContentBounds` interface: `{ x: number; y: number; width: number; height: number }`.
- [x] 1.2 In the same file, implement and export `detectContentBounds(imageData: ImageData): ContentBounds | null`. Iterate over the RGBA pixel array (4 bytes per pixel; alpha is at index `i + 3`). Track `minX`, `minY`, `maxX`, `maxY` across all pixels where `alpha > 0`. Return `null` if no non-transparent pixel is found; otherwise return `{ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }`.
- [x] 1.3 Create `src/utils/detectContentBounds.test.ts`. Write a helper `makeImageData(width, height, fillFn)` that builds an `ImageData` by calling `fillFn(x, y)` to get each pixel's `[r, g, b, a]` tuple.
- [x] 1.4 Add a test: a 4×4 fully opaque image (all pixels alpha = 255) → bounds equal `{ x: 0, y: 0, width: 4, height: 4 }`.
- [x] 1.5 Add a test: a 4×4 image with 1 pixel of transparent padding on every side (only the center 2×2 pixels have alpha > 0) → bounds equal `{ x: 1, y: 1, width: 2, height: 2 }`.
- [x] 1.6 Add a test: a 4×4 fully transparent image (all alpha = 0) → returns `null`.
- [x] 1.7 Run `task test` and confirm all three new tests pass with no errors.

---

### [x] 2.0 Suggestion Engine Utility

#### 2.0 Proof Artifact(s)

- Test: `src/utils/generateSuggestions.test.ts` passes all assertions — demonstrates all three suggestion rules (content too small, excess padding, no suggestions) fire correctly

#### 2.0 Tasks

- [ ] 2.1 Create `src/utils/generateSuggestions.ts`. At the top, declare and export `const MIN_FILL_RATIO = 0.6` — this is the threshold below which content is considered too small.
- [ ] 2.2 Implement and export `generateSuggestions(bounds: ContentBounds, preset: PlatformPreset): string[]`. Import `ContentBounds` from `./detectContentBounds` and `PlatformPreset` from `./presets`.
- [ ] 2.3 Inside `generateSuggestions`, add the **trim-padding rule**: if `bounds.x > 0 || bounds.y > 0 || bounds.width < preset.width || bounds.height < preset.height`, push `"Trim transparent padding"` into the results array.
- [ ] 2.4 Inside `generateSuggestions`, add the **fill-ratio rule**: compute the safe zone area as `safeW * safeH` where `safeW = preset.width - 2 * preset.safeZonePadding` and `safeH = preset.height - 2 * preset.safeZonePadding`. Compute the content area as `bounds.width * bounds.height`. If `contentArea / safeZoneArea < MIN_FILL_RATIO`, compute `pct = Math.round((safeZoneArea / contentArea - 1) * 100)` and push `\`Increase content size by ~${pct}%\`` into the results array.
- [ ] 2.5 Return the results array (may be empty).
- [ ] 2.6 Create `src/utils/generateSuggestions.test.ts`. Import `generateSuggestions` and `PLATFORM_PRESETS` (use the Slack preset for all tests).
- [ ] 2.7 Add a test: bounds that are smaller than the canvas (`{ x: 10, y: 10, width: 108, height: 108 }` on a 128×128 canvas) → result array includes `"Trim transparent padding"`.
- [ ] 2.8 Add a test: bounds equal to the full canvas (`{ x: 0, y: 0, width: 128, height: 128 }`) but content area is small (e.g., `{ x: 0, y: 0, width: 20, height: 20 }`) → result array includes a string matching `/Increase content size by ~\d+%/`.
- [ ] 2.9 Add a test: bounds that fill the safe zone well — content occupies more than 60% of the safe zone and equals the canvas size → result array is empty.
- [ ] 2.10 Run `task test` and confirm all new tests pass with no errors.

---

### [ ] 3.0 OptimizerPanel Component

#### 3.0 Proof Artifact(s)

- Test: `src/components/OptimizerPanel.test.tsx` passes — demonstrates the "Analyze" button is disabled with no image, enabled with an image, and that the results panel only appears after analysis runs

#### 3.0 Tasks

- [ ] 3.1 Create `src/components/OptimizerPanel.tsx`. Define and export a `OptimizerPanelProps` interface with these fields:
  - `hasImage: boolean` — controls whether the Analyze button is enabled
  - `onAnalyze: () => void` — callback invoked when the button is clicked
  - `suggestions: string[] | null` — `null` means no analysis has been run yet; an array (including empty) means analysis has completed
  - `customEmojiDataUrl: string | null` — data URL of the user's emoji for the comparison row
  - `referenceEmojiSrc: string` — path/URL of the bundled reference emoji
- [ ] 3.2 Implement the `OptimizerPanel` component. Render an `<button>` labelled "Analyze" with `disabled={!hasImage}`.
- [ ] 3.3 Render a results section **only when `suggestions !== null`**. Inside it: if `suggestions.length === 0`, render a `<p>` with text "Looks good!"; otherwise render a `<ul>` with one `<li>` per suggestion string.
- [ ] 3.4 Inside the same results section, render a side-by-side comparison row: a `<div>` containing two `<figure>` elements. First figure: `<img src={customEmojiDataUrl ?? ""}` at 64×64 with a `<figcaption>` of "Your emoji". Second figure: `<img src={referenceEmojiSrc}` at 64×64 with a `<figcaption>` of "Reference".
- [ ] 3.5 Create `src/components/OptimizerPanel.test.tsx`. Import `OptimizerPanel` and `@testing-library/react`.
- [ ] 3.6 Add a test: render with `hasImage={false}` — assert the "Analyze" button is disabled (`expect(button).toBeDisabled()`).
- [ ] 3.7 Add a test: render with `hasImage={true}` — assert the "Analyze" button is not disabled.
- [ ] 3.8 Add a test: render with `suggestions={null}` — assert the results section is not present in the DOM (query for "Looks good!" or a `<ul>` returns null).
- [ ] 3.9 Add a test: render with `suggestions={[]}` — assert the text "Looks good!" is visible.
- [ ] 3.10 Add a test: render with `suggestions={["Trim transparent padding"]}` — assert the text "Trim transparent padding" appears in a list item.
- [ ] 3.11 Run `task test` and confirm all new tests pass.

---

### [ ] 4.0 App Integration & Quality Gates

#### 4.0 Proof Artifact(s)

- Screenshot: `docs/specs/06-spec-visual-size-optimizer/06-proofs/analyze-result.png` — App UI showing "Analyze" button, results panel with at least one suggestion, and the side-by-side emoji comparison after running analysis on a test image
- CLI: `task test` output showing all tests passing — demonstrates no regressions introduced
- CLI: `task lint` and `task typecheck` output showing zero warnings or errors — demonstrates code quality gates pass

#### 4.0 Tasks

- [ ] 4.1 Source a freely licensed 128×128 yellow smiley face PNG. The Twemoji set (Apache 2.0) is a good source — the file for U+1F642 (slightly smiling face) works well. Save it to `src/assets/reference-emoji.png`. Verify the license before committing.
- [ ] 4.2 In `src/components/EmojiCanvas.tsx`, add an optional `stageRef?: React.RefObject<Konva.Stage | null>` field to the `EmojiCanvasProps` interface. Pass it to the `<Stage ref={stageRef}>` element. Existing tests do not pass a `stageRef` and will continue to pass since the prop is optional.
- [ ] 4.3 In `src/App.tsx`, add `import Konva from "konva"` and create a stage ref: `const stageRef = useRef<Konva.Stage | null>(null)`. Pass `stageRef={stageRef}` to `<EmojiCanvas>`.
- [ ] 4.4 In `src/App.tsx`, add state for analysis results: `const [suggestions, setSuggestions] = useState<string[] | null>(null)` and `const [customEmojiDataUrl, setCustomEmojiDataUrl] = useState<string | null>(null)`.
- [ ] 4.5 In `src/App.tsx`, implement a `handleAnalyze` function. Inside it: (1) guard-return if `stageRef.current` is null; (2) call `stageRef.current.toDataURL()` and save the result to `customEmojiDataUrl` state; (3) call `stageRef.current.toCanvas()` to get a native `HTMLCanvasElement`, then `.getContext("2d")!.getImageData(0, 0, preset.width, preset.height)` to get pixel data; (4) call `detectContentBounds(imageData)` — if it returns `null`, call `setSuggestions([])` and return; (5) call `generateSuggestions(bounds, activePreset)` and call `setSuggestions` with the result.
- [ ] 4.6 In `src/App.tsx`, import `OptimizerPanel` and `referenceEmojiPng` (via `import referenceEmojiPng from "./assets/reference-emoji.png"`). Render `<OptimizerPanel>` below `<EmojiCanvas>`, passing `hasImage={image !== null}`, `onAnalyze={handleAnalyze}`, `suggestions={suggestions}`, `customEmojiDataUrl={customEmojiDataUrl}`, and `referenceEmojiSrc={referenceEmojiPng}`.
- [ ] 4.7 Run `task typecheck` and fix any TypeScript errors before proceeding.
- [ ] 4.8 Run `task lint` and fix any ESLint warnings or errors before proceeding.
- [ ] 4.9 Run `task test` and confirm all tests (old and new) pass with no failures.
- [ ] 4.10 Load the app in a browser, import a test image, click "Analyze", and take a screenshot of the results panel showing at least one suggestion and the side-by-side comparison. Save the screenshot to `docs/specs/06-spec-visual-size-optimizer/06-proofs/analyze-result.png` (create the `06-proofs/` directory first).
