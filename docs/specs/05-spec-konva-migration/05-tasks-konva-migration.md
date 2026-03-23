# 05 Tasks — Konva Migration

## Relevant Files

- `package.json` - Add `konva` and `react-konva` dependencies
- `src/components/EmojiCanvas.tsx` - Main component to rewrite: replace `<canvas>` with Konva `<Stage>`, `<Layer>`, `<Rect>`, and `<Image>` components
- `src/components/EmojiCanvas.test.tsx` - Rewrite unit tests to verify Konva stage dimensions and layer structure
- `src/utils/canvasDrawing.ts` - Legacy file to delete after migration (replaced by Konva `<Rect>` components)
- `src/utils/canvasDrawing.test.ts` - Legacy test file to delete (replaced by new Konva-based tests)
- `src/utils/imageScaling.ts` - No changes needed; `computeContainRect` is pure math reused as-is
- `src/utils/imageScaling.test.ts` - No changes needed; verifies unchanged utility
- `src/utils/presets.ts` - No changes needed; `PlatformPreset` type drives Konva stage sizing
- `src/utils/presets.test.ts` - No changes needed
- `src/hooks/useImageImport.ts` - No changes needed; produces `HTMLImageElement` compatible with Konva `<Image>`
- `src/App.tsx` - No changes needed; passes preset and image to `EmojiCanvas`
- `src/App.test.tsx` - May need minor update if canvas query selector changes
- `e2e/canvas.spec.ts` - May need updates for Konva's canvas DOM structure (pixel inspection queries)
- `e2e/app.spec.ts` - May need minor selector update for Konva canvas element

### Notes

- Unit tests should be placed alongside the code files they test (e.g., `EmojiCanvas.tsx` and `EmojiCanvas.test.tsx` in `src/components/`).
- Use `task test` (Vitest) for unit tests and `task test:e2e` (Playwright) for E2E tests.
- Follow existing patterns: TypeScript strict mode, ESLint zero-warnings, Prettier formatting.
- Husky pre-commit hooks enforce lint + format on staged `.ts`/`.tsx` files.

## Tasks

### [x] 1.0 Install Konva and Render Checkerboard + Safe Zone on Background Layer

Replace the raw `<canvas>` element with a Konva `<Stage>` and render the checkerboard pattern and safe-zone guide as declarative `react-konva` components on a dedicated background `<Layer>`. After this task, the app displays the same checkerboard and safe-zone visuals using Konva instead of Canvas 2D API calls.

#### 1.0 Proof Artifact(s)

- CLI: `npm ls konva react-konva` shows both packages installed demonstrates dependency setup
- E2E test: "canvas renders with Slack preset dimensions" passes demonstrates stage renders at correct size
- E2E test: "canvas renders non-empty pixel data (checkerboard is drawing)" passes demonstrates checkerboard renders via Konva
- E2E test: "switching to Apple preset with no image resizes canvas silently" passes demonstrates preset-driven re-rendering works

#### 1.0 Tasks

- [x] 1.1 Install `konva` and `react-konva` as production dependencies: run `npm install konva react-konva`. Verify both appear in `package.json` under `dependencies` and that `npm ls konva react-konva` succeeds.
- [x] 1.2 In `EmojiCanvas.tsx`, replace the `<canvas ref={canvasRef} ...>` element with a `<Stage>` component from `react-konva`, sized to `preset.width` and `preset.height`. Add a single `<Layer>` inside the stage for background content. Remove the `canvasRef` and the `useEffect` that calls `getContext("2d")`.
- [x] 1.3 Create a checkerboard rendering approach inside the background `<Layer>`: generate an array of `<Rect>` components (8×8 px tiles, alternating `#FFFFFF` / `#CCCCCC`) based on `preset.width` and `preset.height`. Use the same tile-color logic as the current `drawCheckerboard` function (even tile index = white, odd = grey).
- [x] 1.4 Add a safe-zone `<Rect>` to the background `<Layer>` after the checkerboard tiles: stroke-only rect with `stroke="rgba(0, 120, 255, 0.5)"`, `strokeWidth={1}`, `dash={[4, 4]}`, positioned at `(safeZonePadding, safeZonePadding)` with size `(width - 2*padding, height - 2*padding)`. This replaces the `drawSafeZone` function.
- [x] 1.5 Keep the file input and drag-drop wrapper (`<div onDragOver ... onDrop ...>` and `<input type="file">`) around the Konva `<Stage>` so image import entry points remain in place.
- [x] 1.6 Verify the app renders correctly in the browser: run `npm run dev`, open `http://localhost:5173`, and confirm the checkerboard and safe-zone border appear. Switch presets in the dropdown and confirm dimensions update.

### [x] 2.0 Image Display on Dedicated Konva Image Layer

Add a Konva `<Image>` node on a separate image `<Layer>` that renders the user's imported image with contain-fit scaling. All three import methods (file input, drag-and-drop, clipboard paste) and preset-switch re-scaling must continue to work. The existing `computeContainRect` utility and `useImageImport` hook remain unchanged.

#### 2.0 Proof Artifact(s)

- E2E test: "canvas pixel data changes after file upload" passes demonstrates image renders on Konva canvas
- E2E test: "switching preset after image upload shows confirm dialog and resizes canvas" passes demonstrates preset switching with image works
- Unit test: `imageScaling.test.ts` passes unchanged demonstrates `computeContainRect` was not modified

#### 2.0 Tasks

