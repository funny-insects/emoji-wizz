# 02 Questions Round 1 - Smart Emoji Canvas

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

---

## 1. Canvas Rendering Technology

What technology should power the emoji canvas?

- [x] (A) **HTML5 Canvas API** — low-level pixel manipulation, great for drawing tools; requires manual state management
- [ ] (B) **SVG** — resolution-independent, good for vector shapes and layers; less suited for raster/pixel work
- [ ] (C) **Fabric.js** — canvas library that adds object model (layers, selection, transforms) on top of HTML5 Canvas
- [ ] (D) **Konva.js** — similar to Fabric.js but React-friendly via `react-konva`
- [ ] (E) **Plain CSS/DOM** — simple div-based approach; limited for editing but fine if this spec is just the container/shell
- [ ] (F) Other (describe)

---

## 2. Scope of This Spec — Canvas vs. Editor

The overview lists the Smart Emoji Canvas and Lightweight Editor as separate specs (#2 and #4). What does this spec deliver vs. defer?

- [x] (A) **Canvas shell only** — just the canvas area, preset selector, background color/transparency toggle; no drawing tools yet
- [ ] (B) **Canvas + basic drawing** — canvas surface plus at least one drawing tool (e.g., brush or eraser) to prove it works
- [ ] (C) **Canvas + image import** — canvas surface plus the ability to upload/paste an existing image onto it
- [ ] (D) **Canvas + image import + preset auto-resize** — upload an image and have it automatically resized to the selected preset
- [ ] (E) Other (describe)

---

## 3. Slack Sizing Requirements

What are the exact Slack emoji canvas dimensions this spec must support?

- [x] (A) **128×128 px** — common Slack recommended size
- [ ] (B) **128×128 px max, any aspect ratio** — Slack allows non-square but recommends square
- [ ] (C) **Multiple Slack sizes** — e.g., 32×32 (display), 128×128 (upload), 512×512 (HD)
- [ ] (D) I don't know the exact spec — use whatever is standard for Slack custom emojis
- [ ] (E) Other (describe)

---

## 4. Platform Presets — Slack Required, Others Stretch

The overview says Discord and Apple are stretch goals. For this spec, which presets should be implemented?

- [x] (A) **Slack only** — one preset, keep it simple
- [ ] (B) **Slack + Discord** — two presets (Discord: 128×128, max 256KB)
- [ ] (C) **Slack + Discord + Apple** — three presets
- [ ] (D) **Preset framework only** — build the data structure and UI for presets, but only populate Slack for now (easy to add more later)
- [ ] (E) Other (describe)]
      But design so that Apple and Discord can easily be added later.

---

## 5. Transparent Background

How should background transparency be handled on the canvas?

- [x] (A) **Checkerboard pattern** — classic transparency indicator (like Photoshop), user sees it but it's not exported
- [ ] (B) **Solid white default, toggle to transparent** — simple on/off switch
- [ ] (C) **Color picker for background** — user can set any solid color or transparent
- [ ] (D) **Always transparent** — no background option, canvas is always see-through
- [ ] (E) Other (describe)

---

## 6. Canvas Margins / Safe Zone

The overview mentions "margins" as part of the platform-aware presets. What does this mean?

- [ ] (A) **Visual guides only** — show a dashed border or overlay indicating the safe area; not enforced
- [x] (B) **Content padding** — the canvas drawing area is inset from the full emoji size (e.g., 10% padding on each side)
- [ ] (C) **Enforced clipping** — content outside the margin is clipped/hidden
- [ ] (D) **I'm not sure** — include a reasonable default and we can refine later
- [ ] (E) Other (describe)

---

## 7. Preset Selection UI

How should the user select a platform preset?

- [x] (A) **Dropdown / select** — compact, simple
- [ ] (B) **Radio buttons / segmented control** — visible options side by side
- [ ] (C) **Card-style selector** — visual cards showing platform icon + size info
- [ ] (D) **No UI yet** — hardcode Slack preset for this spec, add selector UI in a later spec
- [ ] (E) Other (describe)

---

## 8. Image Upload / Starting Point

How does a user get content onto the canvas?

- [ ] (A) **Upload an image file** — drag-and-drop or file picker (PNG, JPG, GIF, WebP)
- [ ] (B) **Paste from clipboard** — Ctrl+V to paste an image
- [x] (C) **Both A and B**
- [ ] (D) **Neither yet** — this spec is just the blank canvas; image import comes in a later spec
- [ ] (E) Other (describe)

---

## 9. Proof Artifacts

What would best demonstrate that this spec is complete? (Select all that apply)

- [ ] (A) **Screenshot** — canvas visible in browser with correct dimensions and checkerboard/transparent background
- [ ] (B) **Screenshot** — preset selector shown with Slack dimensions reflected on canvas
- [ ] (C) **Screenshot** — image uploaded/pasted onto canvas, auto-fitted to preset size
- [x] (D) **Playwright E2E test** — automated test that opens the app and verifies canvas renders at correct dimensions
- [x] (E) **Unit test** — test that preset config returns correct dimensions for each platform
- [ ] (F) Other (describe)
