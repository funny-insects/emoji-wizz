# 12-tasks-dark-light-contrast-preview

## Relevant Files

- `src/components/OptimizerPanel.tsx` - Main component to modify: replace Yours/Reference comparison with Dark/Light previews
- `src/components/OptimizerPanel.test.tsx` - Update tests to reflect new Dark/Light preview rendering and removed `referenceEmojiSrc` prop
- `src/utils/detectContrastIssues.ts` - New utility: edge-pixel sampling and contrast detection against dark/light backgrounds
- `src/utils/detectContrastIssues.test.ts` - Unit tests for contrast detection logic
- `src/utils/detectContentBounds.ts` - Existing utility providing `ContentBounds` used to locate edge pixels
- `src/utils/generateSuggestions.ts` - Existing suggestion generator (contrast suggestions will be merged alongside these)
- `src/App.tsx` - Wire contrast detection into `handleAnalyze`, remove `referenceEmojiSrc` prop passing
- `src/App.css` - Add `.emoji-frame-dark` and `.emoji-frame-light` background styles

### Notes

- Unit tests should be placed alongside source files (e.g., `detectContrastIssues.test.ts` next to `detectContrastIssues.ts`)
- Use `task lint`, `task typecheck`, and `task test` to verify changes
- Follow existing component and utility patterns in the codebase
- Pre-commit hooks enforce linting and formatting automatically

## Tasks

### [x] 1.0 Replace Yours/Reference previews with Dark/Light background previews

#### 1.0 Proof Artifact(s)

- Screenshot: Analyzer showing the user's emoji on dark (#1a1a1a) and light (#ffffff) backgrounds side by side with "Dark" and "Light" labels demonstrates the preview replacement works
- Screenshot: Previews appear only after clicking Analyze demonstrates conditional rendering is preserved
- Test: `OptimizerPanel.test.tsx` passes with updated rendering expectations demonstrates component correctness

#### 1.0 Tasks

- [x] 1.1 In `src/App.css`, add two new CSS classes: `.emoji-frame-dark` with `background: #1a1a1a` and `.emoji-frame-light` with `background: #ffffff`. These extend the existing `.emoji-frame` styling (keep `.emoji-frame` as the base with shared sizing/border, apply the new classes alongside it for background color).
- [x] 1.2 In `src/components/OptimizerPanel.tsx`, remove the `referenceEmojiSrc` prop from the `OptimizerPanelProps` interface and the function destructuring. Replace the two `.emoji-figure` blocks (lines 66-87) so that both figures render the user's `customEmojiDataUrl` image: the first with className `emoji-frame emoji-frame-dark` and label "Dark", the second with className `emoji-frame emoji-frame-light` and label "Light".
- [x] 1.3 In `src/components/OptimizerPanel.test.tsx`, remove `referenceEmojiSrc` from `baseProps`. Update or add a test that renders with `suggestions={[]}` and `customEmojiDataUrl="data:image/png;base64,test"` and asserts that two `img` elements are present, both with the same `src` value.

### [x] 2.0 Implement edge-pixel contrast detection utility

#### 2.0 Proof Artifact(s)

- Test: `detectContrastIssues.test.ts` passes demonstrates edge pixel sampling and contrast detection logic works correctly for light-on-light, dark-on-dark, and well-contrasted emojis

#### 2.0 Tasks

- [x] 2.1 Create `src/utils/detectContrastIssues.ts`. Export a function `detectContrastIssues(imageData: ImageData, bounds: ContentBounds): string[]`. Import `ContentBounds` from `./detectContentBounds`.
- [x] 2.2 Implement edge pixel sampling inside `detectContrastIssues`: walk the perimeter of the content bounding box (top edge, bottom edge, left edge, right edge) using the `bounds` parameter. For each perimeter pixel, read its RGBA values from `imageData.data`. Skip fully transparent pixels (alpha === 0).
- [x] 2.3 Implement contrast comparison: define the dark background as `{r: 26, g: 26, b: 26}` (#1a1a1a) and light background as `{r: 255, g: 255, b: 255}` (#ffffff). For each non-transparent edge pixel, compute the Euclidean RGB distance to each background color: `sqrt((r1-r2)^2 + (g1-g2)^2 + (b1-b2)^2)`. Use a threshold of ~55 (moderate sensitivity). Track a count of "too close" pixels for each background.
- [x] 2.4 Implement the decision logic: if a significant proportion (e.g., >25%) of non-transparent edge pixels are too close to the dark background, push `"Your emoji may be hard to see on dark backgrounds"` to the results array. Apply the same logic for light backgrounds with `"Your emoji may be hard to see on light backgrounds"`. Return the results array (empty if no issues).
- [x] 2.5 Create `src/utils/detectContrastIssues.test.ts` with tests for: (a) a nearly white emoji on a 4x4 ImageData triggers the "hard to see on light backgrounds" warning, (b) a nearly black emoji triggers the "hard to see on dark backgrounds" warning, (c) a bright red/green emoji triggers no warnings, (d) a fully transparent image returns no warnings. Use a helper similar to `makeImageData` from `detectContentBounds.test.ts` to create test fixtures.

### [x] 3.0 Integrate contrast warnings into the suggestion flow

#### 3.0 Proof Artifact(s)

- Screenshot: A light-colored emoji triggers a "hard to see on light backgrounds" warning in the suggestion list demonstrates light-mode contrast detection end-to-end
- Screenshot: A dark-colored emoji triggers a "hard to see on dark backgrounds" warning demonstrates dark-mode contrast detection end-to-end
- Screenshot: A well-contrasted emoji shows no contrast warnings demonstrates false-positive avoidance
- CLI: `task lint && task typecheck && task test` all pass demonstrates no regressions

#### 3.0 Tasks

- [x] 3.1 In `src/App.tsx`, import `detectContrastIssues` from `./utils/detectContrastIssues`.
- [x] 3.2 In the `handleAnalyze` function, after calling `detectContentBounds` and `generateSuggestions`, call `detectContrastIssues(imageData, bounds)` when bounds is not null. Merge the returned contrast suggestions into the suggestions array using spread or concat (e.g., `setSuggestions([...generateSuggestions(bounds, exportPreset, CANVAS_SIZE), ...detectContrastIssues(imageData, bounds)])`).
- [x] 3.3 Run `task lint && task typecheck && task test` to verify no regressions and all tests pass.

### [x] 4.0 Clean up removed reference emoji prop and verify full integration

#### 4.0 Proof Artifact(s)

- CLI: `task lint && task typecheck && task test` all pass demonstrates clean removal with no regressions
- Screenshot: Full analyze flow working end-to-end with dark/light previews and contrast suggestions demonstrates complete feature integration

#### 4.0 Tasks

- [x] 4.1 In `src/App.tsx`, remove the `import referenceEmojiPng from "./assets/reference-emoji.png"` statement (line 31) and remove the `referenceEmojiSrc={referenceEmojiPng}` prop from the `<OptimizerPanel>` JSX (line 463).
- [x] 4.2 Verify no other files reference `referenceEmojiPng` or `referenceEmojiSrc` in source code (excluding docs/specs). If the reference emoji asset (`src/assets/reference-emoji.png`) is no longer used anywhere, delete it.
- [x] 4.3 Run `task lint && task typecheck && task test` to confirm everything passes cleanly with no dead code or broken references.
