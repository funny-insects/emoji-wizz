# 11 Tasks - Image Transform Tools (Crop, Rotate, Flip)

## Relevant Files

- `src/utils/imageTransforms.ts` - New file: pure utility functions for rotate, flip, and crop canvas operations
- `src/utils/imageTransforms.test.ts` - Unit tests for all transform utilities
- `src/components/Toolbar.tsx` - Add rotate/flip/crop buttons to the existing toolbar
- `src/components/Toolbar.css` - Styles for the new transform button group (separator, layout)
- `src/components/EmojiCanvas.tsx` - Add crop overlay layer (Konva Rect + Group), handle crop interaction, expose `offscreenCanvasRef` for transforms
- `src/App.tsx` - Expand `EditorTool` type to include `"crop"`, add transform handler callbacks, wire new Toolbar props
- `src/utils/imageScaling.ts` - Existing file, used by auto-reframe logic (no changes expected, but referenced)
- `src/hooks/useHistory.ts` - Existing file, used for undo integration (no changes expected)

### Notes

- Unit tests should be placed alongside the code files they test (e.g., `imageTransforms.ts` and `imageTransforms.test.ts` in `src/utils/`).
- Use `task lint`, `task typecheck`, `task test`, and `task format` to verify changes.
- Follow the existing Toolbar button pattern: `toolbar-btn` class, Unicode/SVG icons, `aria-label` and `title` attributes.
- Transforms operate on the offscreen HTML5 Canvas (`offscreenCanvasRef.current`) and return a new canvas — never mutate in place.
- Follow existing TypeScript strict mode conventions (no implicit any, no unused variables).

## Tasks

### [x] 1.0 Image Transform Utilities (Rotate, Flip, Crop)

Create pure utility functions for all three canvas transformations. These operate on an HTML5 Canvas element and return a new canvas with the transformed result. This is the foundation that the UI will call.

#### 1.0 Proof Artifact(s)

- Test: `src/utils/imageTransforms.test.ts` passes — demonstrates rotate (CW/CCW), flip (H/V), and crop functions produce correct pixel output
- Test: Rotate 90° CW on a non-square image swaps width/height correctly
- Test: Crop extracts exact region and discards outside pixels
- Test: Each transform returns a new canvas (non-destructive)

#### 1.0 Tasks

- [x] 1.1 Create `src/utils/imageTransforms.ts` with a `rotateCanvas90(canvas: HTMLCanvasElement, direction: "cw" | "ccw"): HTMLCanvasElement` function. Create a new canvas, swap width/height, use `ctx.translate` + `ctx.rotate` + `ctx.drawImage` to produce the rotated result. Return the new canvas.
- [x] 1.2 Add a `flipCanvas(canvas: HTMLCanvasElement, axis: "horizontal" | "vertical"): HTMLCanvasElement` function to the same file. Create a new canvas of the same dimensions, use `ctx.translate` + `ctx.scale(-1, 1)` (horizontal) or `ctx.scale(1, -1)` (vertical) + `ctx.drawImage`. Return the new canvas.
- [x] 1.3 Add a `cropCanvas(canvas: HTMLCanvasElement, region: { x: number; y: number; size: number }): HTMLCanvasElement` function. Create a new canvas of `size × size`, use `ctx.drawImage(source, region.x, region.y, region.size, region.size, 0, 0, size, size)` to extract the region. Return the new canvas.
- [x] 1.4 Add a `reframeCanvas(canvas: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement` function that takes any-dimension canvas content and scales+centers it onto a new `targetWidth × targetHeight` canvas using the same logic as `computeContainRect`. This encapsulates the auto-reframe step.
- [x] 1.5 Create `src/utils/imageTransforms.test.ts` with unit tests: (a) rotate CW produces correct dimensions and pixel placement, (b) rotate CCW produces correct dimensions, (c) flip horizontal mirrors pixels, (d) flip vertical mirrors pixels, (e) crop extracts exact region, (f) reframe scales and centers content, (g) all functions return a new canvas (input canvas is unchanged). Use `document.createElement("canvas")` with small test canvases (e.g., 4×2) and verify pixel data via `getImageData`.

### [x] 2.0 Rotate and Flip Toolbar Buttons with Canvas Integration

