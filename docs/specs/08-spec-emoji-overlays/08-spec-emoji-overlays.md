# 08-spec-emoji-overlays

## Introduction/Overview

This feature adds a "Decorate" system to Emoji Wizz that lets users place stickers (small transparent overlays) and frames (full-canvas borders) on top of their emoji image before export. Stickers are draggable, resizable, rotatable Konva nodes rendered above the image. Frames are canvas-sized overlays rendered in front of the image. Both composite automatically on export via `stage.toDataURL()`.

The goal is to let a Slack admin create fun reaction emojis — laser eyes, party hats, approval stamps — entirely within Emoji Wizz, with no external image editor needed.

## Goals

- Users can pick a sticker from a curated library and place it on the canvas with full drag/resize/rotate/delete control.
- Users can apply a frame overlay that wraps around the entire canvas image.
- Users can upload any custom PNG from their filesystem and place it as a sticker.
- Speech bubble stickers support editable text entered before placement.
- Export captures all layers (image + stickers + frames) in a single composited output.
- Sticker placement, movement, and deletion participate in undo/redo.

## User Stories

**As a Slack admin creating custom emojis**, I want to add stickers like laser eyes to my image so that I can quickly make fun reaction emojis without a separate image editor.

**As a Slack admin**, I want to apply an "APPROVED" stamp frame to my emoji so that I can convey reaction meaning with a recognizable visual format.

**As a Slack admin**, I want to upload my own PNG file as a sticker so that I can use branded or team-specific overlays not in the built-in library.

**As a Slack admin**, I want sticker placement to be undoable so that I can experiment freely without fear of ruining my work.

## Demoable Units of Work

### Unit 1: Sticker System — Eyes Category

**Purpose:** Proves the sticker architecture end-to-end — library UI, asset loading, Konva node placement, and interaction model — using the Eyes category as the initial set.

**Functional Requirements:**

- The system shall add a floating Decorate sidebar to the canvas area that becomes visible when an image is loaded.
- The sidebar shall contain two tabs: "Stickers" and "Frames".
- The Stickers tab shall display the Eyes category with the following 6 stickers: laser eyes, heart eyes, googly eyes, crying tears, sparkle eyes, sunglasses.
- Sticker assets shall be sourced from a free/open-source pack (Twemoji or OpenMoji), stored as PNG files in `src/assets/stickers/`.
- The system shall render each sticker as a Konva `Image` node on a dedicated sticker layer (Layer 3) above the existing overlays layer.
- The user shall be able to click a sticker in the sidebar to place it centered on the canvas.
- The user shall be able to drag the sticker to reposition it anywhere on the canvas.
- The user shall be able to resize and rotate the sticker using the Konva `Transformer` widget (corner handles + rotation handle).
- The user shall be able to delete a selected sticker by pressing the Delete/Backspace key or clicking an "X" delete button shown when the sticker is selected.
- Clicking outside any sticker shall deselect the current sticker and hide the Transformer.
- Multiple stickers may be placed on the canvas simultaneously.

**Proof Artifacts:**

- Screenshot: Decorate sidebar visible alongside the canvas with Eyes stickers in a grid demonstrates the sidebar UI exists and renders correctly.
- Screen recording / screenshot sequence: Place laser eyes sticker, drag to reposition, resize with handles, rotate, then delete with the X button — demonstrates the full sticker interaction model.

---

### Unit 2: Frame System — Reactions Category

**Purpose:** Proves the frame architecture — full-canvas PNG overlay rendered in front of the image, applied/removed with one click.

**Functional Requirements:**

- The Frames tab in the Decorate sidebar shall display the Reactions category with the following 4 frames: "APPROVED" stamp, "NICE" banner, "100" frame, "NO" red circle-slash.
- Frame assets shall be full-canvas-sized PNGs (matching the active preset dimensions) stored in `src/assets/frames/`.
- The system shall render the active frame as a Konva `Image` node on a frame layer (Layer 4) above all sticker layers, so it composites on top of the user's image.
- The user shall be able to activate a frame by clicking it in the sidebar — only one frame may be active at a time.
- The user shall be able to deactivate/remove the current frame by clicking the active frame again (toggle off).
- The frame shall fill the entire canvas (0, 0, preset.width, preset.height) with no resize or drag controls — it is always full-canvas.
- Frames shall scale correctly when the user switches platform presets (the frame node updates to the new canvas dimensions).

**Proof Artifacts:**

- Screenshot: "APPROVED" frame applied over a custom emoji image, visible in the canvas — demonstrates frame renders in front of image.
- Screenshot: Frames tab showing the 4 Reactions frames in a grid with the active frame highlighted — demonstrates the selection UI.

