# 13 Task 3.0 Proofs — Live Preview with Debounced Background Removal

## Summary

Task 3.0 adds a live preview canvas inside `BackgroundRemovalModal` that updates
as the user adjusts the strength slider, using debounced background removal (250ms).
`strengthToTolerance` maps the 1–100 slider to 0–128 tolerance.

---

## CLI Output

### `task lint`

```
task: [lint] npx eslint src/
(no output — 0 errors, 0 warnings)
```

### `task typecheck`

```
task: [typecheck] npx tsc --noEmit
(no output — 0 errors)
```

### `task test`

```
 RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

 Test Files  20 passed (20)
       Tests  147 passed (147)
    Start at  09:14:42
    Duration  2.51s
```

---

## Test Results

### `strengthToTolerance` utility (`src/utils/strengthToTolerance.test.ts`)

All four edge-case assertions pass:

| Input                      | Expected | Result |
| -------------------------- | -------- | ------ |
| `strengthToTolerance(1)`   | 1        | ✅ 1   |
| `strengthToTolerance(25)`  | 32       | ✅ 32  |
| `strengthToTolerance(50)`  | 64       | ✅ 64  |
| `strengthToTolerance(100)` | 128      | ✅ 128 |

---

## Implementation Evidence

### 3.1 — `src/utils/strengthToTolerance.ts`

```ts
export function strengthToTolerance(strength: number): number {
  return Math.round((strength / 100) * 128);
}
```

### 3.2 — `src/utils/strengthToTolerance.test.ts`

Tests: maps 1→1, 25→32, 50→64, 100→128. All pass.

### 3.3 — `App.tsx` canvas exposure

- Added `offscreenCanvasRef` (`useRef<HTMLCanvasElement | null>`) to `App.tsx`
- `handleOpenBgRemoval` reads `offscreenCanvasRef.current`, calls `ctx.getImageData(...)`, stores in `bgRemovalImageData` state
- `bgRemovalImageData` passed as `imageData` prop to `BackgroundRemovalModal`
- `EmojiCanvas` receives `canvasRef` prop and syncs it in both canvas-update effects

### 3.4–3.6 — Preview canvas in `BackgroundRemovalModal.tsx`

- Preview canvas dimensions: max 200px, maintains source aspect ratio
- Canvas shown between slider and confirm button when `imageData` is non-null
- Checkerboard background (`repeating-conic-gradient`) shows transparency
- Debounced `useEffect` (250ms): calls `removeBackground(imageData, strengthToTolerance(strength))` on strength change, draws scaled result to preview canvas

### 3.7 — `handleBgRemovalConfirm` uses `strengthToTolerance`

Already in place from task 2.0: `tolerance: strengthToTolerance(strength)`.

---

## Verification

- ✅ `strengthToTolerance` utility exists and all edge cases pass
- ✅ `BackgroundRemovalModal` renders preview canvas when `imageData` is provided
- ✅ Debounced effect updates canvas on strength change
- ✅ `App.tsx` reads `ImageData` from offscreen canvas on modal open
- ✅ All 147 tests pass, lint clean, typecheck clean
