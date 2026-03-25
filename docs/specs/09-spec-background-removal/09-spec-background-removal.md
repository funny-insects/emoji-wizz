# 09-spec-background-removal.md

## Introduction/Overview

Background Removal lets users eliminate the solid-color background from an imported image directly in the emoji editor. The feature samples the image corners to detect the background color, then uses a flood-fill algorithm from all four corners to make matching pixels transparent. This gives users a quick one-click path to isolating subjects on a transparent canvas before exporting.

## Goals

- Provide a one-click "Remove BG" action in the Toolbar that works on whatever pixels are currently on the canvas.
- Use corner-sampling plus flood-fill so only edge-connected background pixels are removed, preserving subjects that share the background color.
- Let users tune a tolerance value before or after clicking to progressively clean up halos.
- Integrate with the existing undo/redo history so removal can be reversed.
- Support repeated application so successive clicks refine the result without resetting.

## User Stories

**As an emoji creator**, I want to remove the solid background from my imported image with one click so that my subject appears on a transparent canvas ready for export.

**As an emoji creator**, I want to adjust a tolerance value so that I can control how aggressively the background is removed and avoid clipping into the subject.

**As an emoji creator**, I want to undo a background removal that went too far so that I can try again with a different tolerance.

## Demoable Units of Work

### Unit 1: Background Removal Algorithm

**Purpose:** Implement a pure, testable utility that accepts raw ImageData and returns a new ImageData with edge-connected background pixels made transparent.

**Functional Requirements:**

- The system shall expose a function `removeBackground(imageData: ImageData, tolerance: number): ImageData` in `src/utils/removeBackground.ts`.
- The system shall detect the background color by sampling the four corner pixels of the image and averaging their RGBA values.
- The system shall perform a BFS flood fill starting from all four corners, setting the alpha of each visited pixel to 0 if its color is within `tolerance` (Euclidean distance in RGB space) of the detected background color.
- The system shall not modify pixels that are not reachable from the corners via contiguous color-similar neighbors (i.e., interior pixels sharing the background color are preserved).
- The system shall return a new ImageData; it must not mutate the input.

**Proof Artifacts:**

- Unit test: `src/utils/removeBackground.test.ts` with a synthetic 10x10 ImageData (solid white border, red center square) asserts that all border pixels have alpha=0 and all red center pixels retain their original alpha after calling `removeBackground` with tolerance=10.

---

### Unit 2: Toolbar Button and Tolerance Control

**Purpose:** Surface the background removal action and tolerance setting in the Toolbar so users can invoke and tune it without leaving the editor.

**Functional Requirements:**

- The system shall render a "Remove BG" button in the `toolbar-tools` section of `Toolbar.tsx`, alongside the existing pointer/eraser/brush/text buttons.
- The "Remove BG" button shall be a one-click action button (not a toggle tool); it must not set `activeTool` and must not receive an `--active` class.
- The system shall render a tolerance number input in a settings row below the toolbar tools, always visible when an image is loaded (not conditional on a selected tool).
- The tolerance input shall accept integer values from 0 to 128, defaulting to 15.
- The "Remove BG" button shall be disabled (and visually indicated as such) when no image is loaded.
- The `Toolbar` component shall accept an `onRemoveBackground: (tolerance: number) => void` prop and call it with the current tolerance value when the button is clicked.

**Proof Artifacts:**

- Unit test: `src/components/Toolbar.test.tsx` (existing file) updated with a case that renders Toolbar with an image and verifies the "Remove BG" button is present and enabled, and verifies that clicking it calls `onRemoveBackground` with the current tolerance.
- Unit test: same file verifies "Remove BG" button is disabled when `image` is null.

---

### Unit 3: Canvas Integration and History

**Purpose:** Wire the toolbar action through App into EmojiCanvas so that clicking "Remove BG" reads the live canvas pixels, applies the algorithm, writes the result back, and pushes a history snapshot.

**Functional Requirements:**

