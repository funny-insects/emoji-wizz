# 02-spec-smart-emoji-canvas.md

## Introduction/Overview

The Smart Emoji Canvas is the foundational editing surface for Emoji Wizz. It provides a platform-aware HTML5 canvas with correct Slack sizing, a transparent-background checkerboard indicator, a content safe zone (margin), and the ability to load an image via file upload or clipboard paste. Every subsequent feature (Lightweight Editor, Overlays, Export) builds directly on top of this surface.

## Goals

- Render an HTML5 canvas at Slack-compliant dimensions (128×128 px) driven by a typed preset configuration.
- Display a checkerboard pattern to represent canvas transparency (not exported).
- Apply a platform-specific content safe zone (padding inset) drawn as a visual guide on the canvas.
- Allow users to load an image onto the canvas via drag-and-drop/file picker and clipboard paste (Ctrl+V / Cmd+V).
- Expose a dropdown preset selector in the UI, backed by an extensible data structure that supports adding Discord and Apple presets later without code changes to the canvas.

## User Stories

**As a Slack workspace admin**, I want to open a canvas that is already sized correctly for Slack so that I do not have to think about dimensions or risk uploading a wrongly-sized emoji.

**As a user**, I want to see a checkerboard background on the canvas so that I know which areas will be transparent when the emoji is exported.

**As a user**, I want to upload an existing image onto the canvas so that I can use a photo or illustration as a starting point for my emoji.

**As a user**, I want to paste an image from my clipboard so that I can get content onto the canvas quickly without opening a file picker.

## Demoable Units of Work

### Unit 1: Platform Preset Configuration & Dropdown

**Purpose:** Establishes the typed preset data model and wires it to a dropdown UI. Changing the preset updates the canvas dimensions in real time.

**Functional Requirements:**

- The system shall define a typed `PlatformPreset` data structure containing at minimum: `id`, `label`, `width` (px), `height` (px), and `safeZonePadding` (px or %).
- The system shall include one preset: `slack` — 128×128 px, 12 px safe-zone padding on each side.
- The system shall render the canvas at the dimensions specified by the active preset.
- The system shall display a dropdown selector listing all configured presets; selecting a preset updates the canvas dimensions immediately.
- The system shall be designed so that additional presets (Discord, Apple) can be added by inserting a new entry into the preset configuration with no other code changes required.

**Proof Artifacts:**

- Unit test: `presets.test.ts` passes, asserting that the Slack preset returns `{ width: 128, height: 128, safeZonePadding: ... }` — demonstrates preset config correctness.
- Playwright E2E test: test opens the app, confirms canvas element has `width="128"` and `height="128"` attributes — demonstrates the preset drives canvas dimensions.

---

### Unit 2: Transparent Canvas Shell with Safe Zone

**Purpose:** Delivers the visible canvas surface: a checkerboard transparency indicator and a visual safe-zone guide drawn inside the canvas boundaries.

**Functional Requirements:**

- The system shall draw a repeating checkerboard pattern (light grey / white, 8×8 px tiles) filling the entire canvas as the background layer.
- The system shall draw a visible safe-zone border (dashed or semi-transparent overlay) inset from the canvas edges by the preset's `safeZonePadding` value, indicating the recommended content area.
- The checkerboard and safe-zone guide shall be redrawn whenever the active preset changes.
- The checkerboard pattern shall not be included in any exported image data.

**Proof Artifacts:**

- Playwright E2E test: test opens the app and verifies the canvas is visible and non-empty (pixel data is not all-zero) — demonstrates canvas is rendering.
- Unit test: `drawCheckerboard.test.ts` (or equivalent canvas utility test) passes — demonstrates checkerboard drawing logic is correct.

---

### Unit 3: Image Import (File Upload + Clipboard Paste)

**Purpose:** Allows the user to load an image onto the canvas as the starting content, via file picker/drag-and-drop or clipboard paste.

**Functional Requirements:**

- The system shall accept image files (PNG, JPG, GIF, WebP) via a file input and via drag-and-drop onto the canvas area.
- The system shall accept images pasted from the clipboard via Ctrl+V (Windows/Linux) or Cmd+V (macOS).
- The system shall draw the imported image onto the canvas scaled to fit entirely within the canvas dimensions while preserving aspect ratio (object-fit: contain — no cropping).
- The system shall render the imported image on top of the checkerboard background (the checkerboard remains visible in transparent/empty areas).
- The system shall accept only image file types; non-image files or clipboard content shall be ignored silently.

