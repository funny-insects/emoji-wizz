# 13 Tasks - Background Removal UI Rework

## Relevant Files

- `src/components/BackgroundRemovalModal.tsx` - New modal component with title, description, strength slider, preview, and confirm/cancel buttons
- `src/components/BackgroundRemovalModal.test.tsx` - Unit tests for the new modal component
- `src/components/Toolbar.tsx` - Remove old "tol" input, change scissors button to open modal via callback
- `src/components/Toolbar.test.tsx` - Update existing tests to reflect removed tolerance UI and new callback
- `src/App.tsx` - Add `showBgRemovalModal` state, wire modal open/close/confirm, pass image data to modal
- `src/utils/removeBackground.ts` - Existing background removal utility (unchanged, but consumed by the modal for live preview)
- `src/utils/strengthToTolerance.ts` - New pure utility function mapping strength % (1–100) to tolerance (0–128)
- `src/utils/strengthToTolerance.test.ts` - Unit tests for the mapping function
- `src/components/SpeechBubbleModal.tsx` - Reference implementation for modal pattern (not modified)

### Notes

- Unit tests should be placed alongside the code files they are testing (e.g., `BackgroundRemovalModal.tsx` and `BackgroundRemovalModal.test.tsx` in the same directory).
- Use `task test` to run Vitest unit tests, `task lint` for ESLint, `task typecheck` for TypeScript checking.
- Follow the existing inline-styles modal pattern from `SpeechBubbleModal.tsx` (dark theme, click-outside-to-close, Escape key).
- Follow the existing props-flow pattern from `App.tsx` → child components via callbacks.

## Tasks

### [x] 1.0 Create BackgroundRemovalModal component with strength slider and confirm/cancel

Build the new `BackgroundRemovalModal` component following the `SpeechBubbleModal` pattern. It displays a title ("Background Remover"), a description, a strength % slider (1–100, default 50), a "Remove Background" confirm button, and an ✕ close button. The modal opens centered with a dark overlay and closes on backdrop click, ✕, or Escape.

#### 1.0 Proof Artifact(s)

- Screenshot: Modal open showing title "Background Remover", description text, slider at 50%, "Remove Background" button, and ✕ close button demonstrates new UI layout
- Test: `BackgroundRemovalModal.test.tsx` passes — verifies rendering, slider interaction, confirm/cancel callbacks, Escape key, and backdrop click-to-close

#### 1.0 Tasks

- [x] 1.1 Create `src/components/BackgroundRemovalModal.tsx` with the following props interface: `onConfirm: (strength: number) => void`, `onCancel: () => void`, and `imageData: ImageData | null` (for later use in task 3.0). Use local `useState` for strength (default 50).
- [x] 1.2 Implement the modal overlay layout: fixed position, `inset: 0`, `rgba(0,0,0,0.5)` backdrop, centered flex container, `zIndex: 100`. Inner box uses `#1e1e2e` background, `rgba(255,255,255,0.12)` border, `borderRadius: 10`, padding `20px 24px`. Follow `SpeechBubbleModal` exactly.
- [x] 1.3 Add the title ("Background Remover", white, 14px, fontWeight 600) and description ("Automatically removes the background color from your image", `rgba(255,255,255,0.6)`, 13px) as `<p>` elements at the top of the modal.
- [x] 1.4 Add a range input (slider) for strength: `min={1}`, `max={100}`, `value={strength}`, with a label showing the current value (e.g., "Strength: 50%"). Style the slider to be full-width within the modal using accent color (`#fe81d4`).
- [x] 1.5 Add the button row: ✕ close button (top-right corner of modal, `position: absolute`) and "Remove Background" confirm button (accent background `#fe81d4`, white text, bottom of modal). Backdrop click calls `onCancel`, inner div stops propagation.
- [x] 1.6 Add Escape key handler via `useEffect` + `document.addEventListener("keydown", ...)` that calls `onCancel`, following the `SpeechBubbleModal` pattern.
- [x] 1.7 Write `src/components/BackgroundRemovalModal.test.tsx`: test that the modal renders title, description, slider at default 50; test that changing the slider updates displayed value; test that clicking "Remove Background" calls `onConfirm` with current strength; test that clicking ✕ calls `onCancel`; test that clicking the backdrop calls `onCancel`; test that pressing Escape calls `onCancel`.

### [x] 2.0 Integrate modal into App and rewire Toolbar scissors button

Wire the new modal into `App.tsx` with `showBgRemovalModal` state. The scissors button in `Toolbar` now opens the modal instead of triggering removal directly. Remove the old "tol" label and number input from `Toolbar`. Remove `bgTolerance`/`onBgToleranceChange` props from `Toolbar`. Update existing Toolbar tests to reflect the removed tolerance UI.

#### 2.0 Proof Artifact(s)

- Screenshot: Toolbar showing scissors button but no "tol" input demonstrates old UI removal
- Test: Updated `Toolbar.test.tsx` passes — scissors button calls the new `onOpenBgRemoval` callback, tolerance input tests removed/updated
- Test: `App.tsx` integration — clicking scissors opens modal, confirming triggers background removal, canceling closes modal

#### 2.0 Tasks