Add four action buttons (Rotate Left, Rotate Right, Flip H, Flip V) to the existing Toolbar. Wire them through App.tsx to apply the transform to the offscreen canvas, auto-reframe the result, and push an undo snapshot.

#### 2.0 Proof Artifact(s)

- Screenshot: Toolbar showing the four new transform buttons (disabled when no image, enabled when image loaded)
- Screenshot: Before and after applying Rotate Right to a loaded image — image is rotated and re-scaled/centered on canvas
- Screenshot: Before and after applying Flip Horizontal — image is mirrored
- Test: Undo after rotate restores previous image state (existing `useHistory` integration)
- CLI: `task lint && task typecheck && task test` passes

#### 2.0 Tasks

- [x] 2.1 In `src/components/Toolbar.tsx`, add a new `toolbar-transforms` section (between `toolbar-tools` and the brush/text settings). Add four buttons: Rotate Left (↺), Rotate Right (↻), Flip Horizontal (⇔), Flip Vertical (⇕). Each button uses the `toolbar-btn` class, has `disabled={!image}`, and calls a corresponding callback prop.
- [x] 2.2 Add new props to `ToolbarProps`: `onRotateLeft: () => void`, `onRotateRight: () => void`, `onFlipHorizontal: () => void`, `onFlipVertical: () => void`. Wire them to the button `onClick` handlers.
- [x] 2.3 In `Toolbar.css`, add a `.toolbar-transforms` rule with the same flex column layout and a `border-top: 1px solid var(--border)` separator, matching the existing `toolbar-history` pattern.
- [x] 2.4 In `src/components/EmojiCanvas.tsx`, add a new prop `transformRequest` of type `{ type: "rotateCW" | "rotateCCW" | "flipH" | "flipV"; seq: number } | null`. In a `useEffect` watching this prop, when it changes: (a) read `offscreenCanvasRef.current`, (b) call the appropriate utility from `imageTransforms.ts`, (c) call `reframeCanvas` on the result to scale+center it to 512×512, (d) update `displayCanvas` state with the new canvas, triggering the existing snapshot push.
- [x] 2.5 In `src/App.tsx`, add state `const [transformRequest, setTransformRequest] = useState<{ type: ...; seq: number } | null>(null)` and a `seqRef` counter. Create handler functions `handleRotateLeft`, `handleRotateRight`, `handleFlipHorizontal`, `handleFlipVertical` that each call `setTransformRequest({ type: "rotateCW", seq: seqRef.current++ })` (etc.). Pass these as props to `Toolbar` and pass `transformRequest` to `EmojiCanvas`.
- [x] 2.6 Verify undo works: after applying a rotate, pressing Ctrl+Z should restore the previous canvas state via the existing `useHistory` hook (no new code needed — the snapshot push in step 2.4 handles this automatically).
- [x] 2.7 Run `task lint && task typecheck && task test` and fix any issues.

### [x] 3.0 Crop Tool — Overlay UI and Interaction

Add a "Crop" tool mode to the Toolbar and implement the interactive crop overlay on the canvas: a draggable/resizable 1:1 square selection with a darkened mask outside, plus Confirm (Enter) and Cancel (Escape) actions.

#### 3.0 Proof Artifact(s)

- Screenshot: Crop tool active showing the square overlay with semi-transparent dark mask outside the selection area
- Screenshot: Crop overlay resized and repositioned by the user, constrained within canvas bounds
- Test: Crop overlay respects minimum size (20×20px) and 1:1 aspect ratio constraint
- Test: Cancel (Escape) removes overlay without modifying the image

#### 3.0 Tasks

