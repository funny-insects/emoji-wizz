# 04-spec-lightweight-editor

## Introduction/Overview

Emoji Wizz currently lets users import images and preview them on platform-sized canvases, but offers no way to edit those images. This spec adds a lightweight editor with four core tools — a manual eraser for removing backgrounds, a freehand brush/pen, a text overlay tool, and transparent background preservation — along with a full undo/redo stack and a toolbar sidebar UI. The goal is to give users basic creative control without leaving the app.

## Goals

- Provide a manual eraser tool that makes painted-over pixels transparent, enabling background removal
- Provide a freehand brush/pen tool for drawing directly on the canvas
- Provide a text tool with click-to-place inline editing, a small color palette, and three size presets
- Implement a full undo/redo stack accessible via keyboard shortcuts (Cmd+Z / Cmd+Shift+Z) and toolbar buttons
- Present all tools in a left-side toolbar sidebar that appears when an image is loaded
- Preserve transparency throughout the editing and export pipeline

## User Stories

- **As a Slack power user**, I want to erase the background from my custom emoji so that it blends cleanly into any chat theme.
- **As a designer**, I want to draw freehand strokes on an emoji so that I can add quick embellishments or annotations.
- **As a team lead**, I want to add text labels to emoji so that I can create reaction emojis with custom captions (e.g., "LGTM", "Ship it").
- **As any user**, I want to undo and redo my edits so that I can experiment freely without fear of ruining my work.
- **As any user**, I want imported transparent PNGs to remain transparent throughout editing and export so that platform uploads look correct.

## Demoable Units of Work

### Unit 1: Toolbar Sidebar & Undo/Redo Infrastructure

**Purpose:** Establish the editing UI shell and history system that all tools depend on. Users see a toolbar appear when an image is loaded, and can undo/redo actions.

**Functional Requirements:**

- The system shall render a vertical toolbar sidebar on the left side of the canvas when an image is loaded
- The toolbar shall display icon buttons for each tool: Eraser, Brush, Text, plus Undo and Redo buttons
- The system shall visually indicate the currently active tool (e.g., highlighted/pressed state)
- The system shall maintain an undo/redo history stack that records each editing action
- The system shall support Cmd+Z (undo) and Cmd+Shift+Z (redo) keyboard shortcuts
- The Undo and Redo toolbar buttons shall be disabled when there is nothing to undo or redo, respectively
- The toolbar shall not render when no image is loaded

**Proof Artifacts:**

- Screenshot: toolbar visible with all tool icons when an image is loaded, hidden when no image is loaded
- Unit test: undo/redo stack correctly pushes, pops, and re-pushes state
- E2E test: clicking undo/redo buttons and pressing keyboard shortcuts triggers state changes

### Unit 2: Manual Eraser Tool

**Purpose:** Allow users to paint over areas of the image to make them transparent, enabling manual background removal.

**Functional Requirements:**

- The system shall activate eraser mode when the user selects the Eraser tool from the toolbar
- The system shall change the cursor to an eraser-style indicator when eraser mode is active
- The user shall be able to click-and-drag on the canvas to erase pixels, making them fully transparent (alpha = 0)
- Each completed erase stroke (mousedown → mouseup) shall be recorded as a single undo/redo action
- The eraser shall use a fixed circular brush size (medium, appropriate for emoji-scale images)
- Erased areas shall display the checkerboard pattern (existing transparency indicator)

**Proof Artifacts:**

- Screenshot: before/after showing an emoji with a portion of its background erased to transparency
- Unit test: eraser stroke sets affected pixel alpha to 0
- E2E test: user selects eraser, drags across canvas, erased area shows checkerboard

### Unit 3: Freehand Brush/Pen Tool

**Purpose:** Allow users to draw freehand strokes on top of the emoji for doodling and embellishments.

**Functional Requirements:**

- The system shall activate brush mode when the user selects the Brush tool from the toolbar
- The user shall be able to click-and-drag on the canvas to draw freehand strokes
- The brush shall default to black color and a medium stroke width
- Each completed brush stroke (mousedown → mouseup) shall be recorded as a single undo/redo action
- Brush strokes shall be rendered on the overlays layer (Konva Layer 3) so they appear on top of the image
- The system shall apply destructive flattening: brush strokes are composited onto the image data when the user switches tools or performs another action

**Proof Artifacts:**

- Screenshot: emoji with freehand black strokes drawn on top
- Unit test: brush stroke creates a Konva Line on the overlays layer with correct color and width
- E2E test: user selects brush, draws a stroke, stroke is visible on canvas

### Unit 4: Text Overlay Tool

**Purpose:** Allow users to add text labels to the emoji with basic customization (color and size).

**Functional Requirements:**

