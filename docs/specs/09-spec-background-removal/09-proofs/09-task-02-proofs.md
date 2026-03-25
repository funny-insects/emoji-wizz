# Task 2.0 Proof Artifacts — Add "Remove BG" Button and Tolerance Input to Toolbar

## CLI Output — Test Run

```
 RUN  v4.1.0 /Users/anmol/emoji-wizz

 Test Files  1 passed (1)
       Tests  16 passed (16)
    Start at  17:53:27
    Duration  1.02s (transform 50ms, setup 59ms, import 89ms, tests 268ms, environment 516ms)
```

Command: `npx vitest run src/components/Toolbar.test.tsx`

## Test Results

All 16 tests passed, including 5 new tests:

1. **renders all tool buttons when image is provided** (renamed + extended) — asserts "Remove BG" button is in the document.
2. **Remove BG button is disabled when image is null** — Toolbar returns null when no image, so button is absent.
3. **Remove BG button never has the active class** — confirms `toolbar-btn--active` is not applied.
4. **Remove BG button calls onRemoveBackground with current tolerance** — fired click with `bgTolerance=30`, mock called with `30`.
5. **tolerance input is visible when image is provided and updates on change** — input found by `spinbutton` role with name "tol", change fires `onBgToleranceChange(20)`.

## Files Modified

- `src/components/Toolbar.tsx`
  - Added `onRemoveBackground`, `bgTolerance`, `onBgToleranceChange` to `ToolbarProps` interface and destructuring
  - Added "Remove BG" button in `toolbar-tools` div (`className="toolbar-btn"`, no active-state, `disabled={!image}`)
  - Added `toolbar-bg-settings` div with tolerance `<input type="number">` (id=`bg-tolerance`, min=0, max=128)
- `src/components/Toolbar.test.tsx`
  - Added 3 new props to `defaultTextProps`
  - Renamed and extended the "renders all 5 buttons" test
  - Added 5 new test cases for Remove BG button and tolerance input
  - Added `{...defaultTextProps}` spread to text-settings tests that were missing required props

## Verification

- All 16 Toolbar tests green
- Button does not toggle active state (no `toolbar-btn--active` logic)
- Tolerance input uses same pattern as brush-size input (label + number input with range guard)