- [x] 3.1 In `src/App.tsx`, expand the `EditorTool` type to `"pointer" | "eraser" | "brush" | "text" | "crop"`.
- [x] 3.2 In `src/components/Toolbar.tsx`, add a Crop button (⬒ or similar icon) in the `toolbar-tools` section. It should toggle `activeTool` to `"crop"` and use the `toolbar-btn--active` class when `activeTool === "crop"`, matching the pattern of existing tool buttons.
- [x] 3.3 In `src/components/EmojiCanvas.tsx`, add crop overlay state: `const [cropRect, setCropRect] = useState<{ x: number; y: number; size: number } | null>(null)`. When `activeTool` changes to `"crop"`, initialize `cropRect` to a default centered square (e.g., 50% of canvas size, centered).
- [x] 3.4 Add a new Konva `<Layer>` for the crop overlay (between the overlays layer and the stickers layer). When `activeTool === "crop"` and `cropRect` is set, render: (a) a semi-transparent black `<Rect>` covering the full 512×512 canvas (`fill="rgba(0,0,0,0.5)"`), and (b) a clear `<Rect>` at the crop position using `globalCompositeOperation: "destination-out"` — or alternatively, render 4 dark rects around the crop area. Then render a white-bordered `<Rect>` at the crop position to show the selection boundary.
- [x] 3.5 Make the crop selection `<Rect>` draggable. On `onDragEnd`, update `cropRect` with the new position, clamping `x` and `y` so the square stays within canvas bounds (`x >= 0`, `y >= 0`, `x + size <= 512`, `y + size <= 512`).
- [x] 3.6 Add resize handles to the crop overlay. Use a Konva `<Transformer>` attached to the crop rect with `keepRatio: true` (enforcing 1:1), `boundBoxFunc` to enforce minimum 20×20px size and clamp within 512×512 canvas bounds. On `onTransformEnd`, read the node's position and scale to compute the new `cropRect` values.
- [x] 3.7 Add keyboard handlers for the crop tool. In the existing `handleKeyDown` in `App.tsx`, when `activeTool === "crop"`: Enter key triggers crop confirmation (calls a new `onCropConfirm` callback), Escape key cancels (calls a new `onCropCancel` callback that sets `activeTool` back to `"pointer"` and clears `cropRect`).
- [x] 3.8 Add visible Confirm/Cancel buttons as HTML elements positioned below the canvas (or in the toolbar area) when `activeTool === "crop"`. Confirm calls `onCropConfirm`, Cancel calls `onCropCancel`.
- [x] 3.9 While `activeTool === "crop"`, disable mouse event handlers for other tools (eraser, brush, text) in EmojiCanvas — the existing tool-checking logic in `handleMouseDown`/`handleMouseMove`/`handleClick` already gates on `activeTool`, so just ensure no `"crop"` case triggers drawing.

### [x] 4.0 Crop Tool — Apply, Auto-Reframe, and Undo Integration

Wire the crop confirmation action to extract the selected region from the offscreen canvas, replace canvas contents with the cropped result, auto-reframe (scale + center) to fill the 512×512 canvas, and push an undo snapshot.

#### 4.0 Proof Artifact(s)

- Screenshot: Before and after cropping — cropped region is re-scaled to fill the canvas
- Test: Crop applies correctly — extracted region matches the overlay selection coordinates
- Test: Undo after crop restores the full uncropped image
- CLI: `task lint && task typecheck && task test && task format:check` all pass (full quality gate)

#### 4.0 Tasks

- [x] 4.1 In `src/components/EmojiCanvas.tsx`, create a `handleCropConfirm` function. When called: (a) read `cropRect` and `offscreenCanvasRef.current`, (b) call `cropCanvas(offscreenCanvas, cropRect)` to extract the region, (c) call `reframeCanvas(croppedCanvas, 512, 512)` to scale+center the result, (d) update `displayCanvas` state with the reframed canvas (this triggers the existing snapshot push via the `useEffect` on `displayCanvas`), (e) set `activeTool` back to `"pointer"` via `onToolChange`, (f) clear `cropRect`.
- [x] 4.2 Expose `handleCropConfirm` to App.tsx. Either: (a) pass an `onCropConfirm` prop with a crop request pattern (like `transformRequest`), or (b) handle it entirely within EmojiCanvas using internal state. The approach should match how `bgRemovalRequest` works — a request prop that EmojiCanvas processes internally.
- [x] 4.3 Wire the Confirm button (from task 3.8) and Enter key handler (from task 3.7) to call the crop confirm logic.
- [x] 4.4 Verify undo works: after confirming a crop, Ctrl+Z should restore the full uncropped canvas. The existing `useHistory` snapshot push handles this automatically since the new displayCanvas triggers `onPushState`.
- [x] 4.5 Run `task lint && task typecheck && task test && task format:check` and fix any issues to pass all quality gates.
