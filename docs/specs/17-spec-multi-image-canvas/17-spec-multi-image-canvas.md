# 17-spec-multi-image-canvas.md

## Introduction/Overview

This feature introduces a **Multi-Image Canvas mode** as a new editing mode alongside the existing single-image editor. Instead of one base image with decorative stickers layered on top, users can import any number of images onto the canvas, freely move/resize/rotate each one, apply the full suite of editing tools (brush, eraser, crop, background removal, transforms) to whichever image is currently selected, and control layer order via a layer panel. The goal is to allow users to compose emojis from scratch by combining, cropping, and editing multiple source images in one session.

## Goals

- Allow users to import multiple images onto a single canvas via file picker, clipboard paste, and drag-and-drop.
- Let users select any image and apply all existing editing tools (brush, eraser, crop, transforms, background removal) to that image independently.
- Provide a layer panel so users can manually reorder images (z-order).
- Keep the existing single-image editor mode intact; the new multi-image canvas is an opt-in parallel mode.
- Export the composed multi-image canvas as a single flattened file using the existing platform preset system.

## User Stories

**As a user**, I want to switch into a multi-image canvas mode so that I can compose an emoji from multiple source photos without disrupting my existing single-image workflow.

**As a user**, I want to paste, drag-and-drop, or pick multiple images onto the canvas so that I can pull in all the visual material I need in one place.

**As a user**, I want to click on any image to select it and then use brush, eraser, crop, transforms, and background removal on that specific image so that I can edit each element of my composition independently.

**As a user**, I want to reorder images in a layer panel so that I can control which images appear in front of or behind others.

**As a user**, I want to delete any image with the Delete key or a visible delete button so that I can remove unwanted elements without disrupting the rest of the composition.

**As a user**, I want to export the full multi-image composition as a single flattened emoji file using the existing platform preset so that I can use my composed emoji in Slack, Discord, or Apple platforms without any extra steps.

## Demoable Units of Work

### Unit 1: Mode Switch and Multi-Image Foundation

**Purpose:** Introduce the mode toggle and allow multiple images to be placed, moved, resized, and rotated on the canvas — establishing the foundation of the new mode without breaking the existing editor.

**Functional Requirements:**
- The system shall display a mode toggle (e.g., "Single Image" / "Multi-Image") in the app header or toolbar.
- The system shall preserve the current single-image editor in its entirety when "Single Image" mode is active.
- When "Multi-Image" mode is active, the system shall replace the single-image canvas with a blank 512×512 canvas (checkerboard background).
- The system shall allow the user to add images to the multi-image canvas via: (a) file picker button, (b) clipboard paste (Ctrl/Cmd+V), and (c) drag-and-drop from the desktop.
- Each imported image shall appear as a freely movable, resizable, and rotatable element on the canvas (same interaction model as current stickers: click to select, corner handles to resize/rotate, drag to move).
- The system shall display a visible delete button on the selected image and shall also remove the selected image when the Delete or Backspace key is pressed.
- The system shall support undo/redo (Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z) covering all image additions, movements, resizes, rotations, and deletions in multi-image mode.

**Proof Artifacts:**
- Screen recording: User switches to Multi-Image mode, pastes three images via clipboard, drags and repositions each one, resizes and rotates them, then undoes several steps — demonstrates mode switch, multi-import, free manipulation, and undo.
- Screenshot: Mode toggle visible in UI with Multi-Image mode active and multiple images on canvas.

---

### Unit 2: Per-Image Editing Tools

**Purpose:** Make the full editing toolset (brush, eraser, crop, transforms, background removal) operate on whichever image is currently selected, so users can edit each image independently as part of their composition.

**Functional Requirements:**
- The system shall designate the clicked/selected image as the "active image" for all editing tool operations.
- When an image is active, the brush tool shall draw strokes onto that image's pixel data only, leaving other canvas images unaffected.
- When an image is active, the eraser tool shall erase pixels from that image's pixel data only.
- When an image is active, the crop tool shall crop that image independently; after crop confirmation, the image updates in place on the canvas at its current position.
- When an image is active, the rotate-left, rotate-right, flip-horizontal, and flip-vertical transform buttons shall apply to that image only.
- When an image is active, the background removal tool shall open the existing BackgroundRemovalModal and apply the removal to that image only.
- The system shall visually indicate which image is currently active (e.g., a highlighted selection border or label).
- Undo/redo shall correctly revert or reapply per-image edits alongside positional changes.

**Proof Artifacts:**
- Screen recording: User selects one image, applies brush strokes to it, then selects another image and uses the eraser — demonstrates per-image pixel editing isolation.
- Screen recording: User selects an image, applies crop and background removal — demonstrates per-image crop and bg removal.
- Screenshot: Active image visually distinguished from inactive images on canvas.

---

### Unit 3: Layer Panel

**Purpose:** Give users explicit control over image z-order via a layer panel, so they can decide which images appear in front of or behind others when images overlap.

**Functional Requirements:**
- The system shall display a layer panel listing all images currently on the multi-image canvas, each identified by a thumbnail and a label (e.g., filename or "Image N").
- The layer panel shall reflect the current z-order, with the topmost layer shown at the top of the list.
- The user shall be able to drag layers within the panel to reorder them; the canvas z-order shall update immediately.
- Clicking a layer in the panel shall select that image on the canvas (equivalent to clicking the image directly).
- The layer panel shall be visible only when Multi-Image mode is active.
- Adding or removing an image shall automatically update the layer panel.
- Undo/redo shall correctly restore previous layer ordering.

