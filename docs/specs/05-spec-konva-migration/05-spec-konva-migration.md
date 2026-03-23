# 05-spec-konva-migration

## Introduction/Overview

The Emoji Wizz canvas currently renders using the raw HTML Canvas 2D API. This spec migrates the entire rendering pipeline to **Konva** (via `react-konva`) to prepare for the upcoming Lightweight Editor (Spec 04). Konva's declarative component model, built-in layering, and object-level hit detection will make editor tools (drag, resize, transform, overlays) significantly easier to implement. The migration replaces all Canvas 2D drawing calls while preserving existing functionality and the editor-ready layer structure.

## Goals

- Replace all raw HTML Canvas 2D API usage with `react-konva` declarative components
- Maintain functional parity with the current canvas (checkerboard, safe zone, image display, image import via file/drag/paste)
- Structure Konva layers to prepare for future editor tools (background, image, overlays)
- Ensure Konva's `stage.toDataURL()` is available for future export functionality
- All existing E2E tests pass against the new Konva-based implementation

## User Stories

- **As a developer**, I want the canvas to use Konva so that I can build editor features (drag, resize, transform) on top of Konva's object model instead of manually tracking pixel coordinates on raw canvas.
- **As a user**, I want the emoji canvas to look and behave the same after the migration so that my workflow is uninterrupted.
- **As a developer**, I want the Konva stage organized into distinct layers (background, image, overlays) so that future editor tools can target specific layers without affecting others.

## Demoable Units of Work

### Unit 1: Install Konva and Render Checkerboard Background

**Purpose:** Establish the Konva foundation by replacing the raw canvas element with a Konva `<Stage>` and rendering the checkerboard background pattern as Konva `<Rect>` shapes on a dedicated background layer.

**Functional Requirements:**

- The system shall install `konva` and `react-konva` as project dependencies
- The system shall replace the `<canvas>` element in `EmojiCanvas.tsx` with a Konva `<Stage>` component sized to the active preset dimensions
- The system shall render the checkerboard pattern (8×8 px tiles, alternating `#FFFFFF` / `#CCCCCC`) using Konva `<Rect>` shapes on a background `<Layer>`
- The system shall render the safe-zone guide (dashed blue border, `rgba(0, 120, 255, 0.5)`, 1px stroke, `[4,4]` dash pattern, inset by `safeZonePadding`) using a Konva `<Rect>` on the background layer
- The system shall re-render the stage when the active preset changes (dimensions and padding update correctly)

**Proof Artifacts:**

- E2E test: existing checkerboard and safe-zone E2E tests pass against the Konva-rendered canvas
- Unit test: new unit tests verify checkerboard tile count and safe-zone rect props for each preset

### Unit 2: Image Display on Konva Image Layer

**Purpose:** Migrate image rendering to a dedicated Konva image layer, preserving the contain-fit scaling behavior and all three import methods (file input, drag-and-drop, clipboard paste).

**Functional Requirements:**

- The system shall render the imported image using a Konva `<Image>` node on a dedicated image `<Layer>`, separate from the background layer
- The system shall scale and position the image using the existing `computeContainRect` logic (object-fit contain, centered)
- The system shall support image import via file input (`<input type="file">`), drag-and-drop, and clipboard paste — all three methods must continue to work
- The system shall re-scale the image when the user switches presets (same confirmation dialog behavior as before)
- The `imageScaling.ts` utility (`computeContainRect`) shall remain unchanged as it contains pure math with no Canvas API dependency

**Proof Artifacts:**

- E2E test: existing image import and preset-switch E2E tests pass with the Konva implementation
- Unit test: new unit tests verify the Konva `<Image>` node receives correct position and size props from `computeContainRect`

### Unit 3: Remove Legacy Canvas Code and Update Tests

**Purpose:** Clean up all raw Canvas 2D API code and ensure the full test suite (unit + E2E) passes against the Konva implementation.

**Functional Requirements:**

