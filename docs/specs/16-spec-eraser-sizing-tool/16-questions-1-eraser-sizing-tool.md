# 16 Questions Round 1 - Eraser Sizing Tool

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Control Type

The brush tool uses a number input (type="number", range 1–100) in the Toolbar. What control type should the eraser size use?

- [ ] (A) Number input — same style as brush size (consistent UX, simple)
- [x] (B) Slider (range input) — more visual and tactile for sizing
- [ ] (C) Both — a slider with a number input next to it for precision
- [ ] (D) Other (describe)

## 2. Size Range

What should the minimum and maximum eraser size be? The current hardcoded size is ~12px for a 512×512 canvas.

- [ ] (A) 1–50px — smaller range, suitable for precision work
- [x] (B) 1–100px — match the brush size range exactly
- [ ] (C) 1–200px — larger range for bulk erasing
- [ ] (D) Other (describe)

## 3. Default Value

What should the eraser start at when the tool is first selected?

- [x] (A) Keep current auto-calculated size (~12px for 512px canvas) as the default
- [ ] (B) A fixed default of 10px (close to current, simpler)
- [ ] (C) A fixed default of 20px (larger, easier for casual erasing)
- [ ] (D) Other (describe)

## 4. Persistence Between Tool Switches

If the user sets the eraser to 30px, then switches to the brush tool, then back to eraser — what should happen?

- [x] (A) Remember the last eraser size (persists within the session)
- [ ] (B) Reset to default each time the eraser tool is selected
- [ ] (C) Other (describe)

## 5. Proof Artifacts

How will we demonstrate this feature works? (Select all that apply)

- [ ] (A) Screenshot of the Toolbar showing the eraser size control when eraser is active
- [x] (B) E2E test (Playwright) that selects the eraser, changes the size, and verifies larger/smaller erased areas on the canvas
- [ ] (C) Unit test verifying the eraser radius changes based on the setting
- [ ] (D) Other (describe)
