# 16-spec-eraser-sizing-tool

## Introduction/Overview

The eraser tool currently uses a fixed, canvas-proportional size that users cannot change. This spec describes adding a size slider to the Toolbar that lets users control the eraser radius (1–100px) while the eraser tool is active, following the same pattern already used for brush size.

## Goals

- Allow users to set the eraser size to any value between 1 and 100px via a slider.
- Display the eraser size slider in the Toolbar only when the eraser tool is active (consistent with brush size behavior).
- Preserve the user's chosen eraser size when they switch to another tool and back within the same session.
- Default the eraser to the current auto-calculated size (~12px for a 512×512 canvas).

## User Stories

**As an emoji creator**, I want to control the size of the eraser so that I can make precise small erasures or quickly remove large areas depending on my needs.

**As an emoji creator**, I want the eraser to remember the size I set when I switch tools so that I don't have to reconfigure it every time I come back to erasing.

## Demoable Units of Work

### Unit 1: Eraser Size Slider in Toolbar

**Purpose:** Exposes a size slider in the Toolbar when the eraser tool is active, giving users immediate, visible control over eraser size.

**Functional Requirements:**

- The system shall display a range slider labeled "Size" in the Toolbar when the eraser tool is active and hidden otherwise.
- The slider shall have a minimum value of 1 and a maximum value of 100.
- The system shall initialize the eraser size to `Math.round((canvasWidth / 128) * 3)` (e.g., 12 for a 512px canvas).
- The system shall persist the eraser size in React state in `App.tsx` alongside the existing `brushSize` state, using the same prop-drilling pattern.
- The eraser size value shall be retained when the user switches away from the eraser tool and back within the same session.

**Proof Artifacts:**

- Visual inspection: Toolbar shows the "Size" slider when eraser is active and hides it for all other tools.

### Unit 2: Canvas Respects Eraser Size

**Purpose:** Ensures the actual eraser circle on the canvas and the cursor indicator reflect the user-selected size.

**Functional Requirements:**

- The system shall pass `eraserSize` as a prop from `App.tsx` to `EmojiCanvas.tsx`.
- The system shall replace the hardcoded `eraserRadius` formula in `EmojiCanvas.tsx` with the `eraserSize` prop value.
- The eraser cursor circle (Konva Circle in the overlay layer) shall update its radius to match the current `eraserSize`.
- The erased area on the canvas shall match the selected eraser size.

**Proof Artifacts:**

- E2E test (Playwright): activates the eraser tool, sets the slider to a small value (e.g., 5px), erases a spot, then sets the slider to a large value (e.g., 50px), erases a second spot, and asserts the second erased area is larger than the first by comparing pixel counts of transparent pixels.

## Non-Goals (Out of Scope)

1. **Eraser shape customization**: Only circular erasers are supported; no square or custom shapes.
2. **Eraser opacity/hardness**: No softness or feathering controls.
3. **Persisting eraser size across page reloads**: Size resets to default on page refresh.
4. **Keyboard shortcuts for eraser size**: No hotkey increment/decrement support.
5. **Displaying the numeric size value**: The slider alone is sufficient; no adjacent number input is needed.

## Design Considerations

The eraser size slider should follow the existing Toolbar pattern for brush controls:

- Render inside a `<div className="toolbar-brush-size">` equivalent (reuse or mirror the `.toolbar-brush-size` CSS class and pattern from `Toolbar.css`).
- Label: "Size" displayed above or beside the slider.
- Slider element: `<input type="range" min="1" max="100" />` styled to match the toolbar aesthetic.
- The control is only visible when `activeTool === "eraser"` — consistent with how brush controls appear only when `activeTool === "brush"`.

No new design mockups required; follow existing Toolbar styling conventions.

## Repository Standards

- **State management**: Use `useState` in `App.tsx` with prop drilling to `Toolbar.tsx` and `EmojiCanvas.tsx` — no Context or Redux (matching `brushSize`, `brushColor`, `textSize` patterns).
- **Prop flow**: `App.tsx` → `Toolbar.tsx` (slider UI) and `App.tsx` → `EmojiCanvas.tsx` (canvas logic).
- **Conditional rendering**: Use `activeTool === "eraser"` guard in `Toolbar.tsx`, same as `activeTool === "brush"` for brush controls.
- **Styling**: Add styles to `Toolbar.css`; reuse or mirror `.toolbar-brush-size` and `.toolbar-brush-size-input` class patterns.
- **Testing**: New E2E tests go in `e2e/eraser.spec.ts` (file already exists with eraser tests).
- **Commands**: Use `task lint`, `task typecheck`, `task test`, `task test:e2e` to verify changes.
- **Commits**: Follow existing commit message conventions; pre-commit hooks enforce lint and formatting.

## Technical Considerations

- **Removing the hardcoded formula**: `EmojiCanvas.tsx:168` currently computes `eraserRadius = Math.round((width / 128) * 3)`. This line should be removed and replaced with direct use of the `eraserSize` prop.
- **Initial state**: The default value in `App.tsx` should replicate the current formula: `Math.round(((canvasWidth ?? 512) / 128) * 3)`. This keeps the out-of-the-box feel identical to today.
- **Prop type updates**: `EmojiCanvasProps` and `ToolbarProps` interfaces will need `eraserSize: number` and `onEraserSizeChange: (size: number) => void` added.
- **No new dependencies**: The slider uses a standard HTML `<input type="range">` — no third-party slider library needed.

## Security Considerations

No specific security considerations identified. Eraser size is a local UI state value; no external data, authentication, or sensitive information is involved.

## Success Metrics

1. **Functional**: The eraser size slider renders in the Toolbar when the eraser is active and is hidden for all other tools.
2. **Correctness**: The erased canvas area visually matches the selected slider value (verified by the E2E test).
3. **Consistency**: The eraser size persists when the user switches tools and returns to the eraser within the same session.
4. **Quality**: `task lint`, `task typecheck`, and `task test` all pass with no new errors.

## Open Questions

No open questions at this time.
