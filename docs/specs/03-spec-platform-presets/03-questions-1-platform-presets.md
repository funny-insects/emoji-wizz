# 03 Questions Round 1 - Platform Presets

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Which platforms should be included in this spec?

The spec overview mentions Slack as required and Discord/Apple as stretch goals. Which should we fully specify here?

- [ ] (A) Slack + Discord only (Apple deferred further)
- [ ] (B) Slack + Apple only (Discord deferred further)
- [x] (C) All three: Slack, Discord, and Apple
- [ ] (D) Just Slack (keep Spec 03 focused on extending the data model and UI, not adding more presets yet)
- [ ] (E) Other (describe)

## 2. What are the target canvas dimensions for each platform?

For each platform we include, confirm the correct dimensions. Common values are listed — correct any that are wrong.

- [x ] (A) Slack: 128×128 px (already implemented) — correct as-is
- [x ] (B) Discord: 128×128 px (same as Slack)
- [ ] (C) Discord: 256×256 px
- [x] (D) Apple (iMessage/Memoji-style): 512×512 px
- [ ] (E) Apple: 160×160 px
- [ ] (F) Other / corrections (describe)

## 3. What additional preset metadata should be captured beyond the current fields?

The current `PlatformPreset` has: `id`, `label`, `width`, `height`, `safeZonePadding`. The spec overview mentions contrast and background transparency as platform-aware properties. Which should we add?

- [ ] (A) `requiresTransparentBackground: boolean` — flags whether the platform expects/requires a transparent PNG background
- [ ] (B) `contrastBoost: boolean` — hints to the editor that the platform needs stronger outlines/contrast for small display
- [x] (C) `maxFileSizeKb: number` — max upload file size for the platform (e.g. Slack has a 128 KB limit)
- [ ] (D) `description: string` — human-readable tooltip explaining platform requirements
- [ ] (E) No additional fields — the current 5 fields are sufficient
- [ ] (F) Other (describe)

## 4. How should the PresetSelector UI be enhanced (if at all)?

Currently it's a bare `<select>` dropdown. For Spec 03, should we improve it?

- [x] (A) Keep it as a simple `<select>` dropdown — no UI changes needed for this spec
- [ ] (B) Add a short description/tooltip per preset (e.g. "128×128 px · transparent bg required")
- [ ] (C) Group presets visually (e.g. "Required" vs "Stretch Goals" sections)
- [ ] (D) Replace with card-based preset picker (larger clickable tiles)
- [ ] (E) Other (describe)

## 5. What should happen when the user switches presets while an image is already loaded on the canvas?

- [x] (A) The image stays and is re-scaled to fit the new canvas dimensions (current behavior for preset switch)
- [ ] (B) The canvas clears — user must re-import the image
- [x] (C) Show a confirmation dialog before switching if an image is loaded
- [ ] (D) Other (describe)

## 6. What proof artifacts best demonstrate this spec is complete?

- [x] (A) Unit tests in `presets.test.ts` asserting each new preset's fields (dimensions, safe zone, metadata)
- [x] (B) Playwright E2E test: open app, switch to each preset, confirm canvas resizes correctly
- [ ] (C) Screenshot of the PresetSelector UI showing all presets listed
- [ ] (D) All of the above
- [ ] (E) Other (describe)
