# 04 Tasks - Lightweight Editor

## Relevant Files

- `src/App.tsx` - Root component; will lift editor state (active tool, history) and pass to EmojiCanvas/Toolbar
- `src/App.css` - App container styles; will add flexbox layout for toolbar + canvas side-by-side
- `src/components/EmojiCanvas.tsx` - Main canvas component; will add mouse event handlers for tools, Stage ref for snapshots
- `src/components/EmojiCanvas.test.tsx` - Existing unit tests; will extend with toolbar visibility and tool interaction tests
- `src/components/Toolbar.tsx` - **New.** Vertical toolbar sidebar with tool buttons, undo/redo buttons, and text tool settings
- `src/components/Toolbar.css` - **New.** Toolbar sidebar styles (vertical layout, active state, color swatches, size presets)
- `src/components/Toolbar.test.tsx` - **New.** Unit tests for toolbar rendering, active tool state, conditional visibility
- `src/hooks/useHistory.ts` - **New.** Undo/redo history stack hook storing canvas state snapshots (data URLs)
- `src/hooks/useHistory.test.ts` - **New.** Unit tests for history stack push, pop, re-push, boundary conditions
- `src/hooks/useEditorTools.ts` - **New.** Hook coordinating tool state, mouse event handling, and flattening logic for all tools
- `src/hooks/useEditorTools.test.ts` - **New.** Unit tests for tool switching, event handling, and flattening behavior
- `src/utils/presets.ts` - Existing platform presets; no changes expected
- `src/utils/imageScaling.ts` - Existing contain-fit scaling; no changes expected
- `e2e/eraser.spec.ts` - **New.** E2E test for eraser tool workflow
- `e2e/brush.spec.ts` - **New.** E2E test for brush tool workflow
- `e2e/text-tool.spec.ts` - **New.** E2E test for text tool workflow
- `e2e/editor-integration.spec.ts` - **New.** E2E test for multi-tool integration and transparency preservation

### Notes

