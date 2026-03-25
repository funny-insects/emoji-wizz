# Task 3.0 Proofs — Crop Tool: Overlay UI and Interaction

## CLI Output

```
$ task lint && task typecheck && task test && task format:check
task: [lint] npx eslint src/
task: [typecheck] npx tsc --noEmit
task: [test] npx vitest run

 Test Files  17 passed (17)
      Tests  133 passed (133)

task: [format:check] npx prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

## Implementation Summary

### 3.1 EditorTool type expanded

- `src/App.tsx`: `EditorTool = "pointer" | "eraser" | "brush" | "text" | "crop"`

### 3.2 Crop button added to Toolbar

- Added in `toolbar-tools` section with icon `⬒`, `toolbar-btn--active` when `activeTool === "crop"`, `disabled={!image}`

### 3.3 Crop overlay state

- `cropRect` state: `{ x: number; y: number; size: number } | null`
- Initialized on tool activation (sync during render, matching `prevActiveTool` pattern) to centered 50% square
- Cleared when switching away from crop tool

### 3.4 Crop overlay Layer

- New Konva `<Layer>` between eraser/overlays and stickers layers (6 layers total)
- 4 dark `<Rect>` elements around crop area (`rgba(0,0,0,0.5)`)
- White-bordered dashed `<Rect>` for selection boundary

### 3.5 Draggable crop selection

- `draggable` prop on crop `<Rect>`
- `onDragEnd` clamps position within canvas bounds (0 to 512-size)

### 3.6 Resize handles via Transformer

- Konva `<Transformer>` with `keepRatio: true`, corner anchors only, no rotation
- `boundBoxFunc` enforces min 20x20px and canvas bounds
- `onTransformEnd` normalizes scale back to 1 and updates `cropRect`

### 3.7 Keyboard handlers

- Enter key triggers `handleCropConfirm` (in App.tsx keydown handler)
- Escape key triggers `handleCropCancel` (sets activeTool to "pointer")

### 3.8 Confirm/Cancel buttons

- Visible in toolbar when `activeTool === "crop"`
- Confirm button (checkmark) calls `onCropConfirm`
- Cancel button (X) calls `onCropCancel`
- Styled with green/red colors via `.toolbar-btn--confirm` / `.toolbar-btn--cancel`

### 3.9 Other tools disabled during crop

- Existing tool-gating in `handleMouseDown`/`handleMouseMove`/`handleClick` already prevents eraser/brush/text when `activeTool === "crop"`
- Cursor set to `crosshair` during crop mode

## Test Results

- Updated existing layer count test from 5 to 6 layers
- All 133 tests pass including the updated layer test

## Verification

- Lint: pass
- TypeScript: pass
- Tests: 133/133 pass
- Formatting: pass
