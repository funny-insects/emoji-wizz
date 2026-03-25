# 11 Questions Round 1 - Image Transform Tools (Crop, Rotate, Flip)

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Crop Tool Behavior

How should the crop tool work on the canvas?

- [ ] (A) **Freeform rectangle** — user drags a resizable rectangle over the image, then confirms to crop
- [x] (B) **Fixed aspect ratio** — crop rectangle locked to 1:1 square (since emojis are square)
- [ ] (C) **Both** — default to square but allow freeform with a toggle
- [ ] (D) Other (describe)

## 2. Rotate Tool Behavior

How should rotation work?

- [x] (A) **90° snap buttons** — rotate left (CCW) and rotate right (CW) by 90° increments only
- [ ] (B) **Free rotation** — a slider or drag handle to rotate by any angle (e.g., 0–360°)
- [ ] (C) **Both** — 90° snap buttons plus a fine-tuning slider for arbitrary angles
- [ ] (D) Other (describe)

## 3. Flip Behavior

What flip directions should be supported?

- [ ] (A) **Horizontal flip only** (mirror left-right)
- [ ] (B) **Vertical flip only** (flip upside down, as you mentioned "clip upside down")
- [x] (C) **Both horizontal and vertical** — separate buttons for each
- [ ] (D) Other (describe)

## 4. Auto-Framing After Transform

You mentioned the image should "automatically frame to fit as best it can on the canvas" after a transform. What does this mean to you?

- [x] (A) **Scale and center** — after crop/rotate/flip, the result is scaled to fill as much of the 512×512 canvas as possible while preserving aspect ratio (like the current import behavior)
- [ ] (B) **Just center** — keep the image at its current size, just re-center it on the canvas
- [ ] (C) **Smart fit** — scale up if the result is too small, scale down if too large, with a minimum content area threshold (e.g., at least 60% of canvas filled)
- [ ] (D) Other (describe)

## 5. UI Placement for Transform Tools

Where should these tools live in the editor UI?

- [x] (A) **In the existing Toolbar** — add crop/rotate/flip buttons alongside pointer, eraser, brush, text
- [ ] (B) **In a new "Transform" panel/section** — a separate collapsible section (similar to DecoratePanel)
- [ ] (C) **In a contextual toolbar** — appears only when an image is loaded, near the canvas
- [ ] (D) Other (describe)

## 6. Interaction with Existing Edits

If the user has already painted brush strokes or erased parts of the image, then applies a transform (crop/rotate/flip):

- [x] (A) **Transforms include all edits** — brush strokes, erased areas, etc. are all part of the image being transformed (this matches the current architecture where edits are flattened onto the offscreen canvas)
- [ ] (B) **Transforms only affect the original image** — edits are preserved separately and re-applied after transform
- [ ] (C) Other (describe)

## 7. Undo/Redo for Transforms

Each transform operation should:

- [x] (A) **Be a single undo step** — pressing Ctrl+Z after a rotate undoes the entire rotation
- [ ] (B) **Be granular** — for crop, undo should first revert the confirmation, then the crop box placement
- [ ] (C) Other (describe)

## 8. Ordering of Operations

Should there be any restriction on when transforms can be applied?

- [x] (A) **Anytime** — user can crop, rotate, flip at any point during editing, even after adding stickers/text
- [ ] (B) **Before decorations** — transforms should only apply before stickers/frames are added
- [ ] (C) **First step only** — transforms happen immediately after upload, before any editing
- [ ] (D) Other (describe)
