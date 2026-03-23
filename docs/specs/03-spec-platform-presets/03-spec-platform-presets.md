# 03-spec-platform-presets.md

## Introduction/Overview

Platform Presets extends the existing single-preset `PlatformPreset` data model to cover all three target platforms: Slack, Discord, and Apple. It adds a `maxFileSizeKb` field to surface per-platform upload constraints, populates Discord (128×128) and Apple (512×512) preset entries, and adds a confirmation dialog when the user switches presets while an image is already loaded on the canvas. The canvas and imported image both resize to match the newly selected preset on confirmation.

## Goals

- Add Discord and Apple preset entries to `PLATFORM_PRESETS` with correct dimensions, safe-zone padding, and file-size limits.
- Extend the `PlatformPreset` interface with a `maxFileSizeKb` field so platform upload constraints are captured in the data model.
- Guard against accidental data loss by prompting the user for confirmation before switching presets when an image is loaded.
- Ensure switching to any preset correctly resizes the canvas and re-scales the loaded image to fit the new dimensions.
- Keep the `PresetSelector` UI unchanged (simple `<select>` dropdown); all new behaviour is data and logic only.

## User Stories

**As a user**, I want to select a Discord preset so that the canvas is sized correctly for Discord emoji upload without me having to look up the dimensions.

**As a user**, I want to select an Apple preset so that I can prepare a larger sticker-quality image for Apple iMessage.

**As a user**, I want to be warned before switching presets when I have already placed an image on the canvas so that I do not accidentally lose my work.

**As a user**, I want the canvas to resize and my image to re-scale automatically after I confirm a preset switch so that I can continue editing without re-importing the image.

## Demoable Units of Work

### Unit 1: Extended PlatformPreset Data Model

**Purpose:** Adds `maxFileSizeKb` to the `PlatformPreset` interface and populates all three platform entries (Slack, Discord, Apple) in the `PLATFORM_PRESETS` array. This is a pure data and type change with no UI impact.

**Functional Requirements:**

- The system shall extend the `PlatformPreset` interface with a `maxFileSizeKb: number` field representing the platform's maximum emoji/sticker upload size in kilobytes.
- The system shall define the following three preset entries in `PLATFORM_PRESETS`:
  - `slack` — 128×128 px, `safeZonePadding: 12`, `maxFileSizeKb: 128`, label `"Slack — 128×128"`
  - `discord` — 128×128 px, `safeZonePadding: 10`, `maxFileSizeKb: 256`, label `"Discord — 128×128"`
  - `apple` — 512×512 px, `safeZonePadding: 40`, `maxFileSizeKb: 500`, label `"Apple — 512×512"`
