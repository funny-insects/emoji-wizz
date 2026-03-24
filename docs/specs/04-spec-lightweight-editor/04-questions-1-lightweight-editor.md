# 04 Questions Round 1 - Lightweight Editor

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Scope & Priority — Which editing tools are essential for this spec?

The overview lists 14+ tools. To keep this spec manageable, which tools should be included in Spec #4? (Select all that apply for THIS spec; the rest can go in a follow-up spec.)

- [ ] (A) **Crop** — select and trim a rectangular region of the image
- [ ] (B) **Resize** — scale the image up or down within the canvas
- [ ] (C) **Rotate** — rotate the image by degrees (90° snaps and/or free rotation)
- [x] (D) **Erase background** — remove the background to make it transparent
- [x] (E) **Brush/pen** — freehand drawing tool on the canvas
- [x] (F) **Text** — add text labels/overlays to the image
- [ ] (G) **Outline/stroke** — add an outline around the emoji subject
- [ ] (H) **Shadow/glow** — add drop shadow or glow effect
- [ ] (I) **Sticker layers** — layer multiple images/stickers on the canvas
- [ ] (J) **Shape tools** — draw rectangles, circles, lines, etc.
- [ ] (K) **Blur/sharpen** — adjust image clarity
- [ ] (L) **Contrast/saturation** — adjust color levels
- [ ] (M) **Fill/recolor** — bucket fill or color replacement
- [x] (N) **Transparent background support** — ensure transparent backgrounds are preserved throughout editing
- [ ] (O) Other (describe)

## 2. Canvas Library — Should we introduce a canvas library?

The current implementation uses raw HTML5 Canvas API. Adding multiple interactive editing tools (drag handles, selection boxes, layers) with raw canvas is complex. Should we introduce a library?

- [ ] (A) **Yes, use Fabric.js** — mature, feature-rich canvas library with built-in object manipulation, selection, transformations. Larger bundle but saves significant development effort.
- [ ] (B) **Yes, use Konva.js** — lighter alternative with React bindings (react-konva). Good for layered, interactive canvases.
- [ ] (C) **Stay with raw HTML5 Canvas** — keep the bundle small, implement tool logic manually. More effort per tool but no external dependency.
- [x] (D) Other (describe)
      Disregard this task this questions.md was generated before the project was migrated to Konva

## 3. Undo/Redo — How should we handle edit history?

- [x] (A) **Full undo/redo stack** — users can undo/redo any number of steps (standard Ctrl+Z / Ctrl+Shift+Z)
- [ ] (B) **Single undo** — only undo the most recent action
- [ ] (C) **No undo in this spec** — defer undo/redo to a later spec; users can re-import the image to start over
- [ ] (D) Other (describe)

## 4. Tool UI — How should editing tools be presented?

- [x] (A) **Toolbar sidebar** — vertical toolbar on the left or right side with icons for each tool
- [ ] (B) **Toolbar strip** — horizontal toolbar above or below the canvas
- [ ] (C) **Floating palette** — draggable tool palette that can be repositioned
- [ ] (D) **Minimal/inline** — tools appear contextually near the canvas (e.g., on hover or selection)
- [ ] (E) Other (describe)

## 5. Non-Destructive vs. Destructive Editing

- [ ] (A) **Non-destructive (layered)** — each edit is a separate layer/operation that can be toggled or removed independently. More complex but flexible.
- [x] (B) **Destructive (flatten on apply)** — each edit modifies the underlying pixel data directly. Simpler to implement, pairs well with undo/redo for reversal.
- [ ] (C) **Hybrid** — some tools are non-destructive (text, stickers) while others are destructive (crop, color adjustments)
- [ ] (D) Other (describe)

## 6. Tool Settings — How detailed should per-tool settings be?

For tools like brush/pen, text, shapes: how much configurability?

- [x] (A) **Minimal** — fixed defaults. E.g., one brush size, one font, basic colors. Keep it simple.
- [ ] (B) **Moderate** — a few options per tool. E.g., brush size slider (3 sizes), a color picker, 2-3 font choices.
- [ ] (C) **Full** — comprehensive settings. E.g., continuous brush size, opacity, hardness; full font selection; gradient fills.
- [ ] (D) Other (describe)

## 7. Proof Artifacts — What would demonstrate this feature works?

What proof artifacts are most valuable for validating the editor?

- [ ] (A) **Screenshot** — before/after screenshots showing an image being edited with each tool
- [ ] (B) **E2E test** — Playwright tests that exercise each tool programmatically
- [ ] (C) **Unit tests** — Tests for canvas manipulation utility functions
- [ ] (D) **Screen recording / GIF** — short clip showing interactive tool usage
- [x] (E) All of the above
- [ ] (F) Other (describe)

## 8. Integration with Existing Canvas

The current `EmojiCanvas` component handles image display, checkerboard backgrounds, and safe zone guides. How should the editor integrate?

- [x] (A) **Extend EmojiCanvas** — add editing capabilities directly to the existing component (may get complex)
- [ ] (B) **New EditorCanvas component** — create a separate editor canvas that replaces or wraps EmojiCanvas when editing
- [ ] (C) **Overlay approach** — keep EmojiCanvas for display, add a transparent editing overlay canvas on top
- [ ] (D) Other (describe)
