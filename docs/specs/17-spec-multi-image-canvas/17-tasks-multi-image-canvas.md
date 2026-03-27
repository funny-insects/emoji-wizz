# 17-tasks-multi-image-canvas.md

## Relevant Files

- `src/utils/canvasImageTypes.ts` - **New file.** Defines the `CanvasImageItem` interface (id, label, offscreen canvas ref, x/y/width/height/scaleX/scaleY/rotation).
- `src/hooks/useMultiImageCanvas.ts` - **New file.** Custom hook managing the `CanvasImageItem[]` array, `activeImageId`, layer ordering, and a single unified undo/redo history stack for the multi-image mode.
- `src/hooks/useMultiImageCanvas.test.ts` - **New file.** Unit tests for `useMultiImageCanvas` covering add, move, delete, reorder, undo, and redo.
- `src/components/MultiImageCanvas.tsx` - **New file.** Konva-based canvas component for multi-image mode. Renders checkerboard + all `CanvasImageItem` nodes with Transformer; hosts all tool event handlers routed to the active image.
- `src/components/MultiImageCanvas.test.tsx` - **New file.** Unit tests verifying brush/eraser mutations are isolated to the active image's canvas.
- `src/components/LayerPanel.tsx` - **New file.** Sidebar component showing a thumbnail + label per image in z-order; supports drag-to-reorder and click-to-select.
- `src/components/LayerPanel.test.tsx` - **New file.** Unit tests for reorder logic and click-to-select behavior.
- `src/App.tsx` - **Modified.** Add `mode` state (`'singleImage' | 'multiImage'`), mode toggle in the header, conditional rendering of `MultiImageCanvas` vs `EmojiCanvas`, and routing of toolbar/keyboard/export handlers to the active mode.
- `src/App.css` - **Modified.** Add styles for the mode toggle button and the layer panel sidebar.
- `src/utils/exportUtils.ts` - **Possibly modified.** `exportStageAsBlob()` should already work for multi-image mode; only touch this file if the background-hide logic needs adjustment for the new Konva layer structure.
- `e2e/multi-image-canvas.spec.ts` - **New file.** Playwright E2E test covering the full multi-image flow: mode switch → import → edit → export.

### Notes

- Unit tests are colocated with source files (e.g. `useMultiImageCanvas.ts` + `useMultiImageCanvas.test.ts` in the same directory).
- Run tests with `task test` (Vitest) and E2E tests with `task test:e2e` (Playwright).
- Use `task lint` and `task typecheck` after every task to catch issues early.
- Follow the existing hook patterns: `useState` + `useRef` + `useCallback`, no external state libraries.
- Reuse `loadImageFromBlob` (currently internal to `useImageImport.ts`) — move it to a shared utility or duplicate it for `useMultiImageCanvas` as needed.
- Do NOT modify `EmojiCanvas.tsx` or the existing single-image state in `App.tsx`; the new mode runs in parallel.

---

## Tasks

### [x] 1.0 Mode Toggle, Data Model, and Multi-Image Canvas Foundation

Introduce the `singleImage | multiImage` mode flag in `App.tsx`, define the `CanvasImageItem` data type and `useMultiImageCanvas` hook, build the `MultiImageCanvas` Konva component, and wire up all three import paths (file picker, clipboard paste, drag-and-drop). Images placed on the canvas can be freely moved, resized, and rotated using Konva transformer handles. A visible delete button and Delete/Backspace key support remove individual images. Undo/redo covers all add/move/resize/rotate/delete operations in multi-image mode. The existing single-image editor is fully preserved.

#### 1.0 Proof Artifact(s)

- Screenshot: Mode toggle visible in the app header with "Multi-Image" mode active and at least two images positioned on the canvas with transformer handles visible.
- Screen recording: User switches to Multi-Image mode → pastes an image via Cmd+V → drags in another via drop → uses file picker for a third → repositions and resizes each → undoes three steps and redoes them — demonstrates mode switch, all three import paths, free manipulation, and undo/redo.
- Test: `useMultiImageCanvas.test.ts` passes — demonstrates add, move, delete, undo, and redo operations on the data model.

