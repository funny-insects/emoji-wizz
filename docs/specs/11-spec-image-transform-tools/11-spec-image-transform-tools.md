# 11-spec-image-transform-tools

## Introduction/Overview

The emoji editor currently supports brush, eraser, text, and background removal on the main image, but lacks geometric transformation tools. This feature adds **crop**, **rotate**, and **flip** capabilities for the main canvas image, allowing users to adjust their uploaded photo before or during editing. After each transform, the image is automatically re-scaled and centered to fill the 512×512 canvas as much as possible while preserving aspect ratio.

## Goals

- Allow users to crop their image using a 1:1 square crop rectangle, then confirm to apply
- Allow users to rotate the image in 90° increments (clockwise and counter-clockwise)
- Allow users to flip the image horizontally or vertically via dedicated buttons
- Automatically re-frame (scale + center) the image on the canvas after any transform
- Integrate transforms into the existing undo/redo system as single-step operations

## User Stories

- **As an emoji creator**, I want to crop my uploaded image to focus on the part that matters so that my emoji looks clean and intentional.
- **As an emoji creator**, I want to rotate my image by 90° so that I can correct orientation issues from the original photo.
- **As an emoji creator**, I want to flip my image horizontally or vertically so that I can mirror it or turn it upside down for comedic or stylistic effect.
- **As an emoji creator**, I want the image to automatically re-fit the canvas after I transform it so that I don't have to manually resize or reposition it.

## Demoable Units of Work

### Unit 1: Rotate and Flip Tools

**Purpose:** Give users one-click buttons to rotate (90° CW/CCW) and flip (horizontal/vertical) the main canvas image, with auto-reframing and undo support.

**Functional Requirements:**

- The system shall add four buttons to the existing Toolbar: Rotate Left (90° CCW), Rotate Right (90° CW), Flip Horizontal, and Flip Vertical
- The buttons shall only be enabled when an image is loaded on the canvas
- When the user clicks Rotate Left, the system shall rotate the entire offscreen canvas contents 90° counter-clockwise
- When the user clicks Rotate Right, the system shall rotate the entire offscreen canvas contents 90° clockwise
- When the user clicks Flip Horizontal, the system shall mirror the offscreen canvas contents along the vertical axis (left-right)
- When the user clicks Flip Vertical, the system shall mirror the offscreen canvas contents along the horizontal axis (top-bottom)
- After any rotate or flip operation, the system shall re-scale and center the result to fill as much of the 512×512 canvas as possible while preserving aspect ratio (using the existing `computeContainRect` logic)
- Each rotate or flip operation shall push a snapshot to the undo history stack as a single undo step
- Rotate and flip shall transform all flattened edits (brush strokes, erased areas, text) since they are part of the offscreen canvas
- Stickers and frames shall not be affected by image transforms (they remain in their current positions on their own layers)

**Proof Artifacts:**

- Screenshot: Toolbar showing rotate/flip buttons (disabled state with no image, enabled with image)
- Screenshot: Before and after applying Rotate Right to a loaded image
- Screenshot: Before and after applying Flip Horizontal to a loaded image
- Test: Rotate and flip utility functions pass unit tests demonstrating correct pixel transformations
- Test: Undo after rotate restores previous image state

### Unit 2: Crop Tool

**Purpose:** Let users select a square region of their image to keep, discarding the rest, with auto-reframing of the cropped result.

**Functional Requirements:**

- The system shall add a Crop tool button to the existing Toolbar alongside the other transform tools
- When the user activates the Crop tool, the system shall display a draggable, resizable 1:1 square overlay on the canvas
- The crop overlay shall be constrained to remain within the bounds of the image content on the canvas
- The crop overlay shall display a semi-transparent darkened area outside the selected region to indicate what will be removed
- The system shall provide Confirm and Cancel actions for the crop (e.g., buttons or Enter/Escape keyboard shortcuts)
- When the user confirms the crop, the system shall extract the selected square region from the offscreen canvas, discard everything outside it, and replace the canvas contents with the cropped result
- After cropping, the system shall re-scale and center the cropped image to fill as much of the 512×512 canvas as possible while preserving aspect ratio
- When the user cancels the crop, the system shall remove the crop overlay and return to the previous tool without modifying the image
- The confirmed crop operation shall push a snapshot to the undo history stack as a single undo step
- While the crop tool is active, other tools (brush, eraser, text) shall be inactive
- The crop overlay shall have a minimum size to prevent accidentally cropping to a tiny region (e.g., minimum 20×20 pixels)

