# 04 Task 4.0 Proofs — Text Overlay Tool

## CLI Output

### `task typecheck`

```
(no output — clean)
```

### `task lint`

```
(no output — clean, 0 warnings)
```

### `task test` (unit tests)

```
 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  7 passed (7)
       Tests  53 passed (53)
    Start at  09:50:41
    Duration  1.62s
```

### `task test:e2e` (Playwright)

```
Running 15 tests using 5 workers

  ✓  e2e/app.spec.ts:8:1 › app renders a preset selector dropdown
  ✓  e2e/app.spec.ts:3:1 › app renders a canvas element
  ✓  e2e/canvas.spec.ts:11:1 › canvas renders with Slack preset dimensions
  ✓  e2e/brush.spec.ts:89:1 › brush tool: crosshair cursor visible when brush is active with image loaded
  ✓  e2e/canvas.spec.ts:19:1 › canvas renders non-empty pixel data (checkerboard is drawing)
  ✓  e2e/canvas.spec.ts:37:1 › switching to Apple preset with no image resizes canvas silently
  ✓  e2e/brush.spec.ts:26:1 › brush tool: drag draws black stroke on image layer and undo removes it
  ✓  e2e/canvas.spec.ts:50:1 › switching preset after image upload shows confirm dialog and resizes canvas
  ✓  e2e/canvas.spec.ts:67:1 › canvas pixel data changes after file upload
  ✓  e2e/eraser.spec.ts:83:1 › eraser cursor (circle) shows when eraser tool is active and mouse is over canvas
  ✓  e2e/eraser.spec.ts:26:1 › eraser tool: drag erases pixels to transparent (alpha=0) and undo restores them
  ✓  e2e/text-tool.spec.ts:38:1 › text tool: typing and pressing Enter renders text on canvas
  ✓  e2e/text-tool.spec.ts:171:1 › text tool: text cursor visible when text tool is active with image loaded
  ✓  e2e/text-tool.spec.ts:94:1 › text tool: undo removes placed text
  ✓  e2e/text-tool.spec.ts:130:1 › text tool: changing color affects new text placement

  15 passed (4.1s)
```

## Test Results

### New Unit Tests (Toolbar — text tool settings)

- `does not render color swatches or size buttons when tool is not text` ✓
- `renders 8 color swatches and 3 size buttons when text tool is active` ✓
- `calls onTextColorChange when a color swatch is clicked` ✓
- `calls onTextSizeChange when a size button is clicked` ✓
- `active color swatch has the active CSS class` ✓
- `active size button has the active CSS class` ✓

### New Unit Tests (EmojiCanvas — text tool)

- `shows a text input element on click when text tool is active` ✓
- `pushes exactly one snapshot when text is finalized with Enter` ✓
- `does not push a snapshot when text input is empty on Enter` ✓
- `calls fillText on the canvas context when text is finalized` ✓
- `discards text input when tool switches away from text` ✓

### New E2E Tests (text-tool.spec.ts)

- `text tool: typing and pressing Enter renders text on canvas` ✓
- `text tool: undo removes placed text` ✓
- `text tool: changing color affects new text placement` ✓
- `text tool: text cursor visible when text tool is active with image loaded` ✓

## Implementation Summary

### Files Modified

- `src/utils/textTool.ts` — new; exports `TextSize`, `TEXT_COLOR_PALETTE`, `TEXT_SIZE_PRESETS`
- `src/App.tsx` — added `textColor`/`textSize` state, imports from `textTool.ts`, passes props to Toolbar/EmojiCanvas
- `src/components/Toolbar.tsx` — added color swatch and size preset UI (visible when text tool active)
- `src/components/Toolbar.css` — added `.toolbar-text-settings`, `.toolbar-color-swatch`, `.toolbar-size-btn` styles
- `src/components/EmojiCanvas.tsx` — added click-to-place text input, `finalizeText` function with Konva.Text + canvas flatten + undo push
- `src/test-setup.ts` — added `measureText: () => ({ width: 0 })` to mock context so Konva.Text works in JSDOM
- `src/components/Toolbar.test.tsx` — updated existing tests for new props, added 6 text-tool-settings tests
- `src/components/EmojiCanvas.test.tsx` — added 5 text tool tests
- `e2e/text-tool.spec.ts` — new; 4 e2e tests

### Key Design Decisions

- Color palette and size presets live in `src/utils/textTool.ts` to avoid fast-refresh lint warnings from exporting values in component files
- Text input position tracked in state (not a ref) so derived-state pattern can discard it when tool switches without calling setState in a useEffect
- `finalizeText` receives the position as a parameter (closure-safe) rather than reading a ref during a React event handler
- Konva.Text is created, used to draw on offscreen canvas, then immediately destroyed (destructive flatten on placement, matching brush behavior)
- Font size scaled proportionally: `base * (stageWidth / 512)`

## Verification

All proof artifacts demonstrate required functionality:

- Text appears on canvas after click + type + Enter (E2E verified)
- Undo restores canvas to pre-text state (E2E verified)
- Color swatches and size buttons shown only when text tool is active (unit + E2E verified)
- Clicking swatch/size calls correct callbacks (unit verified)
- Empty text does not push a snapshot (unit verified)
- Tool switch discards open text input (unit verified)
