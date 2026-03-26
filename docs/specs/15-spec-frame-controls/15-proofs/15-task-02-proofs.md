# Spec 15 — Task 2.0 Proofs: Thickness Slider UI in DecoratePanel

## Changes Made

### DecoratePanel.tsx

- Added `frameThickness: number` and `onFrameThicknessChange: (value: number) => void` to `DecoratePanelProps`
- Destructured both props in the function signature
- Wrapped frames tab content in `<>...</>` fragment
- Added conditional slider block after `frames.map(...)` grid — only renders when `activeFrameId !== null`
- Slider: `type="range"` min=10, max=100, value=frameThickness, calls `onFrameThicknessChange` on change

### DecoratePanel.css

- Added `.decorate-panel__frame-controls` (padding: 8px 4px 0)
- Added `.decorate-panel__frame-label` (flex, align-items: center, gap: 8px, font-size: 12px)
- Added `.decorate-panel__frame-slider` (flex: 1)

### App.tsx

- Added `handleFrameThicknessChange` callback via `useCallback` — calls `setFrameThickness(value)`
- Passes `frameThickness={frameThickness}` and `onFrameThicknessChange={handleFrameThicknessChange}` to `<DecoratePanel>`

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

- Slider renders below frame grid only when a frame is active (`activeFrameId !== null`)
- No slider is shown when no frame is active
- Dragging the slider fires `onFrameThicknessChange` with the new numeric value, updating canvas in real time
- Switching frames (or having no frame active) correctly hides the slider