---

### Unit 3: Speech Bubble Text + Custom PNG Sticker Upload

**Purpose:** Covers the two special-case sticker types that need extra interaction beyond simple click-to-place.

**Functional Requirements:**

- The system shall include a speech bubble sticker in the Accessories category.
- When the user clicks the speech bubble sticker in the sidebar, the system shall show a modal/popover prompting the user to enter bubble text before placing the sticker.
- The user shall be able to confirm text entry (Enter or "Place" button) to place the speech bubble sticker on the canvas with the entered text rendered inside the bubble.
- The user shall be able to cancel the modal without placing a sticker (Escape or "Cancel" button).
- The Stickers tab shall include an "Upload PNG" button that opens a file picker accepting PNG files.
- The system shall load the selected PNG file and place it on the canvas as a sticker node, with the same drag/resize/rotate/delete behavior as built-in stickers.
- The uploaded sticker shall also appear as a thumbnail in the sidebar for re-use within the current session (not persisted across page reloads).

**Proof Artifacts:**

- Screenshot: Modal/popover open with a text field visible after clicking speech bubble — demonstrates the text entry flow.
- Screenshot: Speech bubble sticker on the canvas with user-entered text — demonstrates text is rendered inside the bubble.
- Screenshot: Custom PNG uploaded and placed as a sticker on the canvas — demonstrates the upload flow works end-to-end.

---

### Unit 4: Export Integration + Undo/Redo for Stickers

**Purpose:** Ensures stickers and frames appear in the exported file and that the entire decorated state is undoable.

**Functional Requirements:**

- The system shall update the export pipeline to use `stage.toDataURL()` (capturing all layers) instead of `latestSnapshot` (image layer only), so stickers and frames appear in the downloaded file.
- The system shall hide Layer 0 (checkerboard background) and the safe-zone guide rect before calling `stage.toDataURL()`, and restore their visibility after, so the export has a transparent background (not a grey checkerboard).
- The existing size warning check (`checkFileSizeWarning`) shall still run on the exported blob.
- The system shall track sticker state (list of active stickers with their node IDs, source images, positions, scales, and rotations) alongside the existing image snapshot in the history stack.
- Placing a sticker, moving/resizing/rotating a sticker (on pointer-up), and deleting a sticker shall each push a new history entry.
- Pressing Cmd/Ctrl+Z shall undo the last sticker action, restoring the canvas to the previous sticker state.
- Pressing Cmd/Ctrl+Shift+Z shall redo the last undone sticker action.
- Applying or removing a frame shall push a history entry and be undoable.

**Proof Artifacts:**

- Downloaded PNG file opened after export: sticker and frame are visible in the image file (not just on screen) — demonstrates export captures all layers.
- Downloaded PNG file: background is transparent (checkerboard not visible) — demonstrates Layer 0 is excluded from export.
- Screenshot sequence: Place sticker → Cmd+Z → sticker disappears → Cmd+Shift+Z → sticker reappears — demonstrates undo/redo works for stickers.

---

## Non-Goals (Out of Scope)

1. **Animated GIF "intensifies" shake effect**: Generating animated GIFs client-side requires a browser GIF encoder (e.g., `gif.js`) and multi-frame rendering logic. This is a stretch goal, not in this spec.
2. **Remaining sticker categories (Mouth/face, Headwear, Effects, Accessories beyond speech bubble)**: The system is designed to make adding more stickers trivial. These categories are stretch goals.
3. **Remaining frame categories (Status, Seasonal, Meme formats beyond Reactions)**: Same — stretch goals once the frame system is proven.
4. **Sticker persistence across sessions**: Custom uploaded stickers are available only within the current session; no localStorage or backend storage.
5. **Mobile/touch support**: Touch events (pinch-to-resize) are not required for this spec. Mouse interaction only.
6. **Deep fried glow effect**: This involves pixel-level image manipulation (saturation, noise) and is outside the scope of the sticker/frame system.

## Design Considerations

