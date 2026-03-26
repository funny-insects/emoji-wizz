# 13 Questions Round 1 - Background Removal UI Rework

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Popup Positioning

Where should the popup appear when the user clicks the scissors button?

- [x] (A) Centered on screen as a modal with a dark overlay backdrop (like the existing SpeechBubbleModal)
- [ ] (B) Anchored next to the scissors button (like a popover/dropdown)
- [ ] (C) Sliding panel from the side
- [ ] (D) Other (describe)

## 2. Strength Slider vs. Number Input

How should the user select the strength percentage (1-100)?

- [x] (A) A slider (range input) only
- [ ] (B) A number input only (like the current "tol" field)
- [ ] (C) Both a slider and a number input together (drag or type)
- [ ] (D) Other (describe)

## 3. Default Strength Value

The current default tolerance is 15 (out of 0-128). What should the default strength % be?

- [ ] (A) Keep it roughly equivalent (~12% mapped from 15/128)
- [x] (B) 50% (middle ground, easiest to understand)
- [ ] (C) A specific value (please specify)
- [ ] (D) No preference, pick something sensible

## 4. Confirm Button Label

What should the confirm button say?

- [x] (A) "Remove Background"
- [ ] (B) "Remove"
- [ ] (C) "Yes" (as you mentioned)
- [ ] (D) Other (describe)

## 5. Popup Title / Description

You mentioned the popup should say "background remover." Should it include any additional description text explaining what the tool does?

- [ ] (A) Just the title "Background Remover" — no extra text needed
- [x] (B) Title + a short one-liner like "Automatically removes the background color from your image"
- [ ] (C) Other (describe)

## 6. Old Tolerance UI Cleanup

The current "tol" label and number input sit directly in the toolbar. Should they be completely removed (only accessible via the popup)?

- [x] (A) Yes, remove them entirely — the popup is the only way to configure and trigger background removal
- [ ] (B) Keep the scissors button in the toolbar but move all settings into the popup
- [ ] (C) Other (describe)

## 7. Live Preview

Should the user see a preview of the background removal result before confirming?

- [ ] (A) No preview — just configure strength and confirm (keeps it simple and fast)
- [x] (B) Yes, show a live preview as the user adjusts the strength slider
- [ ] (C) Other (describe)
