# 06-spec-visual-size-optimizer.md

## Introduction/Overview

The Visual Size Optimizer analyzes a loaded emoji image to detect how well it fills the canvas and surfaces actionable suggestions. It tells the user whether their emoji content is too small or has excess transparent padding — the two most common reasons custom emojis look bad in Slack. It also provides a side-by-side preview of the custom emoji next to a reference emoji so the user can judge relative visual weight at a glance.

## Goals

- Detect the bounding box of non-transparent content in the loaded image using client-side pixel analysis.
- Surface up to two geometric suggestions: "increase content size" (content fills too little of the safe zone) and "trim transparent padding" (excess empty space around the content bounds).
- Render a side-by-side comparison of the custom emoji at actual canvas size next to a bundled reference emoji.
- Keep analysis on-demand (triggered by an "Analyze" button) so it does not slow down normal editing.
- Provide fully unit-tested utility functions for bounds detection and suggestion generation.

## User Stories

**As a user**, I want to click "Analyze" and see whether my emoji fills the canvas well so that I know if it will look too small in Slack.

**As a user**, I want to see specific suggestions like "Trim transparent padding" so that I know exactly what to fix without guessing.

**As a user**, I want to see my emoji next to a familiar reference emoji so that I can judge whether it will look visually consistent with other emojis in Slack.

## Demoable Units of Work

### Unit 1: Bounds Detection Utility

**Purpose:** Implements the core pixel-analysis logic as a pure, testable utility function. This is the foundation all other optimizer features depend on.

**Functional Requirements:**

- The system shall export a `detectContentBounds(imageData: ImageData): { x: number; y: number; width: number; height: number } | null` utility function.
- The function shall scan all pixels and return the tightest bounding box enclosing all pixels with alpha > 0.
- The function shall return `null` when the image is fully transparent (no non-transparent pixels found).
- The function shall operate entirely client-side with no network calls.

**Proof Artifacts:**

- Unit test: `detectContentBounds.test.ts` passes with assertions covering: a fully opaque image (bounds equal full canvas), an image with transparent padding on all sides, and a fully transparent image returning `null` — demonstrates correctness of the pixel-scanning logic.

---

### Unit 2: Suggestion Engine Utility

**Purpose:** Implements the rules that convert detected bounds into human-readable suggestions. Fully decoupled from the UI so it is independently testable.

**Functional Requirements:**

- The system shall export a `generateSuggestions(bounds: ContentBounds, preset: PlatformPreset): string[]` utility function.
- The function shall return a "Trim transparent padding" suggestion when the detected content bounds are smaller than the full canvas dimensions (i.e., there are transparent margins).
- The function shall return an "Increase content size by ~X%" suggestion when the content area is less than 60% of the safe zone area defined by the active preset's `safeZonePadding`.
- The function shall return an empty array when no suggestions apply (content is well-sized and fills the safe zone adequately).
- The percentage in the "Increase content size" suggestion shall be computed as the percentage increase needed to reach 100% of the safe zone area, rounded to the nearest whole number.

**Proof Artifacts:**

- Unit test: `generateSuggestions.test.ts` passes with assertions covering: content that is too small (expects "Increase content size" suggestion), content with excess padding (expects "Trim transparent padding" suggestion), and content that fills the safe zone well (expects empty array) — demonstrates all suggestion rules fire correctly.

---

### Unit 3: Analyzer UI — Analyze Button + Results Panel

**Purpose:** Wires the utilities to the UI: an "Analyze" button triggers analysis and a panel below the canvas displays the suggestions list and the side-by-side reference comparison.

**Functional Requirements:**

- The system shall display an "Analyze" button in the app UI; the button shall be disabled when no image is loaded on the canvas.
- When the user clicks "Analyze", the system shall extract `ImageData` from the Konva stage via `stage.toCanvas().getContext('2d').getImageData(...)` and pass it to `detectContentBounds`.
- The system shall display the suggestion strings returned by `generateSuggestions` as a list below the canvas; each suggestion shall be displayed as a distinct list item.
- If no suggestions are returned, the system shall display a "Looks good!" message instead of an empty list.
- The system shall display a side-by-side comparison section below the canvas showing: the custom emoji rendered at 64×64 px, and a bundled reference emoji image rendered at 64×64 px, with labels ("Your emoji" and "Reference").
- The bundled reference emoji shall be a standard yellow smiley face PNG included in the project's static assets.
- The results panel shall only be visible after at least one analysis has been run.

**Proof Artifacts:**

