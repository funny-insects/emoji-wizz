# Spec 15 — Task 5.0 Proofs: Tests and Quality Gates

## Changes Made

### DecoratePanel.test.tsx

- Updated all 7 existing `render(<DecoratePanel ... />)` calls to include the 4 new required props:
  `frameThickness={100}`, `onFrameThicknessChange={vi.fn()}`, `onFrameThicknessCommit={vi.fn()}`, `onRemoveFrame={vi.fn()}`
- Added 6 new tests:
  - "renders thickness slider below active frame thumbnail in Frames tab" (5.2)
  - "does not render thickness slider when no frame is active" (5.3)
  - "calls onFrameThicknessChange when slider is dragged" (5.4)
  - "renders remove button on the active frame thumbnail" (5.5)
  - "does not render remove button when no frame is active" (5.6)
  - "calls onRemoveFrame when the × button is clicked" (5.7)

## CLI Output

### Test Suite

```
task: [test] npx vitest run

 RUN  v4.1.0

 Test Files  20 passed (20)
       Tests  153 passed (153)
    Start at  15:00:32
    Duration  2.37s
```

### ESLint

```
task: [lint] npx eslint src/
(exit 0 — no errors)
```

### TypeScript Typecheck

```
task: [typecheck] npx tsc --noEmit
(exit 0 — no errors)
```

## Verification

- 153/153 tests pass (7 existing + 6 new = 13 DecoratePanel tests; all other test files unaffected)
- No lint violations
- No TypeScript errors
- onRemoveFrame test verifies stopPropagation: onToggleFrame is NOT called when × is clicked
- Slider show/hide tests verify conditional rendering based on activeFrameId
- onChange test verifies the numeric value is correctly passed to onFrameThicknessChange
