# 12 Questions Round 1 - Dark/Light Contrast Preview

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Preview Layout

Currently the analyzer shows two 64×64 preview boxes side by side ("Yours" vs "Reference"). How should the dark/light background previews be arranged?

- [x] (A) Replace the current white-background previews — show "Yours" on dark and "Yours" on light side by side (drop the reference emoji comparison)
- [ ] (B) Add dark/light previews as a new row below the existing "Yours vs Reference" comparison (keep both)
- [ ] (C) Show 4 previews in a grid: Yours-on-dark, Yours-on-light, Reference-on-dark, Reference-on-light
- [ ] (D) Other (describe)

## 2. Contrast Detection Method

How should the system determine if an emoji has low contrast against a background?

- [x] (A) Simple edge pixel sampling — check if the outer edge pixels of the emoji are too close in color to the background
- [ ] (B) Overall average color comparison — compare the emoji's average color to the background color
- [ ] (C) Percentage-based — flag if more than a certain % of visible (non-transparent) pixels are similar to the background color
- [ ] (D) I don't have a preference — pick whatever works best
- [ ] (E) Other (describe)

## 3. Contrast Sensitivity Threshold

How aggressively should the system flag contrast issues?

- [ ] (A) Conservative — only flag very obvious issues (e.g., white emoji on white background)
- [x] (B) Moderate — flag when the emoji would be noticeably hard to see
- [ ] (C) Aggressive — flag even subtle contrast concerns
- [ ] (D) I don't have a preference — pick a sensible default
- [ ] (E) Other (describe)

## 4. Contrast Suggestion Detail Level

What kind of suggestions should appear for contrast issues?

- [x] (A) Simple warning only (e.g., "Your emoji may be hard to see on light backgrounds")
- [ ] (B) Warning + generic tip (e.g., "...consider adding an outline or shadow")
- [ ] (C) Warning + specific actionable advice based on what's wrong (e.g., "The edges of your emoji are very light — try adding a dark outline")
- [ ] (D) Other (describe)

## 5. Background Colors

You mentioned dark (#1a1a1a) and light (#ffffff). Should these be:

- [ x] (A) Fixed to exactly those two colors — no customization needed
- [ ] (B) Fixed defaults but with the option to customize them later (build for fixed now, extensible later)
- [ ] (C) User-configurable from the start (e.g., color pickers for custom backgrounds)
- [ ] (D) Other (describe)

## 6. Interaction with Existing Suggestions

How should contrast suggestions relate to the existing suggestions (padding, sizing)?

- [x] (A) Mixed together in the same list — contrast warnings appear alongside padding/sizing suggestions
- [ ] (B) Separate section — contrast issues shown in their own group below the existing suggestions
- [ ] (C) I don't have a preference — whatever looks cleanest
- [ ] (D) Other (describe)