- [x] 2.1 Add a second `<Layer>` to the Konva `<Stage>` in `EmojiCanvas.tsx`, positioned after the background layer. This is the image layer.
- [x] 2.2 When the `image` prop is non-null, render a Konva `<Image>` component on the image layer. Use `computeContainRect(image.naturalWidth, image.naturalHeight, preset.width, preset.height)` to calculate `x`, `y`, `width`, and `height` props for the `<Image>` node.
- [x] 2.3 Verify that the `useImageImport` hook's `HTMLImageElement` output works directly with Konva's `<Image image={...}>` prop — no conversion should be needed since Konva accepts `HTMLImageElement`.
- [x] 2.4 Verify all three import methods work: (a) click the file input and select an image, (b) drag an image file onto the canvas area, (c) copy an image and paste with Ctrl/Cmd+V. Each method should display the image scaled to fit within the stage.
- [x] 2.5 Verify preset switching with a loaded image: switch presets in the dropdown, confirm the confirmation dialog appears, accept it, and verify the image re-scales to the new preset dimensions.

### [ ] 3.0 Rewrite Unit Tests for Konva Components

Replace all canvas-context-mocking unit tests with tests that verify Konva component props and layer structure. The old `canvasDrawing.test.ts` tests (which mock `CanvasRenderingContext2D`) are replaced with tests that verify the Konva `<Rect>` shapes have the correct props. `EmojiCanvas.test.tsx` is updated to verify the Konva `<Stage>` renders with correct dimensions.

#### 3.0 Proof Artifact(s)

- CLI: `task test` passes with zero failures demonstrates all unit tests pass
- CLI: `task typecheck` passes demonstrates no TypeScript errors in test files

#### 3.0 Tasks

- [ ] 3.1 Rewrite `EmojiCanvas.test.tsx`: replace the test that queries `container.querySelector("canvas")` for width/height attributes. Instead, verify the Konva `<Stage>` renders by checking for a canvas element in the DOM (Konva renders to a `<canvas>` internally). Verify the canvas dimensions match the preset. Note: Konva wraps its canvas in a `<div class="konvajs-content">` — use this to locate the rendered element.
- [ ] 3.2 Add a new test in `EmojiCanvas.test.tsx` that verifies the three-layer structure renders: background layer, image layer, and overlays layer (the overlays layer is added in task 4.0 — mark this test as a placeholder or skip until 4.0 completes).
- [ ] 3.3 Rewrite `canvasDrawing.test.ts` as a new Konva-focused test file (e.g., update in-place or create `src/components/EmojiCanvas.test.tsx` tests). Replace `CanvasRenderingContext2D` mock tests with tests that render `<EmojiCanvas>` and verify: (a) the correct number of `<Rect>` elements exist for the checkerboard (e.g., 256 rects for 128×128 with 8px tiles), (b) the safe-zone rect has the correct stroke, dash, and position props.
- [ ] 3.4 Update `App.test.tsx` if needed: the test `expect(document.querySelector("canvas")).toBeInTheDocument()` should still pass since Konva renders a `<canvas>` element, but verify and adjust the selector if necessary.
- [ ] 3.5 Run `task test` and `task typecheck` to confirm all unit tests pass and there are no TypeScript errors.

### [ ] 4.0 Remove Legacy Canvas Code, Add Overlays Layer, Final Verification

Delete `canvasDrawing.ts` and its test file. Remove all `CanvasRenderingContext2D` references from the codebase. Add an empty overlays `<Layer>` to the Konva stage as structural preparation for Spec 04. Update any E2E test selectors if Konva's canvas element requires different DOM queries. Run the full quality gate suite.

#### 4.0 Proof Artifact(s)

- CLI: `grep -r "getContext\|CanvasRenderingContext2D" src/` returns no results demonstrates all legacy canvas code removed
- CLI: `task test` passes demonstrates unit tests clean
- CLI: `task test:e2e` passes demonstrates E2E tests clean
- CLI: `task lint` passes demonstrates code quality
- CLI: `task typecheck` passes demonstrates type safety

#### 4.0 Tasks

- [ ] 4.1 Delete `src/utils/canvasDrawing.ts` — its functionality is fully replaced by Konva `<Rect>` components in `EmojiCanvas.tsx`.
- [ ] 4.2 Delete `src/utils/canvasDrawing.test.ts` — its tests are replaced by the new Konva-based tests written in task 3.3.
- [ ] 4.3 Remove the `import { drawCheckerboard, drawSafeZone } from "../utils/canvasDrawing"` line from `EmojiCanvas.tsx` if not already removed in task 1.2.
- [ ] 4.4 Add a third `<Layer>` to the Konva `<Stage>` in `EmojiCanvas.tsx`, after the image layer. This is the empty overlays layer for Spec 04. It renders no children.
- [ ] 4.5 Search the `src/` directory for any remaining references to `getContext`, `CanvasRenderingContext2D`, `fillRect`, `strokeRect`, or `drawImage` on a context object. Remove any that are found.
- [ ] 4.6 Review E2E tests in `e2e/canvas.spec.ts`: Konva renders its canvas inside a `<div class="konvajs-content">` wrapper. The `page.locator("canvas")` selector should still find Konva's canvas. However, the pixel-inspection tests that use `document.querySelector("canvas").getContext("2d").getImageData(...)` may need adjustment — Konva's canvas may not expose a usable 2D context via `getContext("2d")` for external reads. If tests fail, update them to query the canvas element inside `.konvajs-content` instead.
- [ ] 4.7 Review E2E tests in `e2e/app.spec.ts`: verify `page.locator("canvas")` still finds the Konva-rendered canvas element. Update selector if needed.
- [ ] 4.8 Run the full quality gate suite: `task lint`, `task typecheck`, `task test`, and `task test:e2e`. All must pass with zero errors and zero warnings.
- [ ] 4.9 Complete the layer-structure test from task 3.2 if it was deferred: verify three layers render in the correct order (background, image, overlays).
