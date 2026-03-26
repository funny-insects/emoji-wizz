# 15-spec-frame-controls.md

## Introduction/Overview

Users currently have no control over how thick a frame appears, and once applied, frames feel permanent with no obvious way to remove them. This spec covers two improvements: (1) a thickness slider that lets users scale the frame inward while keeping it anchored to the canvas edge, and (2) a complete remove flow including click-to-toggle, a visible remove button, and undo/redo support.

## Goals

- Allow users to adjust frame thickness from 10%–100% of the original frame size, defaulting to 50% on first apply.
- Keep the frame visually anchored to the outer edge of the canvas at all thickness levels.
- Give users three clear ways to remove an active frame: click-to-deselect, a remove button, and Cmd/Ctrl+Z undo.
- Ensure the exported emoji reflects the exact thickness visible on the canvas.
- Integrate thickness state into the existing undo/redo system so thickness adjustments are independently reversible.

## User Stories

**As a user**, I want to control how thick the frame border is so that it doesn't overwhelm my emoji artwork.

**As a user**, I want the frame to always hug the outer edge of the canvas so it looks like a real border regardless of thickness setting.

**As a user**, I want to remove a frame I've added — by clicking it again, hitting an X button, or pressing undo — so I never feel locked into a choice.

**As a user**, I want undo to step back through my thickness adjustments so I can experiment without losing progress.

## Demoable Units of Work

### Unit 1: Frame Thickness Slider

**Purpose:** Gives users control over frame thickness via an inline slider below the active frame thumbnail.

**Functional Requirements:**

