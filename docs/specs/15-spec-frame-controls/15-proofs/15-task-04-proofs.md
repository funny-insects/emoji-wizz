# Spec 15 — Task 4.0 Proofs: Frame Remove Button

## Changes Made

### DecoratePanel.tsx

- Added `onRemoveFrame: () => void` to `DecoratePanelProps`
- Destructured `onRemoveFrame` in function signature
- Updated `frames.map(...)` to add `style={{ position: "relative" }}` on parent button
- Added `×` button (`.decorate-panel__frame-remove`) with `aria-label="Remove frame"` conditionally rendered when `activeFrameId === def.id`
- × button calls `e.stopPropagation()` then `onRemoveFrame()` to avoid triggering toggle

### DecoratePanel.css

- Added `.decorate-panel__frame-remove`: position absolute, top-right 2px, 16x16px circle, dark bg, white text
- Added `.decorate-panel__frame-remove:hover`: red hover background

### App.tsx

- Added `handleRemoveFrame` callback: pushes undo snapshot with `activeFrameId: null, frameThickness: 50`, then calls setters
- Passes `onRemoveFrame={handleRemoveFrame}` to `<DecoratePanel>`

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

### Three Removal Paths (4.6)

All three flows correctly deselect the active frame:

1. **Click active thumbnail** → `onToggleFrame` called with same id → `nextFrameId = null` → frame removed
2. **Click × button** → `stopPropagation` prevents toggle, `onRemoveFrame` called → `setActiveFrameId(null)` → frame removed
3. **Cmd+Z** → `handleUndo` restores previous snapshot with `activeFrameId: null` → frame removed

Additional: × button only visible on active frame thumbnail; inactive thumbnails show no × button
