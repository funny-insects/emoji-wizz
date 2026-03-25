# 09 Questions Round 1 - Background Removal

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Button Placement

The acceptance criteria says the button appears in the "Canvas section." Where exactly should it live?

- [ ] (A) Below the canvas, near the "Choose image" file input row (standalone action row)
- [x] (B) In the Toolbar alongside eraser/brush/text tools (as a one-click action button, not a toggle tool)
- [ ] (C) Other (describe)

## 2. Removal Algorithm

The corner-sampling approach detects the background color — but how should pixels be removed?

- [x] (A) **Flood fill from corners** — only removes pixels that are color-connected to the edges (safe: won't remove a white shirt if background is white, but may leave halos)
- [ ] (B) **Global color match** — removes every pixel in the image that matches the detected color, anywhere it appears (simpler, but riskier for images where subject shares the background color)
- [ ] (C) Either approach is fine, use your best judgment
- [ ] (D) Other (describe)

## 3. Tolerance Exposure

Should the tolerance threshold be user-adjustable, or always use a fixed conservative default?

- [ ] (A) Fixed default only — no UI for tolerance (keep it simple)
- [x] (B) Expose a tolerance slider or number input so users can tune it before/after clicking Remove Background
- [ ] (C) Other (describe)

## 4. Repeated Application

If the first removal leaves a fringe or misses some background, should the user be able to click "Remove Background" again on the already-processed image to remove more?

- [x] (A) Yes — the button should work on whatever the current canvas state is, so repeated clicks progressively clean up
- [ ] (B) No — one-shot only; user should use the eraser for cleanup
- [ ] (C) Other (describe)

## 5. Proof Artifacts

What would best demonstrate this feature is working correctly?

- [ ] (A) Screenshot: before/after side-by-side showing transparent checkerboard where background was
- [x] (B) Unit test: `removeBackground.test.ts` with synthetic ImageData (solid-color border, colored center) asserting border pixels become alpha=0 and center pixels are preserved
- [ ] (C) Both A and B
- [ ] (D) Other (describe)