- The system shall activate text mode when the user selects the Text tool from the toolbar
- The user shall be able to click on the canvas to place a text cursor at that position
- The system shall display an inline text input at the clicked position where the user can type
- The text shall be finalized (placed on canvas) when the user presses Enter or clicks outside the text input
- The user shall be able to choose from a small color palette (black, white, red, blue, green, yellow, orange, purple — 8 colors)
- The user shall be able to choose from three size presets: Small, Medium (default), Large
- Color and size selectors shall appear in the toolbar sidebar when the Text tool is active
- Each placed text shall be recorded as a single undo/redo action
- The system shall apply destructive flattening: text is composited onto the image data after placement
- The system shall use a single default sans-serif font

**Proof Artifacts:**

- Screenshot: emoji with "LGTM" text placed in a chosen color and size
- Unit test: text placement creates a Konva Text node with correct content, color, fontSize, and position
- E2E test: user selects text tool, clicks canvas, types text, presses Enter — text appears on canvas

## Non-Goals (Out of Scope)

1. **AI/API-based background removal** — only manual eraser is included; automatic removal is deferred to a future spec
2. **Non-destructive/layer-based editing** — edits flatten onto the image; no independent layer toggling or reordering
3. **Advanced tool settings** — no brush size slider, opacity control, font picker, or gradient fills
4. **Crop, resize, rotate, shapes, filters, or color adjustments** — these tools are excluded from this spec
5. **Export/download functionality** — already implemented; this spec does not modify export behavior
6. **Mobile/touch optimization** — tools target desktop pointer input (mouse/trackpad)

## Design Considerations

- The toolbar sidebar sits to the left of the canvas, vertically oriented, with icon buttons for each tool
- The active tool button has a visually distinct state (e.g., highlighted background or border)
- Undo/Redo buttons are placed at the top or bottom of the toolbar, visually separated from the tool buttons
- When the Text tool is active, color swatches and size preset buttons appear below the tool icons in the sidebar
- The eraser cursor should visually suggest erasing (e.g., a circle outline matching the brush size)
- The brush cursor should visually suggest drawing (e.g., a crosshair or dot)
- Tool-specific settings (text color/size) should disappear from the sidebar when switching to a different tool

## Repository Standards

- **Components**: Functional React components with hooks, co-located test files (`*.test.tsx`)
- **State management**: React hooks only (useState, useCallback) — no external state libraries
- **TypeScript**: Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- **Formatting**: Prettier (2-space indent, double quotes, trailing commas, 80-char line width)
- **Linting**: ESLint with max-warnings=0
- **Testing**: Vitest + React Testing Library for unit tests; Playwright (Chromium) for E2E tests
- **Pre-commit**: Husky + lint-staged (ESLint + Prettier)
- **Task runner**: Taskfile.yml (`task lint`, `task test`, `task test:e2e`, `task typecheck`)
- **Naming**: PascalCase for components/types, camelCase for functions/variables
- **File organization**: `src/components/`, `src/hooks/`, `src/utils/`

## Technical Considerations

- **Konva integration**: All tools render on the existing 3-layer Konva Stage. Brush strokes and text go on the overlays layer (Layer 3). The eraser modifies the image layer (Layer 2) pixel data.
- **Destructive editing**: After a tool action is finalized, the result is flattened onto the image data. This simplifies the rendering pipeline but means undo/redo must store full image snapshots or an equivalent reversible representation.
- **Undo/redo implementation**: The history stack should store canvas state snapshots (e.g., `stage.toDataURL()` or pixel buffers). Given the small canvas sizes (128×128 to 512×512), snapshot-based history is feasible without excessive memory usage.
- **Eraser pixel manipulation**: The eraser needs to modify pixel alpha values. This may require converting Konva image data to an offscreen canvas, applying eraser strokes with `globalCompositeOperation: 'destination-out'`, and writing the result back.
- **Inline text editing on Konva**: Konva does not natively support inline text editing. The standard approach is to create a temporary HTML `<input>` or `<textarea>` positioned over the canvas at the click point, then convert the entered text to a Konva.Text node on finalization.
- **Extending EmojiCanvas**: Per the user's preference, editing capabilities are added directly to the existing EmojiCanvas component (or as closely-coupled sub-components). Avoid creating a separate editor canvas.

## Security Considerations

No specific security considerations identified. All editing is client-side with no external API calls or credential handling.

## Success Metrics

1. **Tool completeness**: all four tools (eraser, brush, text, transparent BG preservation) function as specified
2. **Undo/redo reliability**: undo and redo correctly restore canvas state for all tool actions, with no state corruption
3. **Test coverage**: unit tests for each tool's core behavior and the undo/redo stack; E2E tests for each tool's user workflow
4. **Transparency preservation**: imported transparent PNGs maintain transparency through all editing operations and export
5. **CI passing**: all new code passes `task lint`, `task typecheck`, `task test`, and `task test:e2e`

## Open Questions

1. What is the ideal fixed brush/eraser size for emoji-scale canvases (128×128 and 512×512)? May need to scale proportionally to canvas size.
2. Should the text tool support emoji characters in the text input, or only standard alphanumeric characters?
