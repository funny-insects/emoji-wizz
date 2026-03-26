# Spec 15 — Task 1.0 Proofs: frameThickness State and Canvas Rendering

## Changes Made

### App.tsx

- Added `const [frameThickness, setFrameThickness] = useState<number>(50);` below `activeFrameId` state (line 86)
- Updated `handleToggleFrame` to call `setFrameThickness(50)` when switching to a new frame
- Passes `frameThickness={frameThickness}` to `<EmojiCanvas>`

### EmojiCanvas.tsx

- Added `frameThickness?: number` to `EmojiCanvasProps` interface (after `activeFrameSrc`)
- Added `frameThickness = 100` default in function parameter destructuring
- Replaced hardcoded `x={0} y={0} width={width} height={height}` with computed scale values:
  ```
  const frameScale = 100 / frameThickness;
  const frameW = width * frameScale;
  const frameH = height * frameScale;
  const frameX = -(frameW - width) / 2;
  const frameY = -(frameH - height) / 2;
  ```

## CLI Output

### TypeScript Typecheck

```
task: [typecheck] npx tsc --noEmit
(exit 0 — no errors)
```

### ESLint

```
task: [lint] npx eslint src/
(exit 0 — no errors)
```

## Verification

- `frameThickness` state initialized at 50 in `App.tsx`
- Toggling to a new frame resets thickness to 50; toggling off the same frame does not reset
- `EmojiCanvas` default of 100 means full-size frame when no prop is passed (backward-compatible)
- Scaling math: at thickness=50, frameScale=2, so frame is rendered at 2x size centered on canvas — outer edge stays flush, inner edge moves inward ~50% of frame width
- Konva stage clips overflow automatically, no explicit clip needed