- [x] 2.1 In `Toolbar.tsx`, replace the `onRemoveBackground`, `bgTolerance`, and `onBgToleranceChange` props with a single `onOpenBgRemoval: () => void` prop. Update the `ToolbarProps` interface accordingly.
- [x] 2.2 In `Toolbar.tsx`, change the scissors button `onClick` from `() => onRemoveBackground(bgTolerance)` to `onOpenBgRemoval`. Remove the entire `<div className="toolbar-bg-settings">` block (lines 104–120 containing the "tol" label and number input).
- [x] 2.3 In `App.tsx`, add `showBgRemovalModal` boolean state (default `false`). Create `handleOpenBgRemoval` callback that sets it to `true`. Create `handleBgRemovalConfirm(strength: number)` callback that maps strength to tolerance via `strengthToTolerance`, calls the existing `setBgRemovalRequest` logic, and sets `showBgRemovalModal` to `false`. Create `handleBgRemovalCancel` that sets `showBgRemovalModal` to `false`.
- [x] 2.4 In `App.tsx`, replace the `bgTolerance`, `onBgToleranceChange`, and `onRemoveBackground` Toolbar props with `onOpenBgRemoval={handleOpenBgRemoval}`. Remove the `bgTolerance` state and `setBgTolerance`.
- [x] 2.5 In `App.tsx`, render `<BackgroundRemovalModal>` conditionally when `showBgRemovalModal` is true (following the `SpeechBubbleModal` pattern at the bottom of the JSX). Pass `onConfirm={handleBgRemovalConfirm}`, `onCancel={handleBgRemovalCancel}`, and `imageData={null}` (placeholder until task 3.0).
- [x] 2.6 Update `Toolbar.test.tsx`: remove the test "tolerance input is visible when image is provided and updates on change". Update the test "Remove BG button calls onRemoveBackground with current tolerance" to instead verify it calls `onOpenBgRemoval`. Remove `bgTolerance` and `onBgToleranceChange` from `defaultTextProps`, add `onOpenBgRemoval: () => {}`.
- [x] 2.7 Run `task test` and `task typecheck` to verify no regressions.

### [ ] 3.0 Add live preview with debounced background removal inside the modal

Display a live preview thumbnail inside the modal that updates as the user adjusts the strength slider. Implement the strength-to-tolerance mapping (`tolerance = Math.round((strength / 100) * 128)`). Debounce the preview computation (200–300ms). On confirm, apply the previewed result to the canvas. On cancel, discard.

#### 3.0 Proof Artifact(s)

- Screenshot: Modal showing live preview at different strength values (e.g., 25%, 75%) demonstrates real-time feedback
- Test: `strengthToTolerance` utility returns correct values (1→1, 50→64, 100→128)
- Manual test: Adjusting slider updates preview, confirming applies result to canvas, canceling preserves original image

#### 3.0 Tasks

- [ ] 3.1 Create `src/utils/strengthToTolerance.ts` exporting a pure function: `export function strengthToTolerance(strength: number): number { return Math.round((strength / 100) * 128); }`.
- [ ] 3.2 Create `src/utils/strengthToTolerance.test.ts` testing edge cases: `strengthToTolerance(1)` → 1, `strengthToTolerance(50)` → 64, `strengthToTolerance(100)` → 128, `strengthToTolerance(25)` → 32.
- [ ] 3.3 In `App.tsx`, obtain the current `ImageData` from the offscreen canvas to pass to the modal. Add a helper that reads `offscreenCanvasRef.current` and calls `ctx.getImageData(...)` to produce the `ImageData` when the modal opens. Pass this as the `imageData` prop to `BackgroundRemovalModal`.
- [ ] 3.4 In `BackgroundRemovalModal.tsx`, add a `<canvas>` element for the preview thumbnail. Set its size to a reasonable preview dimension (e.g., max 200px wide, maintaining aspect ratio from the source `imageData`).
- [ ] 3.5 Add a debounced `useEffect` in `BackgroundRemovalModal` that runs `removeBackground(imageData, strengthToTolerance(strength))` whenever `strength` changes, with a 250ms debounce via `setTimeout`/`clearTimeout`. Draw the result onto the preview canvas using `putImageData` (or draw scaled if source is larger than preview).
- [ ] 3.6 Display the preview canvas inside the modal between the slider and the confirm button. Show a "Processing..." or subtle loading indicator while the debounce is pending (optional, but recommended for UX).
- [ ] 3.7 Update `App.tsx` `handleBgRemovalConfirm` to use `strengthToTolerance(strength)` when creating the `bgRemovalRequest`, replacing the old direct tolerance value.
- [ ] 3.8 Run `task test` and `task typecheck` to verify no regressions.

### [ ] 4.0 Clean up unused code and verify all checks pass

Remove any remaining dead code related to the old tolerance flow (unused state, props, types). Run `task lint`, `task typecheck`, and `task test` to verify everything passes. Ensure no regressions in existing functionality.

#### 4.0 Proof Artifact(s)

- CLI: `task lint` passes with no errors
- CLI: `task typecheck` passes with no errors
- CLI: `task test` passes with no failures

#### 4.0 Tasks

- [ ] 4.1 Search for any remaining references to `bgTolerance`, `onBgToleranceChange`, `toolbar-bg-settings`, or the old tolerance range (0–128) in the codebase. Remove any dead code found.
- [ ] 4.2 Verify the `EmojiCanvas` component's `bgRemovalRequest` handling still works correctly with the new flow (tolerance value now comes from `strengthToTolerance` via `App.tsx`).
- [ ] 4.3 Run `task lint` and fix any lint errors.
- [ ] 4.4 Run `task typecheck` and fix any type errors.
- [ ] 4.5 Run `task test` and fix any test failures.
- [ ] 4.6 Run `task format:check` and fix any formatting issues with `task format`.
