# 08-tasks-canvas-zoom-display

## Relevant Files

- `src/components/EmojiCanvas.tsx` - Core canvas component; add display scale, wrapper divs, CSS transform scaling, and pixelated rendering.
- `src/components/EmojiCanvas.test.tsx` - Unit tests for EmojiCanvas; add tests for scale wrapper and default scale per preset.
- `src/utils/presets.ts` - Preset definitions; referenced for width-based scale logic (no modification needed).
- `src/App.tsx` - Parent component; passes preset to EmojiCanvas. No changes needed.
- `src/App.css` - Global styles; add `image-rendering: pixelated` rule for canvas elements inside the scaled container.

### Notes

- Unit tests are colocated with source files (`*.test.tsx`) using Vitest.
- Run `task lint`, `task typecheck`, and `task test` to verify changes.
- Pre-commit hooks enforce linting and formatting — do not skip them.
- Follow existing patterns: React functional components with hooks, strict TypeScript (no `any`).

## Tasks

### [x] 1.0 Scaled Canvas Display

Wrap the Konva Stage in a CSS-scaled container so the 128×128 canvas displays at 512×512 (4x) for Slack/Discord presets, while the Apple 512×512 preset remains at 1x. The card/container grows naturally to fit. Canvas renders with `image-rendering: pixelated` for crisp pixel blocks.

#### 1.0 Proof Artifact(s)

- Screenshot: Canvas displayed at 512×512 with a 128×128 Slack preset loaded demonstrates the 4x scale is applied
- Screenshot: Canvas displayed at 512×512 with pixel grid clearly visible demonstrates pixelated rendering
- Screenshot: Apple preset loaded shows canvas at native 512×512 with no additional scaling
- CLI: `task typecheck` passes demonstrates type safety of display scale and wrapper props

#### 1.0 Tasks

- [x] 1.1 Add a `displayScale` constant to `EmojiCanvas` derived from the preset: `width === 128 ? 4 : 1`.
- [x] 1.2 Wrap the `<Stage>` element in two new divs inside the existing `canvas-drop-zone` div: an **outer sizing div** with explicit `width: width * displayScale; height: height * displayScale` (reserves layout space), and an **inner transform div** with `transform: scale(${displayScale}); transform-origin: top left` (visually scales the stage).
- [x] 1.3 Move the text `<input>` overlay inside the inner transform div (so it inherits the CSS scale transform and positions correctly without coordinate math). Verify the input still appears at the click position.
- [x] 1.4 Add `image-rendering: pixelated` CSS to the `<canvas>` elements inside `.konvajs-content` (add a CSS rule in `App.css` targeting `.konvajs-content canvas`). This suppresses browser interpolation and shows crisp pixel blocks.
- [x] 1.5 Verify the outer card/container grows naturally to accommodate the 512×512 displayed canvas. Adjust any max-width constraints if needed.

### [x] 2.0 Tool Accuracy at Scaled Display

Verify brush, eraser, and text tools so they place marks at the correct canvas pixel at the 4x display scale. Ensure the text input overlay is inside the scaled container so it inherits the CSS transform. Eraser feedback circle tracks cursor correctly.

#### 2.0 Proof Artifact(s)

- Screenshot: Brush stroke drawn at 4x scale, then exported PNG shows stroke at the correct position in the 128×128 output
- Screenshot: Text added at 4x scale, then exported PNG shows text at the correct position in the 128×128 output
- Screenshot: Eraser feedback circle tracks cursor at 4x scale demonstrates correct visual feedback

#### 2.0 Tasks

- [x] 2.1 Verify that Konva's `getPointerPosition()` auto-corrects for the CSS scale transform (it uses `getBoundingClientRect()` which reflects the CSS-scaled size). Draw brush strokes at 4x scale and confirm they appear at the cursor position. No code change expected — this is a verification step.
- [x] 2.2 Verify the eraser feedback `<Circle>` tracks the cursor correctly at the scaled display size. Since the circle is rendered inside the Konva Stage (which is CSS-scaled), it should scale with the transform automatically. No code change expected.
- [x] 2.3 Verify the text `<input>` overlay appears at the correct position at the scaled display size. Since it was moved inside the transform div in task 1.3, it inherits the scale. Confirm that the `left`/`top` pixel values (in canvas space) map correctly to the visual position.
- [x] 2.4 Export a PNG at 4x scale with brush strokes and text, then verify the exported file is 128×128 and marks are at the correct pixel positions. Confirm the export pipeline reads from `latestSnapshot` (native resolution) and is unaffected by CSS scale.

### [x] 3.0 Tests and Quality Gate

Add/update unit tests covering display scale wrapper rendering and preset-based scale values. Ensure all existing tests still pass and no regressions are introduced.

#### 3.0 Proof Artifact(s)

- CLI: `task lint` passes demonstrates code quality
- CLI: `task typecheck` passes demonstrates type safety
- CLI: `task test` passes demonstrates all unit tests pass (new and existing)
- Test: New display-scale test cases in `EmojiCanvas.test.tsx` pass demonstrates feature coverage

#### 3.0 Tasks

- [x] 3.1 Add a test that verifies the Slack (128×128) preset renders the outer sizing div at 512×512 (`128 * 4`).
- [x] 3.2 Add a test that verifies the Apple (512×512) preset renders the outer sizing div at 512×512 (`512 * 1`, no additional scaling).
- [x] 3.3 Add a test that verifies the inner transform div has `transform: scale(4)` for the Slack preset and `scale(1)` for the Apple preset.
- [x] 3.4 Run `task lint`, `task typecheck`, and `task test` and fix any failures or warnings.
