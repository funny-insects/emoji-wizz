# 13-spec-background-removal-ui

## Introduction/Overview

The background removal tool (scissors) currently has a confusing UX — the tolerance ("tol") setting sits directly in the toolbar with no explanation, and clicking the scissors button immediately removes the background with no confirmation. This spec reworks the flow into a clear modal-based interaction: click scissors → see a popup explaining the tool → adjust strength with a slider and live preview → confirm or cancel.

## Goals

- Replace the unclear "tol" label and inline number input with an intuitive "Strength %" slider (1–100) inside a modal
- Give users a clear understanding of what the background removal tool does before they use it
- Provide a live preview so users can see the effect of their chosen strength before committing
- Add confirm/cancel actions so background removal is never accidental
- Remove the old tolerance UI from the toolbar entirely

## User Stories

- **As a user**, I want to understand what the scissors button does before it changes my image so that I don't accidentally remove the background.
- **As a user**, I want to adjust the removal strength with a simple slider so that I can control how aggressively the background is removed without needing to understand "tolerance" values.
- **As a user**, I want to preview the background removal result in real time so that I can find the right strength before applying the change.
- **As a user**, I want to cancel the operation if the preview doesn't look right so that my image is not modified unintentionally.

## Demoable Units of Work

### Unit 1: Background Removal Modal with Strength Slider

**Purpose:** Replace the inline tol input and immediate-action scissors button with a modal that opens on scissors click, containing a title, description, strength slider, and confirm/cancel buttons.

**Functional Requirements:**

- The system shall open a centered modal with a dark overlay backdrop when the user clicks the scissors toolbar button
- The modal shall display the title "Background Remover" and a short description: "Automatically removes the background color from your image"
- The modal shall contain a "Strength %" slider (range input) with values from 1 to 100, defaulting to 50
- The modal shall display a "Remove Background" button to confirm and an "✕" (close) button to cancel
- The modal shall close when the user clicks the overlay backdrop, the ✕ button, or presses Escape
- The system shall remove the old "tol" label and number input from the toolbar entirely
- The scissors button shall remain in the toolbar but only open the modal (not trigger removal directly)

**Proof Artifacts:**

- Screenshot: Modal open with title, description, slider at 50%, and confirm/cancel buttons demonstrates new UI
- Screenshot: Toolbar with scissors button but no "tol" input demonstrates old UI removal
- Test: BackgroundRemovalModal unit tests pass demonstrates modal open/close/interaction behavior

### Unit 2: Live Preview and Strength-to-Tolerance Mapping

**Purpose:** Give users real-time visual feedback as they adjust the strength slider, and map the 1–100 strength percentage to the internal 0–128 tolerance value used by the removal algorithm.

**Functional Requirements:**

- The system shall map the strength percentage (1–100) to the internal tolerance value (0–128) using a linear mapping: `tolerance = Math.round((strength / 100) * 128)`
- The system shall display a live preview of the background removal result inside the modal as the user adjusts the slider
- The live preview shall update when the slider value changes (debounced to avoid excessive computation)
- When the user clicks "Remove Background," the system shall apply the removal with the currently previewed strength to the canvas
- When the user cancels, the system shall discard the preview and leave the original image unchanged

**Proof Artifacts:**

- Screenshot: Modal showing live preview at different strength values (e.g., 25%, 50%, 75%) demonstrates real-time feedback
- Test: Strength-to-tolerance mapping function returns correct values (e.g., 50 → 64, 100 → 128, 1 → 1) demonstrates correct conversion
- Manual test: Adjusting slider updates preview visually, confirming applies the result, canceling preserves the original image

## Non-Goals (Out of Scope)

1. **Advanced background removal algorithms**: No changes to the underlying `removeBackground` utility — only the UI and value mapping change
2. **Undo within the modal**: Users can undo after applying via the existing undo/redo system, but the modal itself won't have undo
3. **Saving strength preference**: The strength resets to 50% each time the modal opens — persisting user preference is out of scope
4. **Touch/mobile-specific interactions**: Standard slider behavior is sufficient; no custom touch gestures

## Design Considerations

- The modal should follow the existing `SpeechBubbleModal` visual pattern: dark background (`#1e1e2e`), subtle border (`rgba(255,255,255,0.12)`), rounded corners, centered on screen with `rgba(0,0,0,0.5)` overlay
- The strength slider should be styled to match the app's dark theme (CSS variables: `--surface`, `--border`, `--accent`)
- The live preview should be displayed at a reasonable size within the modal (not full canvas size) — a thumbnail is sufficient
- The "Remove Background" confirm button should use the accent color to stand out
- The ✕ cancel button should be in the top-right corner of the modal

## Repository Standards

- Follow the existing modal pattern from `SpeechBubbleModal.tsx` (inline styles, click-outside-to-close, Escape key support, `e.stopPropagation()` on inner div)
- Props flow from `App.tsx` → component via callbacks (follow existing pattern for `onRemoveBackground`)
- Colocate tests with source files (`BackgroundRemovalModal.test.tsx` next to `BackgroundRemovalModal.tsx`)
- Use `task lint`, `task typecheck`, and `task test` to verify changes
- Follow existing CSS variable usage and dark theme conventions

## Technical Considerations

- The live preview requires running `removeBackground()` on each slider change — this should be debounced (e.g., 200–300ms) to avoid blocking the UI on large images
- The preview canvas should be a smaller resolution if the source image is large, to keep preview rendering fast
- The strength-to-tolerance mapping function should be a small pure utility, easy to unit test
- State management: `showBgRemovalModal` boolean in `App.tsx` (following `showSpeechBubbleModal` pattern), strength state local to the modal component

## Security Considerations

No specific security considerations identified. All processing is client-side on user-provided images.

## Success Metrics

1. **Clarity**: Users understand what the scissors button does without external documentation
2. **Control**: Users can adjust removal strength and see the result before committing
3. **No accidental removal**: Background is never removed without explicit confirmation
4. **Performance**: Live preview updates within 500ms of slider adjustment for typical emoji-sized images

## Open Questions

No open questions at this time.
