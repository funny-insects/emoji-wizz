# 17 Questions Round 1 - Multi-Image Canvas

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. What Is the Core Problem Being Solved?

The current app is built around a single "base image" that you edit, with stickers placed on top. What's the main limitation this feature addresses?

- [X] (A) I want to compose emojis from scratch using multiple source images (no single "hero" image)
- [X] (B) I want to paste a bunch of reference photos and combine/crop elements from each
- [ ] (C) I want to layer multiple images freely like a collage/composition tool
- [ ] (D) I want to replace the sticker system with a proper image layer system
- [ ] (E) Other (describe)

## 2. How Does This Interact With the Current Editing Tools?

Today the brush, eraser, crop, and transform tools operate on the single base image. With multiple images on canvas, which editing tools need to work per-image?

- [ ] (A) Just position, scale, and rotation (like the sticker system, but for any image)
- [ ] (B) Position/scale/rotation + flip/mirror per image
- [X] (C) Full editing per image: brush, eraser, crop, background removal on each image independently
- [ ] (D) The old base image tools go away entirely — we just need free positioning of images
- [ ] (E) Other (describe)

## 3. How Are Images Added to the Canvas?

- [ ] (A) Clipboard paste only (Ctrl/Cmd+V drops an image anywhere on canvas)
- [ ] (B) File picker (click to browse) and clipboard paste
- [ ] (C) Drag-and-drop from desktop + clipboard paste
- [X] (D) All of the above
- [ ] (E) Other (describe)

## 4. What Happens to the Existing Features?

Does adopting multi-image canvas mean replacing the current single-base-image workflow, or is this an additional mode?

- [ ] (A) Full replacement — the app becomes multi-image only; no more "base image" concept
- [X] (B) New mode — users choose between "single image editor" (current) and "multi-image canvas" (new)
- [ ] (C) The current workflow is kept, but images pasted via clipboard become freely movable instead of replacing the base image
- [ ] (D) Other (describe)

## 5. Layering and Z-Order

With multiple images, they'll overlap. How should layer order (z-order) be controlled?

- [ ] (A) Automatically ordered by import time (first pasted = bottom layer)
- [X] (B) Users can manually reorder layers via a layer panel
- [ ] (C) Simple "bring to front" / "send to back" buttons when an image is selected
- [ ] (D) No explicit layering needed — last pasted is always on top
- [ ] (E) Other (describe)

## 6. Image Interactions and Selection

How should selecting and manipulating individual images work?

- [X] (A) Click to select, drag to move, corner handles to resize/rotate (same as current sticker behavior)
- [ ] (B) Click to select, then separate toolbar buttons for operations
- [ ] (C) Multi-select (shift-click or box select) to move/scale/delete multiple at once
- [ ] (D) Other (describe)

## 7. Deletion and Undo

- [ ] (A) Delete key removes the selected image; undo/redo via existing Cmd+Z system
- [ ] (B) Each image gets a visible delete button (like current stickers have)
- [X] (C) Both A and B
- [ ] (D) Other (describe)

## 8. Export Behavior

How should the multi-image canvas export?

- [X] (A) Same as today — flatten everything to the final platform preset (128×128 or 512×512)
- [ ] (B) Export each image as a separate file
- [ ] (C) User can choose to export the full composition or individual images
- [ ] (D) Other (describe)

## 9. What Does "Free Rein" Mean for You?

When you said "free rein over them", what matters most?

- [ ] (A) Freely move, resize, and rotate any image anywhere on the canvas
- [ ] (B) Edit each image independently (apply brush, eraser, etc. to specific images)
- [ ] (C) Control which images appear in front of or behind others
- [X] (D) All of the above
- [ ] (E) Other (describe)

## 10. Scope Check — Is This One Spec or Multiple?

Given the complexity, would you prefer to:

- [ ] (A) Do a focused first spec: "images can be pasted and freely positioned/resized/rotated on canvas" (no per-image editing tools yet)
- [ ] (B) Bigger scope: redesign the entire canvas model to support layers + per-image editing
- [X] (C) Middle ground: replace the base image concept, support multiple freely-movable images, keep existing draw/erase tools applying to whichever image is "active"
- [ ] (D) Other (describe)