- The system shall remove `canvasDrawing.ts` (the `drawCheckerboard` and `drawSafeZone` functions) as they are fully replaced by Konva components
- The system shall remove all `CanvasRenderingContext2D` references from the codebase
- The system shall rewrite unit tests in `EmojiCanvas.test.tsx` and `canvasDrawing.test.ts` to test Konva component props and layer structure instead of mocking canvas context calls
- The system shall include an empty overlays `<Layer>` in the stage structure (no content yet) to prepare for Spec 04
- All E2E tests in `e2e/canvas.spec.ts` and `e2e/app.spec.ts` shall pass — updating selectors or pixel-inspection logic only if Konva's rendered output requires it

**Proof Artifacts:**

- E2E test: full `task test:e2e` suite passes with zero canvas API references remaining in source code
- Unit test: full `task test` suite passes with updated Konva-based assertions
- Code search: `grep -r "getContext\|CanvasRenderingContext2D" src/` returns no results

## Non-Goals (Out of Scope)

1. **Interactive editing features**: No drag, resize, rotate, or transform interactions — those belong in Spec 04 (Lightweight Editor)
2. **New visual features**: No changes to the checkerboard appearance, safe-zone styling, or image scaling algorithm beyond what Konva requires
3. **Export implementation**: While `stage.toDataURL()` will be available, building export UI or file-format conversion is out of scope (Spec 07)
4. **Performance optimization**: No Konva-specific performance tuning (caching, batching) unless required to match current rendering speed
5. **Overlay content**: The overlays layer is added empty as structural preparation only — no overlay shapes or stickers

## Design Considerations

No visual design changes. The migrated canvas should be functionally equivalent to the current rendering. Minor anti-aliasing or sub-pixel rendering differences between raw Canvas 2D and Konva are acceptable as long as the checkerboard, safe zone, and image display remain clearly recognizable.

## Repository Standards

- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`, and `noUncheckedIndexedAccess` enabled
- **Vitest** for unit tests with `@testing-library/react` and `jsdom` environment
- **Playwright** for E2E tests (Chromium only, baseURL `http://localhost:5173`)
- **ESLint + Prettier** enforced via Husky pre-commit hooks (zero warnings policy)
- **Taskfile** commands: `task lint`, `task typecheck`, `task test`, `task test:e2e`
- **React 19** with hooks-based state management (no class components, no external state libraries)
- Component files in `src/components/`, utilities in `src/utils/`, hooks in `src/hooks/`

## Technical Considerations

- **Dependencies**: Add `konva` and `react-konva` to `package.json`. Verify compatibility with React 19 — `react-konva` v18+ supports React 18/19.
- **Konva `<Image>` requires an `HTMLImageElement`**: The existing `useImageImport` hook already produces `HTMLImageElement` objects, so no change is needed there.
- **`computeContainRect` reuse**: This pure function takes dimensions and returns `{x, y, width, height}` — it maps directly to Konva `<Image>` props with no adaptation needed.
- **Checkerboard rendering approach**: The current implementation draws individual `fillRect` calls in a loop. With Konva, this becomes an array of `<Rect>` components. For a 128×128 canvas with 8px tiles, that's 256 rects — well within Konva's performance envelope.
- **Konva canvas access**: Konva renders to its own internal `<canvas>` element. E2E tests that inspect pixel data via `canvas.getImageData()` may need to target Konva's canvas (accessible via `stage.toCanvas()` or by querying the DOM for Konva's canvas element).
- **Layer structure**: Three layers in render order: (1) Background (checkerboard + safe zone), (2) Image, (3) Overlays (empty, for Spec 04).

## Security Considerations

No specific security considerations identified. No new API keys, authentication, or sensitive data handling is introduced by this migration.

## Success Metrics

1. **Zero raw Canvas API references** in `src/` after migration (`getContext`, `CanvasRenderingContext2D`, `fillRect`, `strokeRect`, `drawImage` on context)
2. **100% E2E test pass rate** — all existing Playwright tests pass against the Konva implementation
3. **100% unit test pass rate** — all rewritten Vitest tests pass
4. **Lint + typecheck clean** — `task lint` and `task typecheck` pass with zero errors/warnings
5. **Three-layer Konva structure** verified in rendered DOM (background, image, overlays layers)

## Open Questions

1. Does `react-konva` have full React 19 compatibility, or will a specific version pin be needed? (To be verified during implementation)
2. Will Konva's internal canvas element have a different DOM query path that requires E2E test selector updates? (To be determined during Unit 3)
