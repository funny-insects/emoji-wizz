# Task 2.0 Proof Artifacts — Modal Integration and Toolbar Rewire

## CLI Output — Test Results

```
 Test Files  19 passed (19)
       Tests  143 passed (143)
    Start at  09:06:34
    Duration  2.36s
```

143 tests pass. 2 tolerance tests removed, 1 new `onOpenBgRemoval` test added (net -1 from task 1.0 baseline of 144).

## CLI Output — Lint

```
task: [lint] npx eslint src/
(no errors)
```

## CLI Output — Typecheck

```
task: [typecheck] npx tsc --noEmit
(no errors)
```

## Changes Summary

### `src/components/Toolbar.tsx`

- Removed props: `onRemoveBackground`, `bgTolerance`, `onBgToleranceChange`
- Added prop: `onOpenBgRemoval: () => void`
- Scissors button `onClick` changed from `() => onRemoveBackground(bgTolerance)` to `onOpenBgRemoval`
- Removed entire `<div className="toolbar-bg-settings">` block (tol label + number input)

### `src/App.tsx`

- Removed `bgTolerance` state (`useState(15)`) and `setBgTolerance`
- Removed `handleRemoveBackground` callback
- Added `showBgRemovalModal` state (`useState(false)`)
- Added `handleOpenBgRemoval` callback: sets `showBgRemovalModal` to `true`
- Added `handleBgRemovalConfirm(strength)` callback: calls `strengthToTolerance(strength)`, sets `bgRemovalRequest`, sets `showBgRemovalModal` to `false`
- Added `handleBgRemovalCancel` callback: sets `showBgRemovalModal` to `false`
- Toolbar now receives `onOpenBgRemoval={handleOpenBgRemoval}` (removed `bgTolerance`, `onBgToleranceChange`, `onRemoveBackground`)
- `<BackgroundRemovalModal>` rendered conditionally when `showBgRemovalModal` is `true`

### `src/components/Toolbar.test.tsx`

- Removed `onRemoveBackground`, `bgTolerance`, `onBgToleranceChange` from `defaultTextProps`
- Added `onOpenBgRemoval: () => {}` to `defaultTextProps`
- Removed test: "Remove BG button calls onRemoveBackground with current tolerance"
- Removed test: "tolerance input is visible when image is provided and updates on change"
- Added test: "Remove BG button calls onOpenBgRemoval"

### `src/utils/strengthToTolerance.ts` (created early for App.tsx import)

- Pure function: `strengthToTolerance(strength) = Math.round((strength / 100) * 128)`
