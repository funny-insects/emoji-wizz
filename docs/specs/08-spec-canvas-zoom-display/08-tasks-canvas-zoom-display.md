# 08-tasks-canvas-zoom-display

## Relevant Files

- `src/components/EmojiCanvas.tsx` - Core canvas component; add zoom state, wrapper divs, CSS transform scaling, wheel handler, and pixelated rendering.
- `src/components/EmojiCanvas.test.tsx` - Unit tests for EmojiCanvas; add tests for zoom wrapper, default zoom per preset, scroll-wheel zoom, and tool accuracy.
- `src/utils/presets.ts` - Preset definitions; referenced for width-based zoom default logic (no modification needed).
- `src/App.tsx` - Parent component; passes preset to EmojiCanvas. May need minor adjustments if zoom state is lifted (likely not needed).
- `src/App.css` - Global styles; add `image-rendering: pixelated` rule for canvas elements inside the scaled container.

### Notes

- Unit tests are colocated with source files (`*.test.tsx`) using Vitest.
- Run `task lint`, `task typecheck`, and `task test` to verify changes.
- Pre-commit hooks enforce linting and formatting — do not skip them.
- Follow existing patterns: React functional components with hooks, strict TypeScript (no `any`).

## Tasks

### [x] 1.0 Scaled Canvas Display

Wrap the Konva Stage in a CSS-scaled container so the 128×128 canvas displays at 512×512 (4x) by default for Slack/Discord presets, while the Apple 512×512 preset remains at 1x. The card/container grows naturally to fit. Canvas renders with `image-rendering: pixelated` for crisp pixel blocks.

#### 1.0 Proof Artifact(s)

- Screenshot: Canvas displayed at 512×512 with a 128×128 Slack preset loaded demonstrates the 4x scale is applied
- Screenshot: Canvas displayed at 512×512 with pixel grid clearly visible demonstrates pixelated rendering
- Screenshot: Apple preset loaded shows canvas at native 512×512 with no additional scaling
- CLI: `task typecheck` passes demonstrates type safety of new zoom state and wrapper props

#### 1.0 Tasks

- [x] 1.1 Add a `zoom` state variable to `EmojiCanvas` with a default value derived from the preset: `preset.width === 128 ? 4 : 1`. Reset zoom to the preset default whenever `preset` changes (use an effect or derived-state pattern).
- [x] 1.2 Wrap the `<Stage>` element in two new divs inside the existing `canvas-drop-zone` div: an **outer sizing div** with explicit `width: ${width * zoom}px; height: ${height * zoom}px` (reserves layout space), and an **inner transform div** with `transform: scale(${zoom}); transform-origin: top left` (visually scales the stage).
- [x] 1.3 Move the text `<input>` overlay inside the inner transform div (so it inherits the CSS scale transform and positions correctly without coordinate math). Verify the input still appears at the click position.
- [x] 1.4 Add `image-rendering: pixelated` CSS to the `<canvas>` elements inside `.konvajs-content` (add a CSS rule in `App.css` targeting `.konvajs-content canvas`). This suppresses browser interpolation and shows crisp pixel blocks.
- [x] 1.5 Verify the outer card/container grows naturally to accommodate the 512×512 displayed canvas. Adjust any max-width constraints if needed.

### [x] 2.0 Scroll Wheel Zoom

Add scroll-wheel zoom on the canvas container. Each scroll step adjusts zoom by 0.5, clamped between 1x and 8x. The outer sizing div updates reactively so layout reflows. Zoom resets to preset default on preset switch.

#### 2.0 Proof Artifact(s)

- Screenshot series: Canvas at 2x, 4x, and 6x zoom demonstrates scroll wheel zoom works across the range
- Screenshot: Zoom clamped at 1x (minimum) when scrolling down past the limit demonstrates clamping works
- CLI: `task typecheck` passes demonstrates type safety of zoom event handling

#### 2.0 Tasks

