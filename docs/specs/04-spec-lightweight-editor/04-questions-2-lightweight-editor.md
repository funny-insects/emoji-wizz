# 04 Questions Round 2 - Lightweight Editor

The Round 1 answers narrowed the scope nicely. These follow-up questions target implementation details needed to write an actionable spec.

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Background Removal — How should "Erase Background" work?

Background removal can range from a simple manual eraser to AI-powered automatic removal. Which approach?

- [x] (A) **Manual eraser tool** — user paints over areas to make them transparent (like a brush that erases pixels). Simple to implement, no external dependencies.
- [ ] (B) **Automatic removal via external API** — integrate a background removal API (e.g., remove.bg, Clipdrop). Requires an API key and network call, but gives one-click results.
- [ ] (C) **Automatic removal via client-side ML** — run a segmentation model in the browser (e.g., ONNX Runtime + a small model). No API key needed, but adds bundle size and may be slow on some devices.
- [ ] (D) **Both manual + automatic** — provide automatic removal as primary, with manual eraser for touch-ups
- [ ] (E) Other (describe)

## 2. Brush/Pen Tool — What is the primary use case?

This helps define the minimal defaults (color, size, behavior).

- [x] (A) **Freehand drawing/doodling** — draw arbitrary strokes on top of the emoji (like MS Paint). Default: black, medium brush.
- [ ] (B) **Annotation/markup** — highlight or mark up areas of the image. Default: semi-transparent red/yellow marker.
- [ ] (C) **Pixel-level touch-up** — fine corrections to the image at pixel level. Default: small brush, color picker.
- [ ] (D) Other (describe)

## 3. Text Tool — Placement and editing behavior?

After a user selects the Text tool and clicks on the canvas:

- [x] (A) **Click-to-place, then inline edit** — clicking the canvas places a text cursor; user types directly on the canvas. Text is finalized on blur/Enter.
- [ ] (B) **Modal/popover input** — clicking the canvas opens a small input box (popover or modal) where the user types text, then it gets placed on the canvas at the clicked position.
- [ ] (C) **Fixed position** — text is always placed at a default position (e.g., center-bottom) and can be dragged to reposition.
- [ ] (D) Other (describe)

## 4. Text Tool — Minimal settings?

Since you chose "minimal" settings, which text options should be available?

- [ ] (A) **Text content only** — user types text, everything else is fixed (one font, one size, white color)
- [ ] (B) **Text + color** — user can pick from a small palette (e.g., 6-8 colors) for the text
- [x] (C) **Text + color + size** — small palette + 3 size presets (small, medium, large)
- [ ] (D) Other (describe)

## 5. Toolbar Sidebar — Which side and behavior?

- [x] (A) **Left side, always visible** — toolbar is always shown on the left when an image is loaded
- [ ] (B) **Left side, collapsible** — toolbar on the left with a toggle to collapse/expand
- [ ] (C) **Right side, always visible** — toolbar on the right, always shown
- [ ] (D) **Appears only in edit mode** — user clicks an "Edit" button to enter edit mode, which shows the toolbar
- [ ] (E) Other (describe)

## 6. Export After Editing — How does the user save their work?

- [ ] (A) **Download button** — a "Download" or "Export" button that saves the flattened canvas as PNG (with transparency)
- [ ] (B) **Auto-update preview** — edits are live; the existing canvas IS the output. User copies/saves via right-click or existing export flow.
- [ ] (C) **Both** — live preview on canvas + explicit download button for the final PNG
- [x] (D) Other (describe)
      Already implemented

## 7. Undo/Redo — Keyboard shortcuts only, or also UI buttons?

- [ ] (A) **Keyboard only** — Ctrl+Z / Ctrl+Shift+Z (Cmd on Mac), no visible buttons
- [x] (B) **Both** — keyboard shortcuts + undo/redo buttons in the toolbar
- [ ] (C) Other (describe)

## 8. "Transparent Background Support" — What does this mean concretely?

You selected this as a separate item from "Erase Background." What specific behavior do you want?

- [x] (A) **Preserve imported transparency** — if the user imports a PNG with transparent areas, those areas stay transparent throughout editing and export (not filled with white)
- [ ] (B) **Toggle checkerboard/solid background** — user can switch between seeing the checkerboard (transparency indicator) and a solid color background for easier editing
- [ ] (C) **Both A and B**
- [ ] (D) Other (describe)