#### 1.0 Tasks

- [x] 1.1 Create `src/utils/canvasImageTypes.ts` and export the `CanvasImageItem` interface with fields: `id: string`, `label: string`, `canvas: HTMLCanvasElement` (the image's own offscreen canvas), `x: number`, `y: number`, `width: number`, `height: number`, `scaleX: number`, `scaleY: number`, `rotation: number`.
- [x] 1.2 Create `src/hooks/useMultiImageCanvas.ts`. The hook manages `items: CanvasImageItem[]`, `activeImageId: string | null`, an undo stack, and a redo stack. Export functions: `addImage(img: HTMLImageElement, label: string)`, `updateItem(updated: CanvasImageItem)`, `removeItem(id: string)`, `setActiveImageId(id: string | null)`, `reorderItems(newOrder: CanvasImageItem[])`, `pushHistory()`, `undo()`, `redo()`, `canUndo: boolean`, `canRedo: boolean`. History snapshots store the full `items` array serialised as data URLs (one per canvas) alongside positions — same data-URL pattern used in `useHistory.ts`.
- [x] 1.3 In `App.tsx`, add `const [mode, setMode] = useState<'singleImage' | 'multiImage'>('singleImage')` near the top of the component. Instantiate `useMultiImageCanvas` beneath it (it will be idle while `mode === 'singleImage'`).
- [x] 1.4 Add a mode toggle to the `<header>` in `App.tsx` — two buttons labelled "Single Image" and "Multi-Image", with the active one visually highlighted. Clicking "Multi-Image" sets `mode` to `'multiImage'`; clicking "Single Image" resets it (no warning needed yet — that's an open question from the spec).
- [x] 1.5 Create `src/components/MultiImageCanvas.tsx`. It receives `items`, `activeImageId`, and the callback props from `useMultiImageCanvas`. Render a 512×512 Konva `<Stage>` with: Layer 0 (checkerboard, same `buildCheckerboard` helper as `EmojiCanvas`), Layer 1 (one `<KonvaImage>` per `CanvasImageItem`, in array order), Layer 2 (single `<Transformer>` wired to the selected image node). Include a `<div>` drop zone and a hidden `<input type="file" accept="image/*">` for the file picker, mirroring the existing pattern in `EmojiCanvas`.
- [x] 1.6 Wire the three import paths in `MultiImageCanvas.tsx` (or in `App.tsx` via prop callbacks): (a) file picker `onChange` → load image → `addImage()`; (b) document `paste` event listener → load image → `addImage()`; (c) `onDrop` on the drop zone → load image → `addImage()`. Validate `image/*` MIME type before loading (consistent with `useImageImport`). Each new image is placed centred on the 512×512 canvas at its natural size capped to 256×256.
- [x] 1.7 In `MultiImageCanvas.tsx`, clicking a `<KonvaImage>` sets it as the active image (`setActiveImageId`). Wire the `<Transformer>` to the active image node using the same `tr.nodes([node])` pattern from `EmojiCanvas`. On `onDragEnd` and `onTransformEnd`, call `updateItem()` with new position/scale/rotation, then `pushHistory()`.
- [x] 1.8 Show a visible delete button absolutely positioned at the top-right corner of the selected image (same red circle `×` button style as stickers in `EmojiCanvas`). Clicking it calls `removeItem(activeImageId)` then `pushHistory()`.
- [x] 1.9 In `App.tsx`, extend the existing `keydown` handler: when `mode === 'multiImage'`, Delete/Backspace calls `removeItem(activeImageId)` instead of `handleDeleteSticker`; Cmd/Ctrl+Z calls the multi-image `undo()`; Cmd/Ctrl+Shift+Z calls the multi-image `redo()`.
- [x] 1.10 Conditionally render `<MultiImageCanvas>` instead of `<EmojiCanvas>` in `App.tsx` when `mode === 'multiImage'`. The `<Toolbar>`, `<OptimizerPanel>`, `<ExportControls>`, and `<DecoratePanel>` continue to render in both modes (they will be wired to the active mode in later tasks).
- [x] 1.11 Write unit tests in `src/hooks/useMultiImageCanvas.test.ts` covering: `addImage` appends an item; `removeItem` removes by id; `updateItem` replaces by id; `reorderItems` replaces the array; `undo` restores the previous state; `redo` re-applies undone state; `canUndo`/`canRedo` reflect stack lengths.

---

### [x] 2.0 Per-Image Editing Tools

Make the brush, eraser, crop, rotate, flip, and background removal tools operate on the currently selected ("active") image's own offscreen `HTMLCanvasElement`, leaving all other canvas images unaffected. The active image is visually distinguished by a colored highlight border. When no image is selected, editing tools are disabled with a prompt. Undo/redo covers per-image pixel edits as well as positional changes.

#### 2.0 Proof Artifact(s)

- Screen recording: User selects Image A → paints brush strokes on it → clicks Image B → uses eraser on it → Image A's brush strokes remain intact — demonstrates per-image pixel isolation.
- Screen recording: User selects an image → applies crop → applies background removal via the modal — demonstrates per-image crop and bg removal routing.
- Screenshot: Active image shown with a distinct colored border; other images shown without it; toolbar tools appear enabled vs. disabled based on selection state.
- Test: `MultiImageCanvas.test.tsx` passes — demonstrates that tool operations mutate only the active image's canvas data.

#### 2.0 Tasks

- [x] 2.1 In `MultiImageCanvas.tsx`, add a visual highlight ring around the active image: render an extra `<Rect>` in Layer 2 behind the `<Transformer>`, matching the active item's bounding box, with a 2px stroke in a distinct colour (e.g. `#4A90E2`) and no fill, `listening={false}`.
- [x] 2.2 In `App.tsx`, pass the `canUndo`/`canRedo` values from `useMultiImageCanvas` to `<Toolbar>` when `mode === 'multiImage'`, replacing the single-image history flags. Pass a multi-image-aware `hasImage` boolean (true when `items.length > 0`) to `<Toolbar>` and `<ExportControls>` instead of the `image !== null` check.
- [x] 2.3 In `MultiImageCanvas.tsx`, when `activeTool` is `'brush'`, `'eraser'`, `'crop'`, or `'text'` and `activeImageId` is `null`, show a small overlay message on the canvas: "Select an image to edit". Disable `onMouseDown`/`onMouseMove` tool logic in this state (guard with an early return).
- [x] 2.4 Implement brush in `MultiImageCanvas.tsx`: on `mouseDown`/`mouseMove`/`mouseUp` with `activeTool === 'brush'`, draw a `Konva.Line` on an overlay layer as the user drags; on `mouseUp`, flatten the line into the active item's `canvas` using the same `flattenCurrentLine` logic from `EmojiCanvas.tsx`; call `pushHistory()` after flattening. Update the active `<KonvaImage>` source to reflect the changed canvas.
- [x] 2.5 Implement eraser in `MultiImageCanvas.tsx`: on `mouseDown`/`mouseMove`/`mouseUp` with `activeTool === 'eraser'`, apply `destination-out` fills to the active item's `canvas` (same `applyEraserAt` logic from `EmojiCanvas.tsx`); call `pushHistory()` on `mouseUp`. Update the active `<KonvaImage>` source.
- [x] 2.6 Implement crop in `MultiImageCanvas.tsx`: show the crop rect overlay (same 4-mask + dashed rect + `<Transformer>` pattern from `EmojiCanvas.tsx`) positioned over the active image. On crop confirm (triggered by `cropConfirmSeq` prop from `App.tsx`), call `cropCanvas()` + `reframeCanvas()` on the active item's canvas (importing from `imageTransforms.ts`), update the item's canvas in state, call `pushHistory()`, and switch back to the pointer tool.
- [x] 2.7 Implement transforms in `MultiImageCanvas.tsx`: when `transformRequest` prop changes (same `{ type, seq }` pattern from `App.tsx`), apply `rotateCanvas90()` / `flipCanvas()` + `reframeCanvas()` from `imageTransforms.ts` to the active item's canvas; update the item in state; call `pushHistory()`.
- [x] 2.8 Implement background removal in multi-image mode in `App.tsx`: when `mode === 'multiImage'` and the user opens background removal, read pixel data from the active item's canvas (via a ref exposed by `MultiImageCanvas`) and pass it as `imageData` to `<BackgroundRemovalModal>`. On confirm, apply `removeBackground()` to the active item's canvas, update the item, call `pushHistory()`.
- [x] 2.9 Ensure `pushHistory()` in `useMultiImageCanvas` serialises each item's canvas as a data URL. On `undo()`/`redo()`, reconstruct `HTMLCanvasElement` objects from stored data URLs and restore the full items array (positions + pixel data). This means `MultiImageCanvas.tsx` re-reads the canvas objects from the restored items and updates Konva nodes accordingly.
- [x] 2.10 Write unit tests in `src/components/MultiImageCanvas.test.tsx` (or in the hook tests) verifying: brush stroke only modifies the active item's canvas pixel data; eraser only modifies the active item's canvas; calling `updateItem` with a changed canvas does not affect other items in the array.

---

### [x] 3.0 Layer Panel

Build the `LayerPanel` component showing a thumbnail + filename label for each image, in z-order (top of list = front of canvas). Users can drag rows to reorder layers; the canvas updates immediately. Clicking a row selects that image on the canvas. The panel is only visible in Multi-Image mode. Adding or removing an image updates the panel automatically. Undo/redo restores previous layer ordering.

#### 3.0 Proof Artifact(s)

- Screen recording: User places two overlapping images → opens layer panel → drags the bottom image's row to the top → the previously-hidden image now appears in front on the canvas — demonstrates live z-order reordering.
- Screenshot: Layer panel showing thumbnails, filename labels, and correct stack order, consistent with the existing right-panel sidebar visual style.
- Test: `LayerPanel.test.tsx` passes — demonstrates reorder updates state correctly and clicking a row sets the active image.

#### 3.0 Tasks

- [x] 3.1 Create `src/components/LayerPanel.tsx`. It receives `items: CanvasImageItem[]`, `activeImageId: string | null`, `onSelectImage: (id: string) => void`, and `onReorder: (newItems: CanvasImageItem[]) => void` as props. Render a vertical list where the first item in the list corresponds to the topmost (front) layer on the canvas.
- [x] 3.2 For each row in `LayerPanel`, render: a 32×32px thumbnail (draw the item's `canvas` into a small `<canvas>` element), a label (the item's `label` field), and a subtle highlight when `item.id === activeImageId`.
- [x] 3.3 Implement drag-to-reorder in `LayerPanel.tsx` using HTML5 drag events (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) — no external DnD library. Track the dragged item's id in local state. On `onDrop`, compute the new order and call `onReorder(newItems)`.
- [x] 3.4 In `App.tsx`, when `mode === 'multiImage'`, wire `onReorder` to call `reorderItems(newItems)` from `useMultiImageCanvas` followed by `pushHistory()`.
- [x] 3.5 Ensure the `items` array order in `useMultiImageCanvas` directly controls the Konva z-order in `MultiImageCanvas.tsx`: `items[0]` renders first (bottom layer), `items[items.length - 1]` renders last (top layer). When `reorderItems` updates the array, React re-renders the Konva nodes in the new order automatically.
- [x] 3.6 In `App.tsx`, render `<LayerPanel>` to the right of `<MultiImageCanvas>` (within the existing right-panel column) only when `mode === 'multiImage'`. Add minimal CSS in `App.css` for the panel's width, scroll behaviour, and row styling, consistent with the `.section` / `.section-label` pattern used elsewhere.
- [x] 3.7 Confirm that undo/redo (which restores the full `items` array) also restores layer ordering — this should come for free from the data-URL snapshot approach in task 2.9, but verify it manually and add an assertion in `useMultiImageCanvas.test.ts`.
- [x] 3.8 Write unit tests in `src/components/LayerPanel.test.tsx`: render with two items → drag first to second position → assert `onReorder` called with reversed array; click a row → assert `onSelectImage` called with correct id.

---

### [x] 4.0 Export and Quality Gates

Wire the Download button in multi-image mode to flatten all images in correct z-order (with all pixel edits applied) using the existing `exportStageAsBlob()` path. The transparent checkerboard background is not included in the export (background layer hidden before capture). Platform preset scaling, format selection (PNG/GIF/WebP), file size warnings, and ISO date-based filename all behave identically to today. Add at least one Playwright E2E test covering the full multi-image flow. All lint, typecheck, and unit test checks pass with no regressions.

#### 4.0 Proof Artifact(s)

- Downloaded PNG: A 128×128 Slack-preset export from a two-image composition, showing both images composited correctly with a transparent background — demonstrates correct flattening and scaling.
- Screenshot: Export controls panel and (if applicable) file size warning shown while multi-image canvas is active before the download.
- CLI: `task lint && task typecheck && task test` output showing all checks green with no errors or warnings — demonstrates no regressions.
- E2E: `task test:e2e` passes the new multi-image Playwright test covering mode switch → import → edit → export flow.

#### 4.0 Tasks

- [x] 4.1 In `App.tsx`, update `handleDownload` to branch on `mode`: when `mode === 'multiImage'`, call `exportStageAsBlob(multiImageStageRef.current, exportPreset)` using a `stageRef` exposed by `MultiImageCanvas`. The background layer (checkerboard) must be hidden before capture and restored after — `exportStageAsBlob` already does this for layer index 0, so verify the multi-image stage uses the same layer index convention.
- [x] 4.2 Verify that the exported PNG has a transparent background (not white) by exporting a single image with empty canvas areas and inspecting the result in a browser. If the checkerboard leaks through, confirm `bgLayer.visible(false)` correctly targets Layer 0 in the multi-image stage.
- [x] 4.3 Confirm `checkFileSizeWarning` and `buildFilename` are called in the multi-image download path identically to the single-image path — no new logic needed, just ensure the branch routes through the same `triggerDownload`/`setSizeWarning` calls.
- [x] 4.4 Create `e2e/multi-image-canvas.spec.ts`. Write a Playwright test that: navigates to `http://localhost:5173`, clicks the "Multi-Image" mode toggle, uploads two images via the file picker (use test fixtures from `e2e/fixtures/` or create small PNGs), repositions them by simulating drag, clicks Download with the Slack preset selected, and asserts that a file download was triggered. Follow the test structure and fixture patterns in existing E2E specs (e.g. `e2e/export.spec.ts`).
- [x] 4.5 Run `task lint` and fix any ESLint errors introduced by the new files (unused imports, missing types, etc.).
- [x] 4.6 Run `task typecheck` and resolve any TypeScript errors — pay particular attention to the `HTMLCanvasElement` refs passed between `MultiImageCanvas` and `App.tsx`, and to the union `mode` type threading through props.
- [x] 4.7 Run `task test` and ensure all existing unit tests still pass alongside the new ones. Fix any regressions caused by changes to `App.tsx`.
- [x] 4.8 Run `task test:e2e` and ensure the new multi-image E2E test passes alongside the existing suite.