- The system shall ensure every `PlatformPreset` entry has all required fields defined (enforced by TypeScript's type checker — no optional fields).
- The `PresetSelector` dropdown shall automatically list all three presets without any additional code changes (it already maps over the `PLATFORM_PRESETS` array).

**Proof Artifacts:**

- Unit test: `presets.test.ts` passes, asserting that all three presets exist with correct `width`, `height`, `safeZonePadding`, and `maxFileSizeKb` values — demonstrates the data model is complete and correct.
- CLI: `task typecheck` exits with code 0 — demonstrates the TypeScript interface extension is valid and all preset objects satisfy the updated type.

---

### Unit 2: Preset Switch — Canvas Resize, Image Re-scale, and Confirmation Dialog

**Purpose:** Delivers the runtime behaviour when a user selects a different preset: canvas dimensions update, any loaded image re-scales to fit the new canvas, and a confirmation dialog protects against accidental loss of work when an image is already present.

**Functional Requirements:**

- The system shall resize the canvas element to the new preset's `width` and `height` when the user confirms a preset switch.
- The system shall re-scale the loaded image to fit within the new canvas dimensions using the existing `computeContainRect` logic (object-fit: contain, no cropping).
- The system shall redraw the checkerboard background and safe-zone guide at the new preset's dimensions after a confirmed switch.
- The system shall display a confirmation dialog (browser `window.confirm` or equivalent) before applying a preset switch when an image is currently loaded on the canvas.
- The system shall apply the preset switch immediately (without a dialog) when no image is loaded.
- The system shall leave the canvas unchanged if the user dismisses (cancels) the confirmation dialog.

**Proof Artifacts:**

- Playwright E2E test: test opens the app, confirms initial canvas is 128×128 (Slack), switches to Discord preset (no image loaded — no dialog), confirms canvas remains 128×128 — demonstrates same-size switch works silently.
- Playwright E2E test: test opens the app, switches to Apple preset (no image loaded), confirms canvas is 512×512 — demonstrates canvas resizes to a different preset.
- Unit test: `presets.test.ts` assertion that `discord` and `apple` presets are present — existing test coverage extended to new entries.

## Non-Goals (Out of Scope)

1. **`requiresTransparentBackground` flag**: Capturing whether a platform requires a transparent background is deferred to a later spec (likely Spec 07 Export, where it would drive export behavior).
2. **`contrastBoost` hint**: Visual contrast/outline suggestions are deferred to Spec 06 Visual Size Optimizer.
3. **`description` tooltip in UI**: Displaying per-preset descriptions in the dropdown is deferred; the `PresetSelector` UI remains a plain `<select>` in this spec.
4. **Additional platforms beyond Slack, Discord, Apple**: No other platforms (e.g. Twitch, Teams) are in scope for this spec.
5. **Custom/user-defined presets**: Users cannot create their own presets; only the three built-in entries are supported.
6. **Export enforcement of `maxFileSizeKb`**: The file-size field is stored on the preset but the Export feature (Spec 07) is responsible for enforcing it at download time.

## Design Considerations

No visual changes to the `PresetSelector` component are required; it remains a plain `<select>` dropdown. The confirmation dialog uses the browser-native `window.confirm` for simplicity — no custom modal component needed in this spec. The dialog text should clearly state that switching will resize the canvas (e.g., "Switching to Apple (512×512) will resize the canvas. Your image will be re-scaled to fit. Continue?").

## Repository Standards

- **Language & framework**: TypeScript (strict mode) + React 19 functional components with hooks.
- **Formatting**: Prettier config — double quotes, semicolons, 2-space indent, trailing commas, 80-char line width.
- **Linting**: ESLint with `max-warnings=0`; no unused variables or parameters.
- **Unit tests**: Vitest + `@testing-library/react`; test files co-located alongside source files (`*.test.ts` / `*.test.tsx`).
- **E2E tests**: Playwright in `e2e/` directory; Chromium only.
- **Pre-commit hooks**: Husky runs lint-staged — ESLint then Prettier on `.ts`/`.tsx` files; Prettier only on `.json`, `.css`, `.md`.
- **Task runner**: Use `Taskfile.yml` commands (`task lint`, `task test`, `task typecheck`) to verify work.
- **File organisation**: Preset data lives in `src/utils/presets.ts`; canvas interaction logic lives in `src/components/EmojiCanvas.tsx`.

## Technical Considerations

- The `maxFileSizeKb` field is added directly to the `PlatformPreset` interface in `src/utils/presets.ts`; it is a required (non-optional) field so TypeScript will catch any incomplete preset entries at compile time.
- The confirmation dialog logic lives in the `onChange` handler wired to `PresetSelector`, most likely inside `App.tsx` or wherever `activePresetId` state is managed. It should check whether an image is currently loaded before calling `window.confirm`.
- The `EmojiCanvas` component already re-draws the canvas whenever `preset` or `image` props change (via a `useEffect` dependency array). No changes to the drawing pipeline are needed; only the preset-switch gate (confirmation dialog) is new.
- No new utility functions are expected to be needed; `computeContainRect` already handles image re-scaling for any canvas size.

## Security Considerations

No specific security considerations identified. No API keys, tokens, or external data are involved. All processing remains client-side.

## Success Metrics

1. **All three presets present**: `presets.test.ts` passes with assertions on `slack`, `discord`, and `apple` entries — all fields correct.
2. **TypeScript clean**: `task typecheck` exits 0 with no errors after the interface extension.
3. **Canvas resizes correctly**: Playwright E2E test confirms canvas is 512×512 after switching to the Apple preset.
4. **Confirmation dialog fires**: Playwright E2E test confirms a confirmation dialog appears when switching presets with a loaded image.
5. **Zero lint/type errors**: `task lint` passes with `max-warnings=0`.

## Open Questions

1. **Discord `safeZonePadding`**: Discord does not formally document a safe-zone margin for custom emojis. The 10 px value is a reasonable default matching Slack's proportional padding — confirm or adjust as needed.
