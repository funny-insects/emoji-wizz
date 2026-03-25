# 10 Questions Round 1 - Unified Canvas Export

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Platform Preset Selector Behavior

Currently the preset selector (Slack/Discord/Apple) sits at the top and controls the canvas size. With this change, the canvas is always 512x512 for editing. What should happen to the preset selector?

- [x] (A) Remove it from the top entirely — platform choice only appears at export/download time
- [ ] (B) Keep it at the top but only as a visual indicator (e.g., shows which format you'll export to), canvas stays 512x512 regardless
- [ ] (C) Move the preset selector into the export controls area (next to the download button)
- [ ] (D) Other (describe)

## 2. Canvas Label Display

Currently the canvas shows "CANVAS — 128×128PX" or "CANVAS — 512×512PX" based on the selected preset. What should it show now that editing is always at 512x512?

- [ ] (A) Always show "CANVAS — 512×512PX" since that's the editing resolution
- [ ] (B) Show "CANVAS — 512×512PX" with a subtitle like "Exports to 128×128" based on selected export format
- [x] (C) Remove the dimension label entirely
- [ ] (D) Other (describe)

## 3. Safe Zone Overlay

Each preset currently has a safe zone padding (12px for Slack, 10px for Discord, 40px for Apple). With a unified 512x512 canvas, how should safe zones work?

- [ ] (A) Scale safe zone padding proportionally to 512x512 (e.g., Slack's 12px at 128 becomes 48px at 512) and show it based on the selected export format
- [ ] (B) Show safe zones for all three platforms simultaneously with different colors/styles
- [ ] (C) Only show safe zone when user selects an export format (on-demand)
- [x] (D) Remove safe zone overlay from the editing canvas entirely — only check at export
- [ ] (E) Other (describe)

## 4. Export Format Selection

How should users choose their export format at download time?

- [x] (A) Dropdown menu next to the download button with Slack/Discord/Apple options
- [ ] (B) Radio buttons or toggle group (similar to current preset selector style) in the export area
- [ ] (C) A modal/dialog that appears when clicking "Download" letting them choose format
- [ ] (D) Allow downloading multiple formats at once (e.g., checkboxes for each platform)
- [ ] (E) Other (describe)

## 5. Analyzer Behavior

You mentioned the analyzer should still work with the "current set up." To clarify — should the analyzer:

- [ ] (A) Always analyze at the selected export resolution (e.g., if exporting for Slack, analyze the downscaled 128x128 version)
- [x] (B) Analyze the 512x512 canvas as-is, but show suggestions relative to the selected export format
- [ ] (C) Let the user pick which platform to analyze for, independent of the export choice
- [ ] (D) Other (describe)

## 6. Display Magnification

Currently 128x128 presets are displayed at 4x magnification so they appear larger on screen. Since editing will now always be at 512x512, the canvas will naturally be larger. Should the canvas display size change?

- [x] (A) Display the 512x512 canvas at 1x (same physical size as the current Apple preset view)
- [_] (B) Allow the user to zoom in/out on the canvas for comfort
- [ ] (C) Auto-fit the canvas to available screen space
- [ ] (D) Other (describe)

## 7. Downscaling Quality

When exporting to 128x128 from a 512x512 canvas, downscaling quality matters. Any preference?

- [ ] (A) Use browser default canvas downscaling (good enough for emoji)
- [x] (B) Use high-quality downscaling with anti-aliasing (smoother result, slightly more complex)
- [ ] (C) No preference — whatever looks best
- [ ] (D) Other (describe)
