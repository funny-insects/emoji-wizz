# 08 Questions Round 1 - Canvas Zoom Display

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Preset Scope

The app has multiple presets with different canvas sizes (Slack/Discord at 128×128, Apple at 512×512). Should the 4x scale-up apply to all presets, or only to 128×128 presets?

- [x] (A) Only apply to 128×128 presets — 512×512 presets display at their native size (no scaling)
- [ ] (B) Apply to all presets, but scale each to a fixed display target (e.g., always display at 512px wide regardless of preset size)
- [ ] (C) Apply to all presets at 4x (512×512 would display at 2048×2048 — probably not desirable)
- [ ] (D) Other (describe)

## 2. Text Tool Coordinate Mapping

The text overlay input is positioned using raw mouse coordinates. When the canvas is scaled up 4x via CSS `transform: scale(4)`, the mouse coordinates need to be divided by 4 to map back to canvas space. Should this be handled as:

- [ ] (A) Place the text input inside the scaled container so it inherits the scale automatically — no coordinate math needed
- [ ] (B) Keep the text input outside the container and manually divide mouse coordinates by the scale factor
- [x] (C) I'm not sure — handle it however is cleanest technically
- [ ] (D) Other (describe)

## 3. Scale Factor

Should the 4x display scale be fixed, or user-adjustable?

- [x] (A) Fixed at 4x — simple, no UI needed
- [ ] (B) User can toggle between a few options (e.g., 2x / 3x / 4x) via buttons in the toolbar
- [x] (C) User can freely zoom in/out (scroll wheel or +/- buttons)
- [ ] (D) Other (describe)

## 4. Layout / Container Sizing

Currently the canvas area fits snugly inside the card. With scale(4) the visual canvas expands to 512×512 (for 128×128 presets). How should the page layout adapt?

- [ x] (A) The card/container grows to accommodate the scaled canvas — everything else reflows naturally
- [ ] (B) The canvas area gets a fixed height that matches the scaled size, with the canvas centered inside
- [ ] (C) The scaled canvas overflows its original footprint — surrounding elements stay in place and the canvas visually overlaps
- [ ] (D) Other (describe)