- Unit tests should be placed alongside the code files they test (e.g., `Toolbar.tsx` and `Toolbar.test.tsx` in the same directory).
- Use `task test` for unit tests (`npx vitest run`) and `task test:e2e` for Playwright tests (`npx playwright test`).
- Follow the existing Konva test pattern: access `Konva.stages[0]`, use `afterEach` to destroy stages, verify layer structure and shape properties.
- Follow existing E2E patterns: `page.goto("/")`, fixture file upload via `setInputFiles`, pixel data verification via `page.evaluate()`.
- All code must pass `task lint`, `task typecheck`, `task test`, and `task test:e2e` before a task is considered complete.
- Adhere to strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`), Prettier (2-space indent, double quotes, 80-char width), and ESLint max-warnings=0.

## Tasks

### [x] 1.0 Toolbar Sidebar & Undo/Redo Infrastructure

Build the foundational editing UI and history system. When an image is loaded, a vertical toolbar sidebar appears on the left side of the canvas with icon buttons for Eraser, Brush, Text, Undo, and Redo. Clicking a tool button sets it as active (highlighted state). The undo/redo system stores canvas state snapshots, supports Cmd+Z / Cmd+Shift+Z keyboard shortcuts, and disables buttons when history is empty. The toolbar hides when no image is loaded.

#### 1.0 Proof Artifact(s)

- Screenshot: Toolbar visible with all tool icons (Eraser, Brush, Text, Undo, Redo) when an image is loaded; toolbar hidden when no image is loaded
- Screenshot: Active tool button shows highlighted/pressed visual state distinct from inactive tools
- Test: `useHistory.test.ts` passes — verifies undo/redo stack push, pop, re-push, and boundary conditions (undo when empty, redo when empty)
- Test: `Toolbar.test.tsx` passes — verifies toolbar renders correct buttons, active tool state, and conditional visibility
- CLI: `task typecheck && task lint && task test` passes with no errors

#### 1.0 Tasks

- [x] 1.1 Define a `EditorTool` type (`"eraser" | "brush" | "text"`) and an `activeTool` state in `App.tsx`. Pass `activeTool` and `onToolChange` callback as props to a new `Toolbar` component and to `EmojiCanvas`.
- [x] 1.2 Create `src/hooks/useHistory.ts` — implement a `useHistory` hook that maintains an undo stack (array of data URL strings) and a redo stack. Expose `pushState(snapshot: string)`, `undo(): string | null`, `redo(): string | null`, `canUndo: boolean`, `canRedo: boolean`, and `clear()`.
- [x] 1.3 Write unit tests in `src/hooks/useHistory.test.ts` — test push, undo, redo, undo when empty returns null, redo when empty returns null, redo stack clears on new push after undo, and clear resets both stacks.
- [x] 1.4 Create `src/components/Toolbar.tsx` and `Toolbar.css` — render a vertical sidebar with icon buttons for Eraser, Brush, Text (using Unicode/emoji or simple SVG icons), plus Undo and Redo buttons separated visually. The active tool button gets a distinct CSS class (e.g., `toolbar-btn--active`). Undo/Redo buttons accept `disabled` prop. The entire toolbar only renders when `image` prop is truthy.
- [x] 1.5 Write unit tests in `src/components/Toolbar.test.tsx` — test that all 5 buttons render when image is provided, toolbar does not render when image is null, clicking a tool button calls `onToolChange` with the correct tool name, active tool has the active CSS class, and undo/redo buttons are disabled when `canUndo`/`canRedo` are false.
- [x] 1.6 Update `App.tsx` and `App.css` to render `Toolbar` alongside `EmojiCanvas` in a horizontal flexbox layout (toolbar on left, canvas on right). Pass `activeTool`, `onToolChange`, `canUndo`, `canRedo`, `onUndo`, and `onRedo` props.
- [x] 1.7 Add keyboard shortcut listener in `App.tsx` (or a dedicated hook) — listen for `Cmd+Z` (undo) and `Cmd+Shift+Z` (redo) on `keydown`, calling the corresponding history methods. Ensure the listener is added/removed in a `useEffect` cleanup.
- [x] 1.8 Run `task typecheck && task lint && task test` and fix any errors until all pass cleanly.

### [x] 2.0 Manual Eraser Tool

Implement the eraser tool that makes painted-over pixels fully transparent (alpha = 0). When the user selects the Eraser tool and click-drags on the canvas, pixels under the circular brush become transparent, revealing the checkerboard background. Each completed stroke (mousedown → mouseup) is recorded as a single undo/redo action. The eraser uses `globalCompositeOperation: 'destination-out'` on an offscreen canvas to modify the image layer pixel data.

#### 2.0 Proof Artifact(s)

- Screenshot: Before/after showing an emoji with a portion of its background erased to transparency (checkerboard visible through erased area)
- Screenshot: Eraser cursor (circle outline) visible when eraser tool is active
- Test: `Eraser.test.ts` passes — verifies eraser stroke sets affected pixel alpha to 0 and records a single undo action
- E2E: `eraser.spec.ts` passes — user selects eraser, drags across canvas, erased area shows checkerboard, undo restores pixels
- CLI: `task typecheck && task lint && task test` passes with no errors

#### 2.0 Tasks

- [x] 2.1 Add a Konva `Stage` ref to `EmojiCanvas` and expose a `takeSnapshot(): string` method that returns `stage.toDataURL()`. On image load, push an initial snapshot to the history stack as the baseline state.
- [x] 2.2 Implement eraser mouse event handlers in `EmojiCanvas` (or a `useEditorTools` hook): on `mousedown` when eraser is active, capture a "before" snapshot, create an offscreen canvas from the current image layer data, and begin tracking pointer position. On `mousemove`, draw a filled circle at the pointer position on the offscreen canvas using `globalCompositeOperation: 'destination-out'`. On `mouseup`, write the modified offscreen canvas back to the Konva Image node and push the new snapshot to the history stack.
- [x] 2.3 Set the CSS cursor to a circle outline (e.g., via a custom CSS cursor or by setting `cursor: 'none'` on the Stage container and rendering a Konva circle that follows the pointer) when the eraser tool is active.
- [x] 2.4 Wire the undo/redo methods to restore the image: when `undo()` or `redo()` returns a snapshot data URL, load it as an `HTMLImageElement` and update the Konva Image node's `image` attribute.
- [x] 2.5 Write unit tests in `src/hooks/useEditorTools.test.ts` (or `src/components/EmojiCanvas.test.tsx`) — test that an eraser stroke modifies pixel alpha values and that a single stroke results in exactly one history push.
- [x] 2.6 Write E2E test `e2e/eraser.spec.ts` — upload test fixture, click eraser button, simulate drag across canvas, verify pixel data changed (alpha = 0 in erased area), click undo, verify pixels restored.
- [x] 2.7 Run `task typecheck && task lint && task test && task test:e2e` and fix any errors.

### [ ] 3.0 Freehand Brush/Pen Tool

Implement the brush tool that draws freehand strokes on top of the emoji. When the user selects the Brush tool and click-drags, black strokes are rendered on the Konva overlays layer (Layer 3). Each completed stroke (mousedown → mouseup) is a single undo/redo action. When the user switches tools or performs another action, brush strokes are destructively flattened onto the image data.

#### 3.0 Proof Artifact(s)

- Screenshot: Emoji with freehand black strokes drawn on top
- Test: `Brush.test.ts` passes — verifies brush stroke creates a Konva Line on the overlays layer with correct color and width, and records a single undo action
- E2E: `brush.spec.ts` passes — user selects brush, draws a stroke, stroke is visible on canvas, undo removes the stroke
- CLI: `task typecheck && task lint && task test` passes with no errors

#### 3.0 Tasks

- [ ] 3.1 Implement brush mouse event handlers: on `mousedown` when brush is active, capture a "before" snapshot and create a new `Konva.Line` on the overlays layer (Layer 3) with `stroke: "#000000"`, `strokeWidth` proportional to canvas size (e.g., 3px for 128×128, 12px for 512×512), `lineCap: "round"`, `lineJoin: "round"`, and initial `points` from the click position. On `mousemove`, append the pointer position to the Line's `points` array. On `mouseup`, finalize the stroke.
- [ ] 3.2 Implement destructive flattening: when the user switches away from the brush tool (or triggers another action), flatten all Konva.Line nodes on the overlays layer onto the image layer. Do this by: rendering the overlays layer to a temporary canvas, compositing it onto the image offscreen canvas, updating the Konva Image node, and clearing the overlays layer. Push a snapshot after flattening.
- [ ] 3.3 Set the CSS cursor to a crosshair or dot when the brush tool is active.
- [ ] 3.4 Write unit tests — verify that a brush stroke creates a `Konva.Line` on the overlays layer with correct color (`#000000`) and stroke width, and that completing a stroke results in one history push.
- [ ] 3.5 Write E2E test `e2e/brush.spec.ts` — upload test fixture, click brush button, simulate drag across canvas, verify overlays layer has content (pixel data changed), click undo, verify stroke removed.
- [ ] 3.6 Run `task typecheck && task lint && task test && task test:e2e` and fix any errors.

