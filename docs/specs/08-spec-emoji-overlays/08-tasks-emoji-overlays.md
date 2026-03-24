# 08 Tasks — Emoji Overlays

> Branch: `emoji_overlay`
> Spec: `08-spec-emoji-overlays/08-spec-emoji-overlays.md`

## Relevant Files

- `src/App.tsx` — Main app component; holds sticker/frame state, wires history, drives export and undo/redo.
- `src/components/EmojiCanvas.tsx` — Konva Stage host; adds Layers 3 (stickers) and 4 (frames), renders sticker nodes and Transformer, exposes callbacks for sticker interaction events.
- `src/components/EmojiCanvas.test.tsx` — Existing canvas tests; must not regress.
- `src/components/DecoratePanel.tsx` — **New.** Floating sidebar with Stickers and Frames tabs; renders thumbnail grids; calls back placement/frame-toggle events.
- `src/components/DecoratePanel.css` — **New.** Styles for the floating sidebar.
- `src/components/DecoratePanel.test.tsx` — **New.** Unit tests for panel visibility, tab switching, sticker click, frame toggle.
- `src/components/SpeechBubbleModal.tsx` — **New.** Centered popover for entering speech bubble text before placement.
- `src/components/SpeechBubbleModal.test.tsx` — **New.** Unit tests for modal submit and cancel.
- `src/hooks/useStickerHistory.ts` — **New.** Parallel undo/redo stack for `StickerDescriptor[]` snapshots; mirrors `useHistory.ts`.
- `src/hooks/useStickerHistory.test.ts` — **New.** Unit tests mirroring `useHistory.test.ts`.
- `src/utils/stickerTypes.ts` — **New.** Shared `StickerDescriptor` and `FrameDefinition` type definitions.
- `src/utils/exportUtils.ts` — Add `exportStageAsBlob` helper for stage-level export with checkerboard hidden.
- `src/utils/exportUtils.test.ts` — Existing export tests; must not regress.
- `src/assets/stickers/` — **New directory.** PNG files for 6 eyes stickers + speech bubble.
- `src/assets/stickers/index.ts` — **New.** Typed registry of built-in sticker definitions.
- `src/assets/frames/` — **New directory.** PNG files for 4 Reactions frames.
- `src/assets/frames/index.ts` — **New.** Typed registry of frame definitions.

### Notes

- All new components go in `src/components/`, utilities in `src/utils/`, hooks in `src/hooks/`.
- Tests are colocated with source files and use Vitest + `@testing-library/react` (`renderHook`, `act`, `render`).
- Run `task lint`, `task typecheck`, and `task test` after each parent task to catch regressions early.
- All work commits to the `emoji_overlay` branch only.
- Konva layer access follows the existing pattern: `Konva.stages[0]?.getLayers()[n]` — do not change layer indices [0], [1], [2].

---

## Tasks

### [x] 1.0 Source and bundle sticker and frame assets

**Purpose:** Download/prepare the 6 eyes sticker PNGs and 4 Reactions frame PNGs and commit them to the repo with a typed asset registry. Everything downstream depends on having real assets to render.

#### 1.0 Proof Artifact(s)

- File listing: `ls src/assets/stickers/` returns 6+ PNG files (laser-eyes.png, heart-eyes.png, googly-eyes.png, crying-tears.png, sparkle-eyes.png, sunglasses.png, speech-bubble.png) demonstrates sticker assets are present and committed.
- File listing: `ls src/assets/frames/` returns 4 PNG files (approved.png, nice.png, one-hundred.png, no.png) demonstrates frame assets are present and committed.
- Screenshot: Asset registry file (`src/assets/stickers/index.ts`) exported sticker metadata array shown in editor — demonstrates typed manifest exists and is importable.

#### 1.0 Tasks

