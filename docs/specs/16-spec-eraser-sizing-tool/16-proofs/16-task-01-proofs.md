# Task 1.0 Proof Artifacts — Add eraserSize state and update prop interfaces

## CLI Output

### `task typecheck`

```
task: [typecheck] npx tsc --noEmit
(exit code 0 — no output, no errors)
```

## Changes Made

### `src/App.tsx`

- Added `const [eraserSize, setEraserSize] = useState<number>(12);` after `brushSize` state

### `src/components/Toolbar.tsx`

- Added to `ToolbarProps` interface:
  ```ts
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  ```
- Added `eraserSize` and `onEraserSizeChange` to destructured function parameters

### `src/components/EmojiCanvas.tsx`

- Added `eraserSize?: number;` to `EmojiCanvasProps` interface (after `brushSize`)
- Added `eraserSize = 12` to destructured function parameters with default of `12`

## Verification

- `task typecheck` exits with code 0 — all new props are type-safe
- Default value of `12` matches the previous hardcoded formula output: `Math.round((512 / 128) * 3) = 12`
- No behaviour changes in this task — only type-level additions