**Proof Artifacts:**

- Screenshot: Crop tool active showing the square overlay with darkened outside area
- Screenshot: Before and after cropping an image, showing the cropped region re-scaled to fill the canvas
- Test: Crop utility function correctly extracts the selected region
- Test: Crop cancel does not modify the image
- Test: Undo after crop restores the full uncropped image

## Non-Goals (Out of Scope)

1. **Freeform (non-square) crop** — crop is locked to 1:1 aspect ratio since emojis are always square
2. **Free-angle rotation** — only 90° snap increments; no arbitrary angle rotation slider
3. **Transforming stickers/frames** — transforms apply only to the main image layer (stickers already have their own Konva Transformer)
4. **Batch transforms** — no "apply multiple transforms at once" workflow; each is applied individually
5. **Perspective/skew transforms** — only crop, rotate, and flip

## Design Considerations

- Transform buttons (Rotate Left, Rotate Right, Flip H, Flip V) should follow the existing Toolbar button style and iconography pattern
- The Crop tool button should visually indicate it's a mode (like brush/eraser) since it requires user interaction before applying
- The crop overlay should use a semi-transparent dark mask (similar to common image editors) with the selected area shown at full brightness
- Crop confirm/cancel actions should be clearly visible — either as overlay buttons near the crop area or in the toolbar
- Consider using simple SVG icons or Unicode symbols for the transform buttons to match the existing toolbar aesthetic

## Repository Standards

- Use `task lint`, `task typecheck`, `task test`, and `task format` to verify changes
- Colocate unit tests with source files (`*.test.ts` / `*.test.tsx`)
- Follow existing TypeScript strict mode conventions (no implicit any, no unused variables)
- Follow existing component patterns: CSS in component-level `.css` files, BEM-like class naming
- Pure utility functions go in `src/utils/`, React hooks in `src/hooks/`
- Pre-commit hooks enforce linting and formatting — do not skip them

## Technical Considerations

- **Rotate/flip operate on the offscreen canvas** — the existing architecture flattens all edits onto an offscreen HTML5 Canvas. Transforms should manipulate this canvas directly using Canvas 2D context operations (`ctx.translate`, `ctx.rotate`, `ctx.scale`, `ctx.drawImage`).
- **Re-framing uses existing `computeContainRect`** — after any transform, re-apply the contain-fit logic to scale and center the result on the 512×512 canvas.
- **Crop overlay is a Konva element** — render the crop rectangle and dark mask as Konva shapes on a temporary layer, not as HTML DOM overlays, to stay consistent with the canvas rendering approach.
- **History integration** — push a `toDataURL()` snapshot to the existing `useHistory` undo stack before applying each transform, matching the current pattern.
- **Canvas dimension handling for rotation** — rotating a non-square image 90° swaps width and height; the re-framing step handles this naturally since `computeContainRect` works with any aspect ratio.

## Security Considerations

No specific security considerations identified. All operations are client-side canvas manipulations with no external data or API calls.

## Success Metrics

1. **All three transforms work correctly** — crop, rotate (CW/CCW), and flip (H/V) produce visually correct results on any uploaded image
2. **Auto-reframing** — after any transform, the image fills at least 80% of one canvas dimension while preserving aspect ratio
3. **Undo/redo works** — each transform is a single undo step and can be fully reversed
4. **No regressions** — existing tools (brush, eraser, text, background removal, stickers, export) continue to work correctly after transforms are applied
5. **All quality gates pass** — `task lint`, `task typecheck`, `task test`, and `task format:check` pass

## Open Questions

No open questions at this time.