- The floating Decorate sidebar appears to the right of the canvas (or below on narrow viewports) only when an image is loaded — it is hidden on the empty canvas state.
- The sidebar has two tabs: "Stickers" and "Frames", matching the existing section/tab styling in the app.
- Stickers in the sidebar are shown as a scrollable grid of thumbnails (~48×48px) with a label underneath.
- The active frame is highlighted with a border/ring indicator in the Frames grid.
- The Konva `Transformer` widget appears around the selected sticker with standard corner handles and a rotation anchor.
- A small circular "X" delete button appears near the top-right corner of the selected sticker (absolutely positioned over the canvas, following the sticker's bounding box).
- The speech bubble modal is a small centered popover with a single text input, a "Place" button, and a "Cancel" button.
- When no image is loaded, the Decorate sidebar is not rendered (consistent with how the Toolbar is disabled without an image).

## Repository Standards

- New components go in `src/components/` (e.g., `DecoratePanel.tsx`, `StickerLayer.tsx`).
- New utilities go in `src/utils/` (e.g., `stickerHistory.ts`).
- Sticker PNG assets go in `src/assets/stickers/`, frame PNGs in `src/assets/frames/`.
- Tests are colocated with source files (`*.test.tsx` / `*.test.ts`).
- Use `task lint`, `task typecheck`, and `task test` to verify all changes.
- Follow existing TypeScript strict-mode patterns and React functional component conventions used throughout the codebase.
- Konva layer access follows the existing pattern: `Konva.stages[0]?.getLayers()[n]`.

## Technical Considerations

- **Layer numbering**: The existing stage has layers [0] checkerboard, [1] image, [2] overlays. This spec adds [3] stickers and [4] frames. All layer indices in `EmojiCanvas.tsx` that reference `getLayers()[2]` (brush, text) must remain unchanged.
- **Sticker undo/redo**: The current `useHistory` hook stores image data URL snapshots. Sticker state cannot be captured in a data URL. A parallel sticker history stack should be maintained — either in a new `useStickerHistory` hook or by extending `useHistory` to store a compound `{ imageSnapshot, stickerSnapshot }` object. The `stickerSnapshot` is a serialized array of sticker descriptors (id, src, x, y, scaleX, scaleY, rotation).
- **Export — checkerboard exclusion**: Before calling `stage.toDataURL()`, set `layer0.visible(false)` and hide the safe-zone `Rect`. Restore after. The Konva `pixelRatio` should be set to 1 (matching current behavior).
- **Frame asset sizing**: Frame PNGs should be designed at 128×128px (Slack preset) and scaled to `preset.width × preset.height` by the Konva Image node. If the preset changes, the frame node's width/height props update accordingly.
- **Custom PNG upload**: Use `URL.createObjectURL()` + `new Image()` to load the file into a Konva Image node. Revoke the object URL after the image loads to avoid memory leaks.
- **Sticker asset sourcing**: Twemoji SVGs can be converted to PNG at 64×64px using a build-time script or sourced directly as PNGs from the Twemoji CDN (for bundled assets, download and commit the PNGs to `src/assets/stickers/`).
- **Intensifies GIF (stretch goal)**: Would require `gif.js` or `jsgif`, rendering N frames of the stage at slight x/y offsets, and encoding to GIF. This is separate from the PNG/WebP export path and should be added as a distinct export option.

## Security Considerations

- Custom PNG uploads are processed entirely client-side — no data is sent to any server. Use `URL.createObjectURL()`, not `FileReader.readAsDataURL()`, to avoid storing large base64 strings in memory unnecessarily.
- No API keys, tokens, or credentials are involved in this feature.
- Sticker assets (Twemoji/OpenMoji) must be verified to use a permissive license (Twemoji: CC-BY 4.0 / MIT; OpenMoji: CC-BY-SA 4.0) before bundling.

## Success Metrics

1. **End-to-end sticker placement**: A user can place a laser eyes sticker, drag/resize/rotate it, and export a PNG where the sticker is visible — in under 30 seconds.
2. **Frame compositing**: Applying the "APPROVED" frame and exporting produces a PNG where the frame visually surrounds the emoji image.
3. **Undo/redo parity**: Every sticker action (place, move, delete, frame apply/remove) is undoable with Cmd+Z.
4. **Export transparency**: The exported PNG has a transparent background when no brush strokes cover the checkerboard area.
5. **No regressions**: All existing `task test` unit tests and `task typecheck` checks pass after implementation.

## Open Questions

1. Should the floating sidebar be on the right side of the canvas or below it on narrow screens? (CSS layout choice for implementation — no spec decision needed, but implementor should decide at build time.)
2. For the speech bubble sticker: is the text rendered as a Konva `Text` node composited with the bubble PNG, or baked into the PNG at placement? (Implementation decision — compositing as separate Konva nodes is recommended for simplicity.)
3. The "Upload PNG" button — should uploaded stickers persist in a sidebar slot for re-placing, or should they auto-place immediately and not appear in the sidebar? (Spec says they appear in the sidebar for re-use within the session, but this can be simplified to auto-place-only if desired.)
