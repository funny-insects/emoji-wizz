# 15 Questions Round 1 - Frame Controls

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Frame Thickness Behavior

When the user reduces the frame thickness, how should the frame image scale/crop to achieve a thinner appearance?

- [x] (A) Scale the frame image inward (shrink the entire frame image so it sits closer to the edge, becoming visually thinner)
- [ ] (B) Crop/mask the inner edge of the frame (keep the outer edge locked to the canvas boundary and crop inward, hiding the inner portion)
- [ ] (C) Opacity reduction (not really "thickness" but fade the frame — probably not what you mean, just listing for completeness)
- [ ] (D) Other (describe)

## 2. Thickness Control UI

Where should the frame thickness slider live?

- [ ] (A) In the Frames tab of the Decorate Panel, visible only when a frame is active
- [ ] (B) In the Frames tab of the Decorate Panel, always visible (disabled until a frame is selected)
- [x] (C) Inline below the selected frame thumbnail (appears beneath the active frame's grid cell)
- [ ] (D) In a separate "Frame Settings" section or popover
- [ ] (E) Other (describe)

## 3. Thickness Range

What should the min/max range for frame thickness be?

- [x] (A) 10%–100% of the original frame size (100% = full original thickness, 10% = very thin border)
- [ ] (B) 20%–100% (prevent going too thin where the frame becomes invisible)
- [ ] (C) A fixed pixel range (e.g. 2px to 20px) independent of frame image scaling
- [ ] (D) Let me decide after seeing it — use a sensible default range for now
- [ ] (E) Other (describe)

## 4. Default Thickness

What should the default thickness be when a frame is first applied?

- [ ] (A) Keep the current behavior (full frame image, 100% thickness)
- [x] (B) Start at a thinner default (e.g. 50%) so it's less intrusive out of the box
- [ ] (C) Other (describe)

## 5. Removing a Frame (Undo/Remove)

How should the user be able to remove an active frame? (select all that apply)

- [ ] (A) Clicking the active frame thumbnail again toggles it off (this actually already exists — just needs to be confirmed as the intended UX)
- [ ] (B) A dedicated "Remove frame" button or X icon near the active frame
- [ ] (C) Undo (Cmd+Z / Ctrl+Z) should revert adding a frame
- [x] (D) All of the above
- [ ] (E) Other (describe)

## 6. Thickness in Undo History

If the user changes the thickness and then hits undo, what should happen?

- [x] (A) Undo only reverts the thickness change (not the frame itself)
- [ ] (B) Undo reverts the entire frame (removing it), regardless of how many thickness adjustments were made
- [ ] (C) Each thickness adjustment is its own undo step (fine-grained)
- [ ] (D) Thickness changes are not undoable — only adding/removing the frame is
- [ ] (E) Other (describe)

## 7. Export Behavior

When the user exports the emoji with a custom thickness, should the exported image reflect the adjusted thickness?

- [x] (A) Yes — export should match exactly what the user sees on canvas
- [ ] (B) No — export always uses the full original frame (thickness is preview-only)
- [ ] (C) Other (describe)
