# 08 Questions Round 1 - Emoji Overlays

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Sticker Assets

Where will the PNG sticker/frame assets come from?

- [ ] (A) I will create/provide real PNG files before implementation starts
- [x] (B) Use free/open-source emoji or sticker packs (e.g., Twemoji, OpenMoji)
- [ ] (C) Start with colored placeholder rectangles/shapes so the feature works end-to-end, and swap in real PNGs later
- [ ] (D) Generate them programmatically using Konva shapes (no external PNG files needed)
- [x] (E) Other (I also want the ability to easily add png files as well to become stickers)

## 2. Frame Layer Order

Frames are described as going "behind or around" the user's image. Which behavior do you want?

- [ ] (A) Frame goes behind the image (user's image is on top, frame is decorative background)
- [x] (B) Frame goes in front of the image (frame border/overlay is drawn on top, image shows through center)
- [ ] (C) Both — the frame has two parts: a back layer and a front overlay, sandwiching the image
- [ ] (D) It depends on the frame — some go behind, some go in front
- [ ] (E) Other (describe)

## 3. Sticker Interaction Model

When a sticker is tapped/placed, what controls are available?

- [ ] (A) Drag to reposition only (no resize/rotate for simplicity)
- [ ] (B) Drag + resize (pinch or corner handles) only
- [ ] (C) Drag + resize + rotate — full Konva transformer widget
- [x] (D) Drag + resize + rotate + delete (X button or Delete key)
- [ ] (E) Other (describe)

## 4. Sticker Persistence and History

How should stickers interact with undo/redo?

- [x] (A) Stickers participate in undo/redo — placing/moving/deleting a sticker is undoable
- [ ] (B) Stickers are live Konva nodes only; undo/redo only applies to the painted image layer (existing behavior), not stickers
- [ ] (C) Stickers are flattened into the image immediately on placement (like the current brush tool) and undo works on the flattened result
- [ ] (D) Other (describe)

## 5. Speech Bubble Text Editing

The speech bubble sticker has editable text. How should this work?

- [ ] (A) A plain text input appears when you place the speech bubble sticker, same as the current text tool
- [ ] (B) Double-click the placed sticker to open an inline text editor
- [x] (C) A modal/popover appears to enter text before placing the sticker
- [ ] (D) No text editing — speech bubble is a fixed image without customizable text
- [ ] (E) Other (describe)

## 6. "Intensifies" Shake Effect

The "intensifies shake effect" meme frame implies animation. Is this:

- [x] (A) An animated GIF export — the canvas shakes rapidly in the exported file
- [ ] (B) A static frame that suggests the "intensifies" meme visually (e.g., motion blur or a blurred duplicate overlay), no actual animation
- [ ] (C) Skip this one for now — it's too complex, implement the static frames first
- [ ] (D) Other (describe)

## 7. Export Integration

Currently, export uses `latestSnapshot` — a flattened data URL from the image layer (Layer 1 only). Stickers and frames live on different layers. How should export work?

- [x] (A) Export should use `stage.toDataURL()` to capture all layers at once (simplest, captures everything)
- [ ] (B) Flatten stickers/frames into the image canvas when the user clicks Export (same approach as the brush tool)
- [ ] (C) Keep current export for the image layer; stickers/frames are a separate optional "composite on export" toggle
- [ ] (D) Other (describe)

## 8. Number of Stickers

The list you provided has ~25 stickers across 5 categories and ~15 frames across 4 categories. Should all of these be in scope for this spec, or should we prioritize a subset?

- [ ] (A) All ~25 stickers + ~15 frames — full list in scope
- [x] (B) One full category of stickers (e.g., Eyes: 6 stickers) + one frame category as an end-to-end proof, remaining are stretch goals
- [ ] (C) Implement the sticker/frame system with 3-5 representative stickers and frames; adding more is trivial once the system works
- [ ] (D) Other (describe)

## 9. Decorate Section UI Placement

You described a new "Decorate" section between Canvas and Optimizer. How should it look?

- [ ] (A) A collapsible panel with two tabs: "Stickers" and "Frames", showing a scrollable grid of options
- [ ] (B) Always-visible section with two tabs, no collapse
- [x] (C) A floating toolbar/sidebar that appears when an image is loaded
- [ ] (D) Inline below the canvas, always visible, no tabs — just two labeled rows of items
- [ ] (E) Other (describe)