- The system shall track `frameThickness: number` in state, representing a percentage from 10 to 100 (inclusive).
- The system shall default `frameThickness` to 50 whenever a new frame is applied.
- The system shall render the frame image scaled according to `frameThickness`, keeping the frame anchored to the outer edge of the canvas (the frame's outer boundary stays at the canvas boundary; scaling reduces inward reach only).
- The system shall display a range slider (`<input type="range" min="10" max="100">`) inline below the selected frame's thumbnail in the Frames tab of the Decorate Panel.
- The slider shall only be visible when a frame is active.
- The system shall update the canvas frame in real time as the slider moves.
- The system shall push each slider adjustment to the undo history so thickness changes are independently reversible via Cmd/Ctrl+Z.
- The system shall export the emoji with the frame rendered at the user-selected thickness (WYSIWYG export).

**Proof Artifacts:**

- Screen recording: Dragging the slider from 100% to 10% shows the frame shrinking inward while remaining anchored to the canvas corners.
- Screen recording: Exporting at two different thickness levels produces two images where the frame thickness visibly differs.
- Test: `EmojiCanvas` renders frame at reduced scale when `frameThickness < 100` — unit test asserts Konva Image `width`/`height` or transform changes with thickness prop.

### Unit 2: Frame Remove Controls

**Purpose:** Makes it easy and obvious for users to remove a frame through multiple interaction methods.

**Functional Requirements:**

- The system shall allow the user to remove the active frame by clicking its thumbnail again (existing toggle behavior — confirm it works and is not broken by other changes).
- The system shall display a visible "Remove" button (or × icon) near the active frame in the Frames tab whenever a frame is active; clicking it removes the frame.
- The system shall support removing the frame via Cmd+Z (Mac) / Ctrl+Z (Windows/Linux) using the existing undo system.
- When a frame is removed via undo, `frameThickness` shall also reset to the default (50) so re-applying the frame starts fresh.
- The system shall reset `frameThickness` to 50 whenever a frame is removed and a new one is applied.

**Proof Artifacts:**

- Screen recording: Three remove flows demonstrated in sequence — click thumbnail toggle, click × button, Cmd+Z — each successfully removes the frame from the canvas.
- Test: `DecoratePanel` renders remove button when `activeFrameId` is not null, and does not render it when `activeFrameId` is null.
- Test: `handleToggleFrame` called with the currently active frame ID sets `activeFrameId` to null.

## Non-Goals (Out of Scope)

1. **Per-corner or asymmetric thickness**: Thickness is uniform — one slider controls all sides equally.
2. **Frame opacity control**: Fading or transparency adjustments are not part of this spec.
3. **Multiple simultaneous frames**: Only one frame can be active at a time; this is unchanged.
4. **New frame assets**: No new frame PNG files are added as part of this work.
5. **Fine-grained undo per slider tick**: Undo steps are debounced or committed on slider release — not on every pixel of drag movement.

## Design Considerations

The slider appears inline, directly below the thumbnail of the currently active frame in the Frames grid. It should be compact (matching the width of the thumbnail cell or the grid row), with a small label such as "Size" or "Thickness" beside it. The × / Remove button can be an icon button overlaid on the active frame thumbnail (top-right corner) or placed immediately below it alongside the slider. Follow existing `DecoratePanel` CSS class patterns (`.decorate-panel__item`, `.decorate-panel__item--active`) for styling consistency.

## Repository Standards

- All state changes follow the existing pattern in `App.tsx`: local React state with `useCallback` handlers passed as props to child components.
- Undo/redo integrates with the existing `useHistory` / `useStickerHistory` hooks — frame state is already pushed to `stickerHistory` on toggle; thickness adjustments should follow the same approach.
- Frame rendering lives in `EmojiCanvas.tsx` (Konva `<Layer>` + `<KonvaImage>`); thickness scaling should modify the `x`, `y`, `width`, `height` props of the Konva Image, not the DOM.
- New props follow existing TypeScript interface patterns; no new state libraries.
- Tests are colocated with source files (`*.test.tsx`) using Vitest + React Testing Library.
- All changes pass `task lint`, `task typecheck`, and `task test` before merging.
- Pre-commit hooks enforce linting and formatting — do not skip them.

## Technical Considerations

- **Thickness scaling in Konva:** At 100% thickness, the frame renders at `x=0, y=0, width=canvasWidth, height=canvasHeight` (current behavior). At a lower percentage (e.g. 50%), the frame image must be scaled such that it appears thinner while its outer boundary remains at the canvas edge. One approach: scale the frame image UP beyond canvas size (e.g. at 50% visual thickness, render the image at ~150% canvas size offset by `-offset` so the corners still align with canvas corners), then clip to canvas bounds. The exact technique is left to the implementer, but the visual result must be: outer edge of frame = canvas edge, inner edge moves inward proportionally.
- **`frameThickness` state:** Add `frameThickness: number` alongside `activeFrameId` in `App.tsx`. Pass it as a prop to both `EmojiCanvas` (for rendering) and `DecoratePanel` (for the slider UI).
- **Undo for thickness:** Each slider-release (or debounced drag end) calls `stickerHistory.pushState(stickers)` with the current thickness captured alongside. Review how the existing history snapshots work to ensure thickness round-trips through undo correctly.
- **Export:** `exportStageAsBlob()` captures the Konva stage directly, so thickness will be reflected automatically as long as the Konva layer renders correctly.
- **Debouncing:** To avoid flooding undo history while the user drags the slider, push a new undo state only on `onMouseUp` / `onPointerUp` (slider release), not on every `onChange` tick.

## Security Considerations

No specific security considerations identified. No external data, credentials, or user-generated content beyond image uploads (which are already handled).

## Success Metrics

1. **Thickness is adjustable:** Slider moves from 10% to 100% and the frame visually changes on canvas in real time.
2. **Frame stays on edge:** At any thickness value, the frame's outer boundary remains flush with the canvas edge (no gap between frame and canvas border).
3. **All three remove methods work:** Click-toggle, × button, and Cmd/Ctrl+Z each successfully remove the active frame.
4. **Export is WYSIWYG:** Exported PNG frame thickness matches what the user configured in the editor.
5. **Tests pass:** All existing tests continue to pass; new tests for slider and remove button are added.

## Open Questions

1. Should the "Size" slider label display the current percentage value numerically (e.g. "Size: 50%") or is an unlabeled slider sufficient? This is a minor UX detail left to implementer judgement.
2. Should undo of a thickness change on the very first adjustment (back to the default 50%) also remove the frame, or leave the frame active at 50%? Based on Q6 answer (A), undo reverts thickness only — so the frame stays, just at the previous thickness.