- [x] 1.1 Create the directories `src/assets/stickers/` and `src/assets/frames/`.
- [x] 1.2 Download PNG sticker assets for the 6 eyes stickers. For standard emoji (heart eyes 😍, sunglasses 😎, crying tears 😢, sparkle/star-struck 🤩, googly/wide eyes 👀), download from the Twemoji PNG CDN at 72px size: `https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/<codepoint>.png`. Save them as: `heart-eyes.png`, `sunglasses.png`, `crying-tears.png`, `sparkle-eyes.png`, `googly-eyes.png`. For **laser-eyes**, there is no standard emoji — create a simple 72×72px PNG with two red glowing oval shapes (can be drawn with any image editor or a short Node/Canvas script). Save as `laser-eyes.png`.
- [x] 1.3 Download or create a speech bubble sticker PNG (72×72px, transparent background, white fill with black outline). Save as `src/assets/stickers/speech-bubble.png`.
- [x] 1.4 Create the 4 Reactions frame PNGs at **128×128px** with transparent centers (so the user's image shows through). Each frame is a full-canvas overlay:
  - `approved.png` — bold green "APPROVED" stamp style ring/text
  - `nice.png` — banner strip across the top or bottom reading "NICE"
  - `one-hundred.png` — "💯" style decorative border
  - `no.png` — red circle-slash overlay (like a prohibition sign without fill)
    These can be created in any image editor or with a short canvas script. The center should be fully transparent so the emoji image is visible beneath the frame.
- [x] 1.5 Create `src/assets/stickers/index.ts` with a typed array of sticker definitions. Export a `StickerDefinition` interface with fields `id: string`, `label: string`, `src: string` (import path), `category: string`, and `requiresText?: boolean`. Add entries for all 7 stickers (6 eyes + speech bubble), with `requiresText: true` on the speech bubble entry.
- [x] 1.6 Create `src/assets/frames/index.ts` with a typed array of frame definitions. Export a `FrameDefinition` interface with fields `id: string`, `label: string`, `src: string` (import path), `category: string`. Add entries for all 4 Reactions frames.
- [x] 1.7 Run `task typecheck` to confirm the new asset index files have no type errors.

---

### [ ] 2.0 Build DecoratePanel with sticker system (Eyes category)

**Purpose:** Creates the floating Decorate sidebar, the Stickers tab with the Eyes category grid, and the full sticker interaction model — place, drag, resize, rotate, delete using Konva Layer 3 + Transformer.

#### 2.0 Proof Artifact(s)

- Screenshot: Decorate sidebar visible to the right of the canvas (image loaded) showing 6 Eyes stickers in a thumbnail grid — demonstrates the sidebar renders when an image is present and is hidden otherwise.
- Screenshot sequence (3 frames): (1) click laser-eyes in sidebar → sticker appears centered on canvas with Transformer handles; (2) sticker dragged to top-right; (3) sticker deleted via X button — demonstrates full place/move/delete interaction model.
- Test: `task test` passes including `DecoratePanel.test.tsx` — demonstrates component renders correctly and sidebar visibility toggle logic is covered.

#### 2.0 Tasks

- [ ] 2.1 Create `src/utils/stickerTypes.ts`. Define and export the `StickerDescriptor` type:
  ```ts
  export interface StickerDescriptor {
    id: string; // unique runtime ID (e.g. crypto.randomUUID())
    src: string; // image src URL (asset path or object URL for uploads)
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    rotation: number; // degrees
    requiresText?: boolean;
    text?: string; // only used by speech bubble
  }
  ```
- [ ] 2.2 Add `stickers: StickerDescriptor[]` state and `selectedStickerId: string | null` state to `App.tsx`. Add callbacks `handlePlaceSticker`, `handleUpdateSticker`, `handleDeleteSticker`, and `handleSelectSticker` that update these state arrays and pass them as props to `EmojiCanvas`.
- [ ] 2.3 Add a fourth `<Layer>` (sticker layer) inside the `<Stage>` in `EmojiCanvas.tsx`, placed after the existing three layers. This layer will render sticker `KonvaImage` nodes. Also add a Konva `Transformer` component inside this layer (from `react-konva`).
- [ ] 2.4 In `EmojiCanvas.tsx`, render a `<KonvaImage>` node for each `StickerDescriptor` in the `stickers` prop inside the sticker layer. Each node should have `draggable={true}` and call `onUpdateSticker` with updated position/scale/rotation on `dragend`, `transformend`. On click, call `onSelectSticker(id)`.
- [ ] 2.5 Wire the Konva `Transformer` to the currently selected sticker node. Use a `useRef` map from sticker ID → Konva node reference. When `selectedStickerId` changes, call `transformer.nodes([selectedNode])` and `transformer.getLayer().batchDraw()`.
- [ ] 2.6 Add a floating HTML delete button ("×") that appears over the selected sticker. Position it absolutely inside the `canvas-drop-zone` div using the selected sticker node's `getClientRect()` (top-right corner). Clicking it calls `onDeleteSticker(selectedStickerId)`. This button should render inside `EmojiCanvas` JSX using `selectedStickerId` and the node ref.
- [ ] 2.7 Add a `keydown` listener in `EmojiCanvas.tsx` (or in `App.tsx` alongside the existing one) for `Delete`/`Backspace` that calls `onDeleteSticker(selectedStickerId)` when a sticker is selected.
- [ ] 2.8 Create `src/components/DecoratePanel.tsx`. It accepts props: `image: HTMLImageElement | null`, `stickers: StickerDefinition[]` (from asset registry), `onPlaceSticker: (def: StickerDefinition) => void`, `activeFrameId: string | null`, `frames: FrameDefinition[]`, `onToggleFrame: (id: string) => void`. Return `null` when `image` is null (same pattern as `Toolbar`).
- [ ] 2.9 Implement the sidebar layout in `DecoratePanel.tsx`: a fixed or absolutely positioned panel to the right of the canvas area with two tabs ("Stickers" / "Frames"). The Stickers tab renders the Eyes category as a scrollable grid of 48×48px `<img>` thumbnails with a label below each. Clicking a thumbnail calls `onPlaceSticker(def)`.
- [ ] 2.10 In `App.tsx`, implement `handlePlaceSticker(def: StickerDefinition)`: create a new `StickerDescriptor` centered on the canvas (`x = preset.width/2 - 32`, `y = preset.height/2 - 32`, `width = 64`, `height = 64`, `scaleX = 1`, `scaleY = 1`, `rotation = 0`, `id = crypto.randomUUID()`), and add it to the `stickers` array.
- [ ] 2.11 Create `src/components/DecoratePanel.css` with styles for the floating sidebar (e.g., position right of the canvas, background matching the existing app card style, scrollable sticker grid).
- [ ] 2.12 Add `<DecoratePanel>` to `App.tsx` JSX, placed inside the `editor-area` div alongside `<Toolbar>` and `<EmojiCanvas>`.
- [ ] 2.13 Create `src/components/DecoratePanel.test.tsx`. Write tests for: (a) panel returns null when `image` is null; (b) panel renders sticker thumbnails when `image` is present; (c) clicking a sticker thumbnail calls `onPlaceSticker` with the correct definition; (d) tab switching between Stickers and Frames works.
- [ ] 2.14 Run `task lint`, `task typecheck`, and `task test` — fix any errors before moving on.

---

### [ ] 3.0 Build frame system (Reactions category)

**Purpose:** Adds the Frames tab to DecoratePanel, renders the active frame as a full-canvas Konva Image on Layer 4 (in front of everything), and handles toggle on/off plus preset-aware scaling.

#### 3.0 Proof Artifact(s)

- Screenshot: "APPROVED" frame active — frame stamp visible composited over the user's emoji in the canvas, Frames tab showing the frame thumbnail highlighted with an active border — demonstrates frame renders in front of image and selection state is visible.
- Screenshot: Switch from Slack (128×128) preset to a larger preset with frame active — frame fills the new canvas dimensions without distortion — demonstrates preset-aware scaling.
- Test: `task test` passes with `DecoratePanel.test.tsx` updated to cover frame toggle logic.

#### 3.0 Tasks

- [ ] 3.1 Add a fifth `<Layer>` (frame layer) inside the `<Stage>` in `EmojiCanvas.tsx`, placed after the sticker layer (Layer 4). This layer will render the active frame.
- [ ] 3.2 Add `activeFrameId: string | null` and `activeFrameSrc: string | null` props to `EmojiCanvas`. Inside the frame layer, when `activeFrameSrc` is set, render a `<KonvaImage>` with `x={0}`, `y={0}`, `width={preset.width}`, `height={preset.height}`, `listening={false}` (frames are not interactive). Load the image with `useImage` from `use-konva` or manually with a `useEffect` + `new Image()`.
- [ ] 3.3 In `App.tsx`, add `activeFrameId: string | null` state (default `null`). Implement `handleToggleFrame(id: string)`: if `activeFrameId === id`, set to `null`; otherwise set to `id`. Pass `activeFrameId` and the resolved `activeFrameSrc` (looked up from the frames registry) to `EmojiCanvas`.
- [ ] 3.4 Implement the Frames tab in `DecoratePanel.tsx`. Render the 4 Reactions frames as a thumbnail grid. The currently active frame (matching `activeFrameId`) should have a visible highlight border (e.g., `outline: 2px solid hotpink`). Clicking a frame calls `onToggleFrame(id)`.
- [ ] 3.5 Verify preset-aware scaling: since the frame `<KonvaImage>` uses `width={preset.width}` and `height={preset.height}` as props, it will automatically resize when the preset changes. Manually test this by switching presets with a frame active.
- [ ] 3.6 Update `DecoratePanel.test.tsx`: add tests for (a) Frames tab renders 4 frame thumbnails; (b) clicking a frame calls `onToggleFrame` with the correct ID; (c) active frame has an active CSS class.
- [ ] 3.7 Run `task lint`, `task typecheck`, and `task test` — fix any errors before moving on.

---

### [ ] 4.0 Speech bubble modal + custom PNG sticker upload

**Purpose:** Adds the two special-case sticker interactions: a text entry modal that fires before placing the speech bubble, and a file-picker that lets users upload any PNG as a session sticker.

#### 4.0 Proof Artifact(s)

- Screenshot: Speech bubble modal open (text field + "Place" + "Cancel" buttons) after clicking speech bubble in sidebar — demonstrates modal appears before placement.
- Screenshot: Speech bubble sticker on canvas with user-typed text rendered inside the bubble — demonstrates text is composited with the bubble PNG.
- Screenshot: Custom PNG selected via "Upload PNG" → appears as thumbnail in sidebar → placed on canvas with Transformer handles — demonstrates full upload-to-place flow.
- Test: `task test` passes including `SpeechBubbleModal.test.tsx`.

#### 4.0 Tasks

- [ ] 4.1 Create `src/components/SpeechBubbleModal.tsx`. It accepts props: `onPlace: (text: string) => void`, `onCancel: () => void`. Renders a centered overlay (modal backdrop) with: a text `<input>` (autofocused), a "Place" `<button>` that calls `onPlace(text)`, a "Cancel" `<button>` that calls `onCancel()`. Pressing Enter in the input also calls `onPlace`. Pressing Escape calls `onCancel`.
- [ ] 4.2 In `App.tsx`, add `showSpeechBubbleModal: boolean` state. Modify `handlePlaceSticker`: if `def.requiresText === true`, set `showSpeechBubbleModal = true` and store the pending sticker def in a `pendingTextStickerRef` instead of placing immediately.
- [ ] 4.3 In `App.tsx`, add `handleSpeechBubblePlace(text: string)`: create the `StickerDescriptor` from the pending def (same centering logic as 2.10) with `text` set, add to stickers, close the modal.
- [ ] 4.4 Render `<SpeechBubbleModal>` in `App.tsx` JSX when `showSpeechBubbleModal` is true, wiring `onPlace={handleSpeechBubblePlace}` and `onCancel={() => setShowSpeechBubbleModal(false)}`.
- [ ] 4.5 In `EmojiCanvas.tsx`, for a sticker node whose descriptor has a `text` field, render an additional Konva `Text` node in the sticker layer overlaid on top of the speech bubble image. Position the text centered within the bubble bounds (approximately `x + width * 0.1`, `y + height * 0.3`, with `width * 0.8` wrapping width).
- [ ] 4.6 Add an "Upload PNG" `<button>` to the Stickers tab in `DecoratePanel.tsx`, above the sticker grid. Clicking it triggers a hidden `<input type="file" accept="image/png">`.
- [ ] 4.7 In `DecoratePanel.tsx`, handle the file input `onChange`: call `URL.createObjectURL(file)`, create a new `StickerDefinition`-like object with `id = crypto.randomUUID()`, `src = objectURL`, `label = file.name`, `category = "custom"`. Add it to a `customStickers` local state array (shown at the top of the Stickers tab as session uploads). Also call `onPlaceSticker` immediately to place it centered on the canvas.
- [ ] 4.8 In `DecoratePanel.tsx`, track custom sticker object URLs in a `useRef` and call `URL.revokeObjectURL` on each URL in a cleanup `useEffect` (runs on unmount).
- [ ] 4.9 Create `src/components/SpeechBubbleModal.test.tsx`. Write tests for: (a) modal renders with a text input and two buttons; (b) clicking "Place" with text calls `onPlace(text)`; (c) clicking "Cancel" calls `onCancel`; (d) pressing Escape calls `onCancel`; (e) pressing Enter calls `onPlace`.
- [ ] 4.10 Run `task lint`, `task typecheck`, and `task test` — fix any errors before moving on.

---

### [ ] 5.0 Export integration + undo/redo for stickers and frames

**Purpose:** Switches export to `stage.toDataURL()` (capturing all layers), hides the checkerboard from the export, and wires sticker/frame actions into the undo/redo history alongside image snapshots.

#### 5.0 Proof Artifact(s)

- Downloaded PNG file (opened in browser/Finder): laser-eyes sticker and "APPROVED" frame are visible in the exported image — demonstrates `stage.toDataURL()` captures all layers.
- Downloaded PNG file: background is transparent (checkerboard tiles not present) — demonstrates Layer 0 is excluded from export.
- Screenshot sequence (4 frames): (1) place sticker; (2) Cmd+Z → sticker gone; (3) Cmd+Shift+Z → sticker back; (4) apply frame, Cmd+Z → frame gone — demonstrates full undo/redo coverage for sticker and frame actions.
- CLI: `task test` output showing all tests pass — demonstrates no regressions.
- CLI: `task typecheck` output showing 0 errors — demonstrates types are correct.

#### 5.0 Tasks

- [ ] 5.1 Create `src/hooks/useStickerHistory.ts`. Copy the structure of `useHistory.ts` exactly, but replace `string` with `StickerDescriptor[]` (import from `stickerTypes.ts`). The hook stores an array of `StickerDescriptor[]` snapshots on the undo stack. Export `{ pushState, undo, redo, canUndo, canRedo, clear }`.
- [ ] 5.2 In `App.tsx`, add `const stickerHistory = useStickerHistory()`. The two history hooks (`useHistory` for images, `useStickerHistory` for stickers) must always be pushed **together** so their stacks stay the same length. Wrap the existing `handlePushState(snapshot)` to also call `stickerHistory.pushState([...stickers])` at the same time.
- [ ] 5.3 Update `handlePlaceSticker`, `handleUpdateSticker`, `handleDeleteSticker`, and `handleToggleFrame` in `App.tsx`: after updating the stickers/frame state, call `pushState(latestSnapshot)` (the last image snapshot) AND `stickerHistory.pushState(newStickers)` to record a history entry for the sticker-only change.
- [ ] 5.4 Update `handleUndo` in `App.tsx`: call both `const imgSnap = imageHistory.undo()` and `const stickerSnap = stickerHistory.undo()`. Apply `imgSnap` as before (set `restoreSnapshot`). Apply `stickerSnap` by calling `setStickers(stickerSnap ?? [])`. Update `canUndo` from `imageHistory.canUndo`.
- [ ] 5.5 Update `handleRedo` in `App.tsx` the same way: call both redo functions, restore both image snapshot and sticker array.
- [ ] 5.6 Add `exportStageAsBlob` to `src/utils/exportUtils.ts`. It accepts a `Konva.Stage` and returns a `Promise<Blob | null>`. Before calling `stage.toDataURL()`:
  - Get `const bgLayer = stage.getLayers()[0]` and call `bgLayer.visible(false)`.
  - Get the safe-zone `Rect` node from Layer 0 (or pass it in as a parameter) and hide it too.
  - Call `const dataUrl = stage.toDataURL({ pixelRatio: 1 })`.
  - Restore `bgLayer.visible(true)`.
  - Convert the data URL to a `Blob` (use `fetch(dataUrl).then(r => r.blob())`).
  - Return the blob.
- [ ] 5.7 Update `handleDownload` in `App.tsx`: replace the `latestSnapshot`-based branch with a call to `exportStageAsBlob(stageRef.current)`. On the returned blob, run `checkFileSizeWarning` and trigger the download as before. Remove the `buildExportCanvas` fallback path (when stickers are in use, the stage is always the source of truth). Keep `buildExportCanvas` in `exportUtils.ts` since it is still tested.
- [ ] 5.8 Handle the case where `stageRef.current` is null in `handleDownload` (e.g., early return with a warning).
- [ ] 5.9 Create `src/hooks/useStickerHistory.test.ts`. Mirror all 8 tests from `useHistory.test.ts`, using `StickerDescriptor[]` snapshots instead of strings (e.g., `pushState([])`, `pushState([{ id: '1', ... }])`).
- [ ] 5.10 Run `task lint`, `task typecheck`, and `task test`. Fix all errors and warnings. Ensure the full suite passes with no regressions before marking this task done.