**Proof Artifacts:**

- Playwright E2E test: test uploads a sample PNG file and verifies the canvas pixel data changes — demonstrates file import works end-to-end.
- Unit test: `imageImport.test.ts` passes, asserting that the image scaling logic produces correct dimensions for various input sizes — demonstrates fit-to-canvas math is correct.

## Non-Goals (Out of Scope)

1. **Drawing tools** (brush, pen, eraser, shapes) — deferred to Spec #04 Lightweight Editor.
2. **Discord and Apple presets** — the data structure supports them, but only the Slack preset is populated in this spec.
3. **Image editing after import** (crop, rotate, manual resize handles) — deferred to Spec #04.
4. **Export to file** (PNG, GIF, WebP download) — deferred to Spec #07.
5. **AI Command Bar** — deferred to Spec #08.
6. **Visual Size Optimizer** (bounds detection, suggestions) — deferred to Spec #06.
7. **Undo/redo** — deferred to a later spec.

## Design Considerations

- The canvas should be visually centered on the page with sufficient surrounding whitespace.
- The checkerboard tile size is 8×8 px using two shades of grey (e.g., `#CCCCCC` and `#FFFFFF`) — a widely-recognised transparency convention.
- The safe-zone guide should be subtle (e.g., dashed blue or semi-transparent white border) so it does not distract from the emoji content.
- The dropdown preset selector should display the preset label and dimensions (e.g., "Slack — 128×128").
- No specific mockups exist; follow a clean, minimal layout consistent with the app's existing CSS patterns.

## Repository Standards

- **Language & framework**: TypeScript (strict mode) + React 19 functional components with hooks.
- **Formatting**: Prettier config — double quotes, semicolons, 2-space indent, trailing commas, 80-char line width.
- **Linting**: ESLint with `max-warnings=0`; no unused variables or parameters.
- **Unit tests**: Vitest + `@testing-library/react`; test files co-located alongside source files (`*.test.ts` / `*.test.tsx`).
- **E2E tests**: Playwright in `e2e/` directory; Chromium only.
- **Pre-commit hooks**: Husky runs lint-staged — ESLint then Prettier on `.ts`/`.tsx` files; Prettier only on `.json`, `.css`, `.md`.
- **Task runner**: Use `Taskfile.yml` commands (`task lint`, `task test`, `task typecheck`) to verify work.
- **File organisation**: Components in `src/components/`, hooks in `src/hooks/`, utilities in `src/utils/`, service integrations in `src/services/`.

## Technical Considerations

- Use the native **HTML5 Canvas API** (`<canvas>` element + `CanvasRenderingContext2D`) — no third-party canvas library.
- The canvas element should be managed via a React `ref`; all drawing operations happen imperatively through the ref's `2d` context.
- Preset configuration should live in a plain TypeScript module (e.g., `src/utils/presets.ts`) as a typed array of `PlatformPreset` objects — easy to extend.
- Image scaling logic (fit-to-canvas) should be a pure utility function to keep it testable in isolation.
- The checkerboard background must be cleared and redrawn each time the canvas state changes (preset switch, image import).
- Drag-and-drop: listen for `dragover` and `drop` events on the canvas wrapper element; prevent default to enable drop.
- Clipboard paste: listen for the `paste` event on `document` (or the canvas wrapper); extract `ImageData` from `event.clipboardData.items`.

## Security Considerations

- No API keys, tokens, or credentials are involved in this spec.
- Imported image files are processed entirely client-side (drawn onto a canvas element) — no data is sent to a server.
- Clipboard access uses the standard `paste` event (no Clipboard API permission required) — no elevated permissions needed.
- Proof artifacts (screenshots, test output) contain no sensitive data and are safe to commit.

## Success Metrics

1. **Correct dimensions**: Canvas renders at exactly 128×128 px when the Slack preset is active, verified by Playwright E2E test.
2. **Preset unit test**: `presets.test.ts` passes with 100% of defined preset assertions green.
3. **Image import unit test**: `imageImport.test.ts` passes, confirming correct fit-to-canvas scaling for at least 3 different input aspect ratios.
4. **E2E image upload test**: Playwright test uploads a PNG and confirms canvas pixel data is non-empty after load.
5. **Zero lint/type errors**: `task lint` and `task typecheck` pass with no warnings or errors.

## Open Questions

No open questions at this time.
