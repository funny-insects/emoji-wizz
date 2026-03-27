# Task 3.0 Proof Artifacts — Wire EmojiCanvas to use eraserSize prop

## Changes Made

### `src/components/EmojiCanvas.tsx`

- Removed hardcoded formula: `const eraserRadius = Math.round((width / 128) * 3);`
- Replaced all 3 occurrences of `eraserRadius` with `eraserSize`:
  - `ctx.arc(stageX, stageY, eraserSize, 0, Math.PI * 2)` in `applyEraserAt`
  - `[imageRect, eraserSize]` in useCallback dependency array
  - `<Circle radius={eraserSize} ...>` in Konva overlay

### `src/App.tsx`

- Passes `eraserSize={eraserSize}` to `<EmojiCanvas>`

## CLI Output

### `task typecheck`

```
task: [typecheck] npx tsc --noEmit
(exit code 0 — no output, no errors)
```

### `task test`

```
Test Files  20 passed (20)
      Tests  155 passed (155)
   Start at  14:26:05
   Duration  4.24s
```

## Verification

- `eraserRadius` no longer exists anywhere in the codebase — replaced entirely by `eraserSize` prop
- Default value of `eraserSize = 12` in EmojiCanvas ensures backward-compatible behavior if prop is omitted
- Eraser circle cursor (`<Circle radius={eraserSize}>`) now reflects slider value in real time
- `eraserSize` in the `useCallback` dependency array ensures `applyEraserAt` updates when size changes
