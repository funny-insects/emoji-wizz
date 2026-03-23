# 05 Questions Round 1 - Konva Migration

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Migration Motivation

What is the primary reason for switching from raw HTML Canvas to Konva?

- [x] (A) Preparing for the Lightweight Editor (Spec 04) — Konva's built-in support for dragging, transforming, and layering objects will make editor tools much easier to build
- [ ] (B) Current canvas rendering has bugs or limitations that Konva would solve
- [ ] (C) Team familiarity — the team has more experience with Konva than raw Canvas API
- [ ] (D) Performance — need better rendering performance for complex compositions
- [ ] (E) Other (describe)

## 2. Migration Scope — What Should Change

Which parts of the current canvas system should be migrated to Konva?

- [x] (A) Everything — replace the entire canvas rendering pipeline (checkerboard, safe zone, image display) with Konva equivalents
- [ ] (B) Only the image layer — keep the checkerboard/safe-zone as-is but render the user's imported image via Konva for future interactivity
- [ ] (C) Canvas component + drawing utils — but keep `imageScaling.ts` (pure math) unchanged
- [ ] (D) Other (describe)

## 3. react-konva vs. vanilla Konva

Which Konva integration approach do you prefer?

- [x] (A) Use `react-konva` — declarative React components (`<Stage>`, `<Layer>`, `<Rect>`, `<Image>`) that fit the existing React architecture
- [ ] (B) Use vanilla `konva` — imperative API with manual stage/layer management via refs
- [ ] (C) No preference — let the spec recommend the best fit
- [ ] (D) Other (describe)

## 4. Behavioral Parity

Should the migrated version be a 1:1 behavioral match of the current canvas, or are changes acceptable?

- [ ] (A) Exact parity — checkerboard pattern, safe-zone dashes, image scaling, and all interactions must look and behave identically
- [ ] (B) Functional parity — same features but minor visual differences are acceptable (e.g., slightly different dash pattern, anti-aliasing differences)
- [x] (C) Functional parity plus improvements — OK to leverage Konva features for small wins (e.g., smoother image rendering, better hit detection)
- [ ] (D) Other (describe)

## 5. Existing Tests

How should existing tests be handled during migration?

- [x] (A) Rewrite all canvas-related tests to test Konva equivalents — unit tests mock Konva objects, E2E tests verify rendered output
- [ ] (B) Keep E2E tests as the primary safety net (they test rendered pixels, not implementation) and rewrite only unit tests
- [ ] (C) Delete old unit tests and rely on E2E tests during migration, then write new unit tests for the Konva implementation
- [ ] (D) Other (describe)

## 6. Future Editor Readiness

Should this migration proactively set up any Konva infrastructure for the upcoming Lightweight Editor (Spec 04)?

- [ ] (A) No — keep this spec focused purely on replacing the current canvas with Konva. Editor concerns belong in Spec 04
- [x] (B) Yes, minimal — structure the Konva layers so they're ready for editor tools (e.g., separate layers for background, image, overlays)
- [ ] (C) Yes, moderate — include basic interactivity (image dragging/resizing via Konva Transformer) as a foundation for the editor
- [ ] (D) Other (describe)

## 7. Export Behavior

The current canvas supports `toDataURL()` for export. How should this work with Konva?

- [x] (A) Use Konva's built-in `stage.toDataURL()` / `stage.toBlob()` — should be a straightforward swap
- [ ] (B) Keep a hidden HTML Canvas for export and use Konva only for display
- [ ] (C) No export functionality exists yet, so this isn't a concern for now
- [ ] (D) Other (describe)

## 8. Proof Artifacts

What would best demonstrate the migration is successful?

- [ ] (A) Side-by-side screenshots showing identical rendering before and after migration
- [x] (B) All existing E2E tests passing with the Konva implementation
- [ ] (C) Dev tools showing Konva stage/layers in the DOM instead of raw canvas operations
- [ ] (D) All of the above
- [ ] (E) Other (describe)
