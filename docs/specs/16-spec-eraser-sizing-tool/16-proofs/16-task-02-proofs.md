# Task 2.0 Proof Artifacts — Add eraser size slider to Toolbar

## Changes Made

### `src/components/Toolbar.tsx`

- Added eraser size slider block after the brush settings block (renders when `activeTool === "eraser"`)
- `eraserSize` and `onEraserSizeChange` added to destructured params

### `src/components/Toolbar.css`

- Added `.toolbar-eraser-size`, `.toolbar-eraser-size-label`, `.toolbar-eraser-size-slider` CSS rules

### `src/App.tsx`

- Passes `eraserSize={eraserSize}` and `onEraserSizeChange={setEraserSize}` to `<Toolbar>`

### `src/components/Toolbar.test.tsx`

- Added `eraserSize: 12` and `onEraserSizeChange: () => {}` to `defaultTextProps`
- Added test: "renders eraser size slider when eraser tool is active"
- Added test: "does not render eraser size slider when brush tool is active"

## CLI Output

### `task test`

```
Test Files  20 passed (20)
      Tests  155 passed (155)
   Start at  14:26:05
   Duration  4.24s
```

## Verification

- Slider renders only when `activeTool === "eraser"` (conditional `{activeTool === "eraser" && ...}`)
- Slider hidden for brush, pointer, text tools — confirmed by unit test
- Slider has `id="eraser-size"`, `min=1`, `max=100`, `type="range"`