- Screenshot: App UI with a test image loaded, after clicking "Analyze", showing the results panel with at least one suggestion and the side-by-side comparison — demonstrates the full end-to-end flow is working.
- Unit test: `OptimizerPanel.test.tsx` passes asserting that the "Analyze" button is disabled when no image is provided, and enabled when an image prop is passed — demonstrates correct button state management.

## Non-Goals (Out of Scope)

1. **"Boost outline for readability"**: Requires stroke-width analysis — deferred to a future spec.
2. **"Simplify details for small display"**: Requires high-frequency detail detection — deferred to a future spec or the AI Command Bar.
3. **Auto-analysis on image load or preset change**: Analysis is triggered only on demand via the "Analyze" button in this spec.
4. **Canvas overlay of detected bounds**: The bounds box is not drawn on the Konva stage in this spec — suggestions appear only in the text panel.
5. **Applying suggestions automatically**: The optimizer only surfaces suggestions; it does not execute fixes (e.g., auto-crop, auto-resize).
6. **Multiple reference emojis or user-selectable reference**: Only one bundled reference emoji is included in this spec.

## Design Considerations

- The "Analyze" button should be visually distinct and clearly labeled; position it near the canvas (e.g., below the `PresetSelector` or below the canvas).
- The results panel appears below the canvas after analysis is run. It has two sections: (1) a suggestions list and (2) a side-by-side comparison row.
- The side-by-side comparison uses a fixed 64×64 px display size for both images regardless of the active preset.
- Each suggestion should be easy to read — plain sentence text, no icons required.
- No specific mockups exist; follow the app's existing minimal CSS patterns (consistent with `App.css`).

## Repository Standards

- **Language & framework**: TypeScript (strict mode) + React functional components with hooks.
- **Formatting**: Prettier config — double quotes, semicolons, 2-space indent, trailing commas, 80-char line width.
- **Linting**: ESLint with `max-warnings=0`; no unused variables or parameters.
- **Unit tests**: Vitest + `@testing-library/react`; test files co-located alongside source files (`*.test.ts` / `*.test.tsx`).
- **Task runner**: Use `Taskfile.yml` commands (`task lint`, `task test`, `task typecheck`) to verify work.
- **File organisation**: New utility functions go in `src/utils/`, new components go in `src/components/`, static assets go in `public/` or `src/assets/`.

## Technical Considerations

- **Konva pixel extraction**: Use `stageRef.current.toCanvas()` to get a native `HTMLCanvasElement`, then call `.getContext('2d').getImageData(0, 0, width, height)` to obtain raw pixel data for analysis. The `stageRef` must be passed down to the component that triggers analysis.
- **`detectContentBounds` loop**: Iterate over the RGBA pixel array (4 bytes per pixel) checking `data[i + 3] > 0` (alpha channel) to identify non-transparent pixels. Track `minX`, `minY`, `maxX`, `maxY` across all matching pixels.
- **Reference emoji asset**: Add a small (128×128 px) yellow smiley face PNG to `src/assets/reference-emoji.png`. Use a freely licensed image (e.g., from Twemoji, Apache 2.0 license).
- **`generateSuggestions` threshold**: The 60% safe-zone fill threshold is the initial value; treat it as a named constant (`MIN_FILL_RATIO = 0.6`) so it can be tuned easily.
- **No new state management library needed**: Local React `useState` in the parent `App` component (or a new `useOptimizer` hook) is sufficient to hold analysis results.
- **Canvas renderer**: The app uses `react-konva` (Konva.js) — all canvas interactions must go through Konva's API, not the raw HTML5 Canvas API directly.

## Security Considerations

- No API keys, tokens, or credentials are involved. All analysis is client-side.
- Pixel data from the canvas stays in-memory; nothing is sent to a server.
- The bundled reference emoji must be a freely licensed asset — verify license before committing.
- Proof artifacts (screenshots, test output) contain no sensitive data and are safe to commit.

## Success Metrics

1. **Bounds detection unit test**: `detectContentBounds.test.ts` passes all assertions (fully opaque, padded, and transparent cases).
2. **Suggestion engine unit test**: `generateSuggestions.test.ts` passes all assertions (too-small, excess-padding, and no-suggestions cases).
3. **Analyzer panel unit test**: `OptimizerPanel.test.tsx` passes button-state assertions.
4. **Zero lint/type errors**: `task lint` and `task typecheck` pass with no warnings or errors.
5. **Screenshot proof**: A screenshot shows the results panel with suggestions and side-by-side comparison after running "Analyze" on a test image.

## Open Questions

No open questions at this time.
