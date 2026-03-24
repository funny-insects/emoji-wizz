# 06 Questions Round 1 - Visual Size Optimizer

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Bounds Detection Method

The Visual Size Optimizer needs to detect the "active content area" of the emoji (the non-transparent region). How should the bounds detection work?

- [x] (A) Client-side pixel analysis — scan the canvas pixel data via Konva's `toCanvas()` + `getImageData()` to find the bounding box of non-transparent pixels
- [ ] (B) Server-side analysis — send the image to a backend endpoint that returns bounds metadata
- [ ] (C) Manual input — let the user drag handles to define the content bounds themselves
- [ ] (D) Other (describe)

## 2. Reference Emoji for Side-by-Side Preview

The spec overview mentions showing the custom emoji "next to a default yellow one" for size comparison. What should the reference emoji be?

- [x] (A) A hardcoded built-in emoji image (e.g., a standard yellow smiley face PNG bundled with the app)
- [ ] (B) A real Slack/system emoji fetched from a public URL or emoji set (e.g., Twemoji)
- [ ] (C) No reference emoji — just show the custom emoji at actual rendered size without comparison
- [ ] (D) Show the custom emoji at multiple simulated sizes (16px, 32px, 64px) so the user sees how it looks at each size
- [ ] (E) Other (describe)

## 3. Suggestions to Surface

The spec overview lists these possible suggestions. Which do you want for this spec?

- [ ] (A) "Increase face size by X%" — based on how much of the safe zone the content fills
- [ ] (B) "Trim transparent padding" — detect excess empty space around the content
- [ ] (C) "Boost outline for readability" — detect thin strokes at small sizes (stretch goal)
- [ ] (D) "Simplify details for small display" — detect high-frequency detail (stretch goal)
- [ ] (E) All of the above
- [x] (F) Just (A) and (B) — the two geometric/padding ones that can be computed without AI
- [ ] (G) Other (describe)

## 4. Where Suggestions Are Displayed

Where should the optimizer results (bounds visualization + suggestions) appear?

- [x] (A) Panel below the canvas — a dedicated section showing analysis results and suggestions
- [ ] (B) Sidebar next to the canvas
- [ ] (C) Overlay on the canvas itself — draw the detected bounds as a colored box on the Konva stage
- [ ] (D) Both (A/B) and (C) — overlay on canvas AND a text panel with suggestions
- [ ] (E) Other (describe)

## 5. When Is Analysis Triggered

When should the optimizer run?

- [ ] (A) Automatically whenever an image is loaded or the preset changes
- [x] (B) On demand — user clicks an "Analyze" button
- [ ] (C) Both — auto-run on load, but also provide a manual re-analyze button
- [ ] (D) Other (describe)

## 6. Proof Artifacts

What kinds of evidence would best demonstrate this feature is working? Select what you'd find most convincing.

- [ ] (A) Screenshot of the UI showing the bounds overlay drawn on a test image and suggestions listed below
- [ ] (B) Unit test asserting the bounds-detection utility returns correct `{ x, y, width, height }` for a known test image
- [ ] (C) Unit test asserting the suggestion logic outputs the correct suggestion text for given bounds inputs
- [x] (D) All of the above
- [ ] (E) Other (describe)