### [ ] 4.0 Text Overlay Tool

Implement the text tool with click-to-place inline editing. When the user selects the Text tool and clicks on the canvas, a temporary HTML input appears at the click position. The user types text, and pressing Enter or clicking outside finalizes the text as a Konva.Text node. The toolbar sidebar shows color swatches (8 colors: black, white, red, blue, green, yellow, orange, purple) and size presets (Small, Medium, Large) when the Text tool is active. Each placed text is a single undo/redo action. Text is destructively flattened onto the image data after placement.

#### 4.0 Proof Artifact(s)

- Screenshot: Emoji with "LGTM" text placed in a chosen color and size
- Screenshot: Text tool active showing color swatches and size presets in the toolbar sidebar
- Test: `TextTool.test.ts` passes — verifies text placement creates a Konva Text node with correct content, color, fontSize, and position; records a single undo action
- E2E: `text-tool.spec.ts` passes — user selects text tool, clicks canvas, types text, presses Enter, text appears on canvas with chosen color/size
- CLI: `task typecheck && task lint && task test` passes with no errors

#### 4.0 Tasks

- [ ] 4.1 Add `textColor` and `textSize` state to `App.tsx` (or a dedicated hook). Define the 8-color palette (`["#000000", "#FFFFFF", "#FF0000", "#0000FF", "#008000", "#FFFF00", "#FFA500", "#800080"]`) and 3 size presets (`{ small: 10, medium: 18, large: 28 }` — scaled proportionally for 512×512 canvases). Pass these as props to `Toolbar`.
- [ ] 4.2 Update `Toolbar.tsx` to render color swatches (small colored circles/squares) and size preset buttons (S / M / L) below the tool icons, only visible when `activeTool === "text"`. Clicking a swatch sets `textColor`; clicking a size button sets `textSize`. The selected color and size should have a visual indicator (e.g., border/ring).
- [ ] 4.3 Implement text placement in `EmojiCanvas`: on `click` when text tool is active, create a temporary HTML `<input>` element positioned absolutely over the canvas at the click coordinates (accounting for the Stage container's offset). Style the input to match the selected font size and color, with a transparent background and no border.
- [ ] 4.4 Implement text finalization: on `Enter` keypress or `blur` of the temporary input, remove the input element, capture a "before" snapshot, create a `Konva.Text` node on the overlays layer at the click position with the entered text, selected color, selected font size, and `fontFamily: "sans-serif"`. Immediately flatten the text onto the image layer (same flattening logic as brush tool) and push a snapshot. If the input is empty on finalization, discard without creating a node.
- [ ] 4.5 Write unit tests for the text tool settings in `Toolbar.test.tsx` — verify color swatches and size buttons render only when text tool is active, clicking a swatch calls `onTextColorChange`, clicking a size button calls `onTextSizeChange`.
- [ ] 4.6 Write unit tests for text placement — verify that finalizing text creates a `Konva.Text` node with correct `text()`, `fill()`, `fontSize()`, and position, and results in one history push.
- [ ] 4.7 Write E2E test `e2e/text-tool.spec.ts` — upload test fixture, click text button, click on canvas, type "LGTM" into the input, press Enter, verify text is rendered on canvas (pixel data changed at text position), change color/size and place another text, click undo to remove the last text.
- [ ] 4.8 Run `task typecheck && task lint && task test && task test:e2e` and fix any errors.

### [ ] 5.0 Transparency Preservation & Integration Verification

Verify that imported transparent PNGs maintain transparency through all editing operations (eraser, brush, text) and export. Ensure all tools work correctly together — switching between tools, undo/redo across tool boundaries, and flattening behavior. Run the full quality gate suite.

#### 5.0 Proof Artifact(s)

- Screenshot: Imported transparent PNG with transparent areas intact after applying eraser, brush, and text edits
- E2E: `editor-integration.spec.ts` passes — multi-tool workflow: import transparent PNG, erase area, draw brush stroke, add text, undo across tools, verify transparency preserved
- CLI: `task lint && task typecheck && task test && task test:e2e` all pass with no errors
- Screenshot: Exported PNG opened in external tool confirming alpha channel is preserved

#### 5.0 Tasks

- [ ] 5.1 Create a transparent test fixture PNG (e.g., `e2e/fixtures/test-emoji-transparent.png`) — a small image with known transparent areas for deterministic pixel verification.
- [ ] 5.2 Write E2E test `e2e/editor-integration.spec.ts` with a multi-tool workflow: upload transparent PNG, verify transparent pixels have alpha = 0, apply eraser stroke, apply brush stroke, add text, verify original transparent areas still have alpha = 0 (not filled with white or any color), undo all actions back to the original image, verify canvas matches initial state.
- [ ] 5.3 Verify tool switching: test that switching from brush to eraser flattens pending brush strokes before activating eraser, and that switching from text tool (while input is open) finalizes or discards the text before switching.
- [ ] 5.4 Verify undo/redo across tool boundaries: undo after using eraser → brush → text should step back through each action regardless of which tool created it.
- [ ] 5.5 Run the full quality gate: `task lint && task typecheck && task test && task test:e2e`. Fix any remaining lint, type, or test errors.
- [ ] 5.6 Capture proof artifact screenshots: toolbar with all tools, each tool in use, transparency preserved after multi-tool editing.