**Proof Artifacts:**
- Screen recording: User places two overlapping images, opens the layer panel, drags the bottom image to the top of the list — demonstrates live z-order reordering.
- Screenshot: Layer panel showing thumbnails, labels, and current stack order.

---

### Unit 4: Export of Multi-Image Composition

**Purpose:** Ensure the composed multi-image canvas exports correctly as a single flattened file using the existing platform preset and format system.

**Functional Requirements:**
- When Multi-Image mode is active and the user clicks Download, the system shall flatten all images (in correct z-order, with all edits applied) into a single export canvas.
- The export shall use the currently selected platform preset (Slack 128×128, Discord 128×128, Apple 512×512) and file format (PNG, GIF, WebP).
- The export shall include the checkerboard background as transparent (not white) in PNG/WebP exports.
- The existing file size warning system shall apply to the multi-image export output.
- The exported filename shall follow the existing ISO date-based naming convention.

**Proof Artifacts:**
- Downloaded PNG: Exported file from a multi-image composition at 128×128 (Slack preset) showing all images correctly composited — demonstrates correct flattening and scaling.
- Screenshot: Export controls and size warning (if applicable) shown alongside the multi-image canvas before download.

## Non-Goals (Out of Scope)

1. **Per-sticker decorations in multi-image mode**: The existing sticker/frame overlay system will not be ported to multi-image mode in this spec.
2. **Multi-select**: Selecting or transforming multiple images simultaneously is not included.
3. **Text tool in multi-image mode**: The text-drawing tool will not be available per-image in this iteration.
4. **Non-destructive filters**: Color adjustments, opacity sliders, blend modes, or any non-destructive effect layers are out of scope.
5. **Animated GIF composition**: Multi-frame or animated output is not part of this feature.
6. **Cloud sync or collaboration**: All state is local and session-only, same as today.

## Design Considerations

- The mode toggle should be prominent but not disruptive — placed in the app header near the existing controls.
- In multi-image mode, the Toolbar should remain visible and function identically to today, with tool actions routing to the active image.
- The layer panel should be compact — thumbnails + labels in a narrow sidebar, consistent with the existing right-panel layout pattern.
- When no image is selected/active in multi-image mode, editing tools (brush, eraser, etc.) should be visually disabled or show a prompt to select an image first.
- The active image selection border should be visually distinct from the transformer handles (e.g., a colored highlight ring vs. the standard resize handles).

## Repository Standards

- All new components follow the existing pattern: React functional components with TypeScript, colocated `*.test.tsx` unit tests.
- State management stays in React hooks — no external state library. New multi-image state should follow the `useState` + custom hook pattern established by `useImageImport`, `useHistory`, and `useStickerHistory`.
- Konva layer structure: multi-image canvas elements should use the existing `react-konva` component patterns (`<KonvaImage>`, `<Transformer>`, etc.).
- Tasks use `task lint`, `task typecheck`, and `task test` to verify changes; `task test:e2e` for end-to-end coverage.
- New E2E tests go in `e2e/` following the existing Playwright test structure.
- Commit messages and PR discipline follow the patterns in `docs/engineering-process.md`.

## Technical Considerations

- **Mode isolation**: Multi-image mode state (array of image descriptors with per-image canvas data, position, and edit history) should be managed separately from the existing `image`/`displayCanvas`/`stickers` state to avoid coupling. App.tsx will need a top-level mode flag (`singleImage` | `multiImage`).
- **Per-image canvas storage**: Each image in multi-image mode needs its own offscreen `HTMLCanvasElement` (analogous to `displayCanvas` today) to store pixel-level edits independently. Image descriptors will need to carry a `canvasRef` or serialized data URL.
- **Active image routing**: The existing tool handlers (brush, eraser, crop, transforms, bg removal) in `EmojiCanvas.tsx` currently reference a single `displayCanvas`. These will need to be parameterized to accept the active image's canvas instead.
- **History in multi-image mode**: The dual history stacks (`useHistory` + `useStickerHistory`) are not directly reusable for multi-image mode. A new history hook or an extended model will be needed to capture the full multi-image state snapshot (all image positions + all per-image pixel data).
- **Export**: `exportStageAsBlob()` in `exportUtils.ts` already renders the full Konva stage — multi-image mode should be able to reuse this, provided the layer structure is consistent.
- **Performance**: Storing multiple full-resolution offscreen canvases in memory may be heavy. Consider capping the number of images (e.g., max 10) or compressing snapshots in history.

## Security Considerations

- Images are processed entirely client-side; no image data is uploaded to any server.
- Clipboard paste and drag-and-drop should validate that the incoming item is an `image/*` MIME type before processing, consistent with the existing `useImageImport` validation.
- No new credentials, API keys, or external service calls are introduced by this feature.

## Success Metrics

1. **Functional completeness**: All four demoable units pass their proof artifacts with no regressions in the existing single-image editor.
2. **Tool parity**: All editing tools available in single-image mode (brush, eraser, crop, rotate, flip, background removal) work correctly on the active image in multi-image mode.
3. **Performance**: The canvas remains responsive (no perceptible lag on interaction) with up to 5 images loaded simultaneously on a modern laptop.
4. **Test coverage**: New unit tests and at least one E2E test cover the mode switch, multi-image import, per-image editing, layer reordering, and export flows.

## Open Questions

1. Should switching from Multi-Image mode back to Single-Image mode warn the user that their multi-image composition will be lost, or should it be silently discarded?
2. Is there a maximum number of images per canvas session that we should enforce, or leave uncapped for now?
3. Should the layer panel be a collapsible sidebar, or always visible when Multi-Image mode is active?