- The system shall add an `onRemoveBackground` handler in `App.tsx` that reads the current offscreen canvas pixels via `offscreenCanvasRef`, calls `removeBackground(imageData, tolerance)`, writes the result back to the canvas, updates `displayCanvas` state, and calls `onPushState` with the new data URL.
- The system shall pass this handler from `App` to `Toolbar` via the `onRemoveBackground` prop.
- The system shall ensure that repeated calls to "Remove BG" operate on the current canvas state (including the result of previous removals), enabling progressive cleanup.
- The system shall ensure the removal is undoable via Cmd/Ctrl+Z using the existing `useHistory` mechanism.

**Proof Artifacts:**

- Unit test: `src/utils/removeBackground.test.ts` includes a second test that calls `removeBackground` twice on the result of the first call (simulating repeated application) and asserts that the output of the second call has no more non-transparent border pixels than the first.

## Non-Goals (Out of Scope)

1. **AI or ML-based background removal**: This feature uses only algorithmic pixel manipulation — no external APIs or machine learning models.
2. **Global color match**: The implementation must use flood-fill from corners only, not a global pixel replacement across the entire image.
3. **Multi-color or gradient background detection**: Corner sampling detects a single representative background color; complex backgrounds are out of scope.
4. **Automatic re-application on tolerance change**: The removal only fires on button click; live preview as the slider moves is not required.
5. **Mobile/touch support**: Toolbar interactions are desktop-only, consistent with the rest of the editor.

## Design Considerations

The "Remove BG" button should visually match the existing `toolbar-btn` style used by pointer/eraser/brush/text. It is not a toggle, so it should never receive `toolbar-btn--active`. The tolerance input should follow the same pattern as the brush-size `number` input (`toolbar-brush-size-input` class and `px`-style label), placed in a new `toolbar-bg-settings` row that is always visible when an image is loaded.

## Repository Standards

- New utility goes in `src/utils/removeBackground.ts` with a colocated test at `src/utils/removeBackground.test.ts`, matching the pattern of `detectContentBounds.ts` / `detectContentBounds.test.ts`.
- Tests use Vitest (`describe`, `it`, `expect`) as seen throughout the codebase.
- Component props follow the existing pattern: typed interface at the top of the file, destructured in the function signature.
- Run `task lint`, `task typecheck`, and `task test` before considering any unit complete.
- Commits should be atomic per unit; pre-commit hooks enforce linting and formatting.

## Technical Considerations

- The algorithm operates on `ImageData` (raw RGBA pixel arrays) obtained from the offscreen canvas via `ctx.getImageData`. The result is written back via `ctx.putImageData`, then the canvas is set as the new `displayCanvas` in `EmojiCanvas`.
- BFS must track visited pixels to avoid infinite loops; use a `Uint8Array` visited map sized `width * height` for O(1) lookup.
- Tolerance comparison uses Euclidean RGB distance: `sqrt((dr)^2 + (dg)^2 + (db)^2) <= tolerance`. Alpha of the sampled corners is ignored for the distance check.
- The four corner indices are `(0,0)`, `(w-1,0)`, `(0,h-1)`, `(w-1,h-1)` in the ImageData.
- The `onRemoveBackground` callback in `App.tsx` needs access to `offscreenCanvasRef` inside `EmojiCanvas`. The cleanest approach is to expose the remove-background operation as an imperative method via a ref or pass it back up through a prop callback, consistent with how `onPushState` / `restoreSnapshot` already coordinate state between App and EmojiCanvas.

## Security Considerations

No specific security considerations identified. All processing is local, client-side pixel manipulation with no external requests or user-provided code execution.

## Success Metrics

1. **Algorithm correctness**: `removeBackground.test.ts` passes with a synthetic solid-border image, confirming border pixels become alpha=0 and interior pixels are preserved.
2. **Toolbar integration**: Toolbar unit tests pass for enabled/disabled state and callback invocation.
3. **Full test suite green**: `task test` passes with no regressions after implementation.

## Open Questions

No open questions at this time.