- [x] 2.1 Add an `onWheel` handler to the outer sizing div that calls `e.preventDefault()` and adjusts `zoom` by `+0.5` (scroll up / negative deltaY) or `-0.5` (scroll down / positive deltaY).
- [x] 2.2 Clamp the zoom value to a minimum of `1` and a maximum of `8` inside the wheel handler.
- [x] 2.3 Verify the outer sizing div's width/height update reactively when zoom changes (already handled if width/height are computed from `zoom` state in task 1.2).
- [x] 2.4 Confirm zoom resets to the preset default when the user switches presets (already handled if the reset logic from task 1.1 works correctly). Test by switching between Slack and Apple presets.

### [x] 3.0 Tool Accuracy at All Zoom Levels

Verify and fix brush, eraser, and text tools so they place marks at the correct canvas pixel regardless of zoom. Ensure the text input overlay is inside the scaled container so it inherits the CSS transform. Eraser feedback circle tracks cursor correctly.

#### 3.0 Proof Artifact(s)

- Screenshot: Brush stroke drawn at 4x zoom, then exported PNG shows stroke at the correct position in the 128×128 output
- Screenshot: Text added at 4x zoom, then exported PNG shows text at the correct position in the 128×128 output
- Screenshot: Eraser feedback circle tracks cursor at 4x zoom demonstrates correct visual feedback

#### 3.0 Tasks

- [x] 3.1 Verify that Konva's `getPointerPosition()` auto-corrects for the CSS scale transform (it uses `getBoundingClientRect()` which reflects the CSS-scaled size). Draw brush strokes at 4x zoom and confirm they appear at the cursor position. No code change expected — this is a verification step.
- [x] 3.2 Verify the eraser feedback `<Circle>` tracks the cursor correctly at all zoom levels. Since the circle is rendered inside the Konva Stage (which is CSS-scaled), it should scale with the transform automatically. No code change expected.
- [x] 3.3 Verify the text `<input>` overlay appears at the correct position at all zoom levels. Since it was moved inside the transform div in task 1.3, it inherits the scale. Confirm that the `left`/`top` pixel values (in canvas space) map correctly to the visual position.
- [x] 3.4 Export a PNG at 4x zoom with brush strokes and text, then verify the exported file is 128×128 and marks are at the correct pixel positions. Confirm the export pipeline reads from `latestSnapshot` (native resolution) and is unaffected by CSS zoom.

### [x] 4.0 Tests and Quality Gate

Add/update unit tests covering zoom state, wrapper rendering, scroll-wheel zoom behavior, and preset-switch reset. Ensure all existing tests still pass and no regressions are introduced.

#### 4.0 Proof Artifact(s)

- CLI: `task lint` passes demonstrates code quality
- CLI: `task typecheck` passes demonstrates type safety
- CLI: `task test` passes demonstrates all unit tests pass (new and existing)
- Test: New zoom-related test cases in `EmojiCanvas.test.tsx` pass demonstrates zoom feature coverage

#### 4.0 Tasks

- [x] 4.1 Add a test that verifies the default zoom for the Slack (128×128) preset renders the outer sizing div at 512×512 (`128 * 4`).
- [x] 4.2 Add a test that verifies the default zoom for the Apple (512×512) preset renders the outer sizing div at 512×512 (`512 * 1`, no additional scaling).
- [x] 4.3 Add a test that verifies the inner transform div has `transform: scale(4)` for the Slack preset.
- [x] 4.4 Add a test that simulates `wheel` events and verifies zoom increments/decrements by 0.5 and the outer div dimensions update accordingly.
- [x] 4.5 Add a test that verifies zoom is clamped at min=1 and max=8 (fire many scroll events in one direction and check bounds).
- [x] 4.6 Add a test that verifies zoom resets to the preset default when the preset prop changes (rerender with Apple preset, check zoom=1).
- [x] 4.7 Run `task lint`, `task typecheck`, and `task test` and fix any failures or warnings.
