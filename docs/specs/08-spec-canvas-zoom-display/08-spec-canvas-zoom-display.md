# 08-spec-canvas-zoom-display

## Introduction/Overview

The canvas editor currently renders the Konva Stage at its native pixel size (128×128 for Slack/Discord presets), making it too small to see clearly or make precise edits. This spec covers wrapping the Konva Stage in a CSS-scaled container so it displays at a larger size while keeping the internal canvas resolution and all export logic completely unchanged.

## Goals

- Display the 128×128 Konva Stage visually at 512×512 (4x) for Slack and Discord presets.
- Preserve the internal 128×128 canvas resolution so exports are unaffected.
- Ensure all editing tools (brush, eraser, text) work correctly at the scaled display size.
- Leave the 512×512 Apple preset unscaled (it is already large enough).

## User Stories

**As an emoji creator**, I want the canvas to display at a larger size so that I can see individual pixels clearly and make precise edits.

**As an emoji creator**, I want the intentionally pixelated look of the scaled canvas so that I can see exactly what each pixel will look like in the final emoji.

## Demoable Units of Work

### Unit 1: Scaled Canvas Display

**Purpose:** The 128×128 Konva Stage visually displays at 512×512 (4x) for Slack and Discord presets, with the layout growing to fit.

**Functional Requirements:**

- The system shall wrap the Konva Stage in an outer sizing div and an inner transform div.
- The inner div shall apply `transform: scale(displayScale)` with `transform-origin: top left`.
- The outer div shall have explicit `width` and `height` set to `width * displayScale` pixels so that the layout flow reserves the correct space (CSS transform does not affect layout flow by default).
- The display scale for 128×128 presets (Slack, Discord) shall be 4.
- The Apple 512×512 preset shall have a display scale of 1 (no scaling applied).
- The card/container shall grow naturally to accommodate the scaled canvas.
- The scaled canvas shall appear intentionally pixelated (no CSS smoothing), showing each canvas pixel as a visible block.

**Proof Artifacts:**

- Screenshot: Canvas displayed at 512×512 with a 128×128 Slack preset loaded demonstrates the 4x scale is applied.
- Screenshot: Canvas displayed at 512×512 with pixel grid clearly visible demonstrates pixelated rendering.
- Screenshot: Apple preset loaded shows canvas at native 512×512 with no additional scaling.

### Unit 2: Tool Accuracy at Scaled Display

**Purpose:** Brush, eraser, and text tools place marks at the correct canvas pixel at the scaled display size.

**Functional Requirements:**

- The system shall rely on Konva's built-in pointer position calculation, which uses `getBoundingClientRect()` and automatically corrects for CSS scale transforms.
- The text overlay input shall be rendered inside the scaled container div so it inherits the CSS transform and appears at the correct visual position without additional coordinate math.
- Brush strokes shall appear under the cursor at the scaled display size.
- The eraser feedback circle shall track the cursor correctly at the scaled display size.
- The text input field shall appear at the cursor position at the scaled display size.

**Proof Artifacts:**

- Screenshot: Brush stroke drawn at 4x scale, then exported PNG shows stroke at the correct position in the 128×128 output.
- Screenshot: Text added at 4x scale, then exported PNG shows text at the correct position in the 128×128 output.

## Non-Goals (Out of Scope)

1. **Export resolution changes**: The exported PNG/GIF/WebP always outputs at the preset's native resolution (128×128 for Slack/Discord). No high-DPI or scaled export option.
2. **Scroll-wheel zoom**: No dynamic zoom adjustment. The display scale is fixed per preset.
3. **Pan/scroll canvas viewport**: No support for panning around the canvas.
4. **Pinch-to-zoom on touch devices**: No touch zoom support.
5. **Zoom indicator UI**: No zoom level label or percentage display in the toolbar.

## Design Considerations

The scaled canvas should render with `image-rendering: pixelated` (CSS) applied to the canvas element inside the Konva Stage. This ensures each 128×128 pixel maps to a crisp 4×4 block of screen pixels rather than being blurred by the browser's default bilinear scaling. This pixelated look is intentional and useful — it shows the creator exactly what each pixel will look like in the final emoji.

No other design changes are needed. The card grows naturally to fit the larger canvas.

## Repository Standards

- Components live in `src/components/`, hooks in `src/hooks/`, utilities in `src/utils/`.
- TypeScript with strict types throughout. No `any`.
- React functional components with hooks only.
- Tests colocated with source files (`*.test.ts` / `*.test.tsx`) using Vitest.
- Verify changes with `task lint`, `task typecheck`, and `task test` before committing.
- Pre-commit hooks enforce linting and formatting — do not skip them.

## Technical Considerations

- **CSS transform does not affect layout flow.** The outer sizing div must explicitly set `width: ${width * displayScale}px; height: ${height * displayScale}px` so surrounding elements (toolbar, export panel) reflow correctly around the scaled canvas.
- **Konva pointer position auto-corrects for CSS scale.** Konva computes pointer position as `(clientX - rect.left) * (stage.width / rect.width)`. When `rect.width = 128 * 4` and `stage.width = 128`, this divides coordinates by the scale factor automatically. No manual coordinate math is needed for brush and eraser tools.
- **Text overlay input.** Currently `textInputPos` stores coordinates in Konva canvas space. Placing the `<input>` inside the scaled container means it inherits the `transform: scale(displayScale)` and appears at the correct visual position without any coordinate conversion.
- **`image-rendering: pixelated`.** Apply this CSS property to the `<canvas>` element rendered inside the Konva Stage to suppress browser interpolation and show crisp pixels.
- **Display scale.** A `displayScale` constant in `EmojiCanvas` is derived from the preset: `preset.width === 128 ? 4 : 1`. No state needed since the scale is fixed per preset.
- **No changes to export.** The export flow uses `latestSnapshot` (a Data URL of the offscreen canvas at native resolution) and never reads the CSS-scaled display. Zero changes needed in `exportUtils.ts` or `App.tsx`'s download handler.

## Security Considerations

No specific security considerations identified.

## Success Metrics

1. **Visual clarity**: The 128×128 canvas displays at 512×512 by default, making individual pixels clearly visible.
2. **Tool accuracy**: Brush, eraser, and text tools place marks at the correct pixel at 4x scale — verified by comparing the visual result to the exported PNG.
3. **Export unchanged**: Downloaded PNG/GIF/WebP files remain at 128×128 (Slack/Discord) or 512×512 (Apple) — byte-for-byte identical to pre-feature exports.
4. **No regressions**: `task lint`, `task typecheck`, and `task test` all pass.

## Open Questions

No open questions at this time.
