# 12-spec-dark-light-contrast-preview

## Introduction/Overview

The existing Analyze feature shows the user's emoji next to a reference emoji on a white background, with suggestions about padding and sizing. This enhancement replaces that comparison with dark/light background previews so users can see how their emoji looks in both themes, and adds contrast-aware warnings to the suggestion list so users catch visibility issues before exporting.

## Goals

- Show the user's emoji on a dark (#1a1a1a) and light (#ffffff) background side by side after analysis
- Detect low-contrast situations where the emoji's edge pixels blend into either background
- Surface contrast warnings in the existing suggestion list alongside padding/sizing suggestions
- Help users catch visibility problems before sharing emojis with teammates on different themes

## User Stories

- **As a user creating custom emojis**, I want to see how my emoji looks on both dark and light backgrounds so that I can ensure it has good contrast and visibility regardless of which theme my teammates use.
- **As a user reviewing my emoji**, I want to be warned if my emoji will be hard to see on a particular background so that I can fix it before exporting.

## Demoable Units of Work

### Unit 1: Dark/Light Background Previews

**Purpose:** Replace the current "Yours vs Reference" comparison with dark and light background previews so the user can visually check their emoji against both themes.

**Functional Requirements:**

- The system shall replace the two-preview comparison (Yours + Reference) with two previews showing the user's emoji on dark (#1a1a1a) and light (#ffffff) backgrounds
- Each preview shall be 64x64 pixels with the emoji rendered at the center, matching the current preview sizing
- Each preview shall be labeled (e.g., "Dark" and "Light") below the preview frame
- The previews shall only appear after the user clicks the Analyze button, consistent with current behavior
- The previews shall use the downscaled emoji data URL when the export preset is smaller than the canvas size (existing downscale logic)

**Proof Artifacts:**

- Screenshot: Analyzer showing emoji on dark and light backgrounds side by side demonstrates the preview replacement works
- Screenshot: Previews appear only after clicking Analyze demonstrates conditional rendering

### Unit 2: Contrast Detection and Suggestions

**Purpose:** Analyze the emoji's edge pixels against both backgrounds and add contrast warnings to the existing suggestion list so users are alerted to visibility issues.

**Functional Requirements:**

- The system shall sample the outer edge pixels of the emoji's visible (non-transparent) content to determine edge colors
- The system shall compare edge pixel colors against both the dark (#1a1a1a) and light (#ffffff) background colors
- The system shall flag a contrast issue when edge pixels are too similar to a background color, using a moderate sensitivity threshold (noticeably hard to see, not just subtle concerns)
- Contrast suggestions shall appear in the same suggestion list as existing padding/sizing suggestions (mixed together)
- Contrast suggestions shall be simple warnings (e.g., "Your emoji may be hard to see on light backgrounds" or "Your emoji may be hard to see on dark backgrounds")
- The system shall pass ImageData to the contrast analysis function so it can inspect pixel colors
- If no contrast issues are detected, no contrast-related suggestions shall be added

**Proof Artifacts:**

- Screenshot: A light-colored emoji triggers a "hard to see on light backgrounds" warning demonstrates light-mode contrast detection
- Screenshot: A dark-colored emoji triggers a "hard to see on dark backgrounds" warning demonstrates dark-mode contrast detection
- Screenshot: A well-contrasted emoji shows no contrast warnings demonstrates false-positive avoidance
- Test: Contrast detection unit tests pass demonstrates edge pixel sampling logic works correctly

## Non-Goals (Out of Scope)

1. **Custom background colors** — the dark and light colors are fixed, not user-configurable
2. **Reference emoji comparison** — the existing "Yours vs Reference" comparison is being replaced, not kept alongside
3. **Actionable fix suggestions** — contrast warnings will be simple alerts, not specific fix recommendations (e.g., no "add an outline" tips)
4. **Automatic contrast fixing** — the system will not auto-adjust the emoji to improve contrast

## Design Considerations

- The two preview frames should match the current `.emoji-frame` styling but with different background colors instead of both being white
- Dark preview frame: background `#1a1a1a`; Light preview frame: background `#ffffff`
- Labels ("Dark" / "Light") should use the existing `.emoji-caption` class
- The overall layout stays as a horizontal side-by-side pair within `.emoji-compare`

## Repository Standards

- Use `task lint`, `task typecheck`, and `task test` to verify changes
- Colocate tests with source files (e.g., `generateSuggestions.test.ts` alongside `generateSuggestions.ts`)
- Follow existing component patterns in `src/components/` and utility patterns in `src/utils/`
- Pre-commit hooks enforce linting and formatting automatically

## Technical Considerations

- The contrast detection function should accept `ImageData` and return contrast suggestions as `string[]`, keeping the same shape as `generateSuggestions`
- Edge pixel sampling: walk the perimeter of the content bounding box (from `detectContentBounds`) and collect non-transparent pixel colors
- Color distance can be computed using Euclidean distance in RGB space; a moderate threshold (e.g., ~50-60 out of 255 per channel) avoids both false positives and missed obvious issues
- The `handleAnalyze` function in `App.tsx` already has access to `ImageData` and content bounds — the contrast check can be called there and its results merged into the suggestions array
- The `OptimizerPanel` props will change: `referenceEmojiSrc` is no longer needed

## Security Considerations

No specific security considerations identified.

## Success Metrics

1. **Contrast visibility** — users can see their emoji on both dark and light backgrounds after every analysis
2. **Accurate detection** — obvious contrast issues (e.g., white emoji on white, dark emoji on dark) are flagged consistently
3. **No false positives** — well-contrasted emojis do not trigger spurious warnings
4. **No regression** — existing padding/sizing suggestions continue to work correctly

## Open Questions

No open questions at this time.
