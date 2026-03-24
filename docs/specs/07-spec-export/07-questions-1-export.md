# 07 Questions Round 1 - Export

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Supported Export Formats

The spec overview mentions PNG, GIF, and WebP. Which formats should be in scope for this spec?

- [ ] (A) PNG only — simplest path, covers most Slack/Discord use cases
- [ ] (B) PNG + WebP — adds modern format with better compression
- [x] (C) PNG + GIF + WebP — full set as described in the overview
- [ ] (D) Other (describe)

## 2. Format Selection UI

How should the user choose which format to export?

- [ ] (A) Single "Download" button — always exports PNG (simplest)
- [x] (B) Dropdown next to a "Download" button — user picks format before downloading
- [ ] (C) Multiple format buttons — e.g., "Download PNG", "Download WebP", "Download GIF"
- [ ] (D) Other (describe)

## 3. File Size Validation

Each preset has a `maxFileSizeKb` value (e.g., Slack = 128 KB). Should export enforce this limit?

- [x] (A) Yes — warn the user if the exported file exceeds the preset's limit (but still allow download)
- [ ] (B) Yes — block download if the file exceeds the preset's limit and show an error
- [ ] (C) No — skip file size validation for this spec; that's a future concern
- [ ] (D) Other (describe)

## 4. Canvas Content for Export

The canvas currently renders: checkerboard background + safe-zone guide + image. What should actually be exported?

- [ ] (A) Image only on transparent background — strip the checkerboard and safe-zone guide
- [ ] (B) Image on white background — no transparency
- [ ] (C) Exactly what's shown on canvas — includes checkerboard and guide lines
- [ ] (D) Other (describe)

## 5. Export Button Placement

Where should the Export/Download button live in the UI?

- [x] (A) Below the canvas — natural reading order
- [ ] (B) In a toolbar/header area alongside existing controls
- [ ] (C) Floating action button on the canvas
- [ ] (D) Other (describe)

## 6. Disabled State

Should the Download button be disabled when no image is loaded?

- [x] (A) Yes — button is disabled/greyed out until an image is loaded
- [ ] (B) No — button is always visible; clicking with no image shows an error or does nothing
- [ ] (E) Other (describe)

## 7. Default Filename

What should the downloaded file be named?

- [ ] (A) Generic fixed name — e.g., `emoji.png`
- [_] (B) Preset-based name — e.g., `slack-emoji.png`, `discord-emoji.webp`
- [x] (C) Timestamp-based — e.g., `emoji-2026-03-23.png`
- [ ] (D) Other (describe)
