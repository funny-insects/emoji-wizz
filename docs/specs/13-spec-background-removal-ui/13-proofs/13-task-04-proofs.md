# 13 Task 4.0 Proofs — Clean Up and Final Verification

## Summary

Task 4.0 verifies no dead code remains from the old tolerance flow and all
quality gates pass cleanly.

---

## CLI Output

### 4.1 — Dead code search

```
$ grep -rn "bgTolerance\|onBgToleranceChange\|toolbar-bg-settings" src/
(no output — no dead code found)
```

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
    Start at  09:16:08
    Duration  2.37s
```

### `task format:check`

```
task: [format:check] npx prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

---

## Verification

### 4.2 — `EmojiCanvas` bgRemovalRequest flow

The flow from UI to canvas:

1. User adjusts slider in `BackgroundRemovalModal` → clicks "Remove Background"
2. `handleBgRemovalConfirm(strength)` in `App.tsx` calls `strengthToTolerance(strength)` → sets `bgRemovalRequest`
3. `EmojiCanvas` `useEffect` on `bgRemovalRequest` reads `offscreenCanvasRef`, calls `removeBackground(imageData, tolerance)`, updates the display canvas

No regressions: the `bgRemovalRequest` type (`{ tolerance: number; seq: number }`) is unchanged.

### 4.3–4.6 — All quality gates

| Check               | Result                  |
| ------------------- | ----------------------- |
| `task lint`         | ✅ 0 errors, 0 warnings |
| `task typecheck`    | ✅ 0 errors             |
| `task test`         | ✅ 147/147 pass         |
| `task format:check` | ✅ All files formatted  |
