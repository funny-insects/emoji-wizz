# 07-spec-export

## Introduction/Overview

The Export feature allows users to download their composed emoji from the canvas as a platform-ready image file. It solves the final step in the emoji creation workflow: producing a correctly sized, transparent-background image in a format accepted by Slack, Discord, or Apple. Users choose a file format (PNG, GIF, or WebP), get warned if the file exceeds their platform's size limit, and download a clean image ready for upload.

## Goals

- Allow users to download the emoji canvas content as PNG, GIF, or WebP.
- Export a clean image (transparent background, no canvas guides or checkerboard) at the preset's exact pixel dimensions.
- Warn users when the exported file exceeds the active preset's `maxFileSizeKb` limit, while still allowing the download.
- Disable the download control when no image has been loaded.
- Generate a timestamp-based filename so downloads don't overwrite each other.

## User Stories

**As a Slack workspace admin**, I want to export my emoji as a PNG with a transparent background so that it looks correct when uploaded to Slack.

**As a user creating a Discord emoji**, I want to be warned if my exported file is too large for Discord's limit so that I can take action before uploading.

**As a user**, I want to choose my export format from a dropdown so that I can pick the right format for my target platform without having to convert the file separately.

**As a user**, I want the Download button to be disabled when I haven't loaded an image so that I don't trigger a broken export by accident.

## Demoable Units of Work

### Unit 1: Format Selection UI & Download Button

**Purpose:** Give the user a visible, functional export control below the canvas. Demonstrates the complete UI surface for the export feature — format dropdown, download button, and disabled state.

**Functional Requirements:**

- The system shall render a format selector (`<select>`) below the canvas with options: PNG, GIF, WebP (defaulting to PNG).
- The system shall render a "Download" button adjacent to the format selector.
- The system shall disable the Download button when no image is loaded in the canvas.
- The system shall enable the Download button when an image is loaded.
- The user shall be able to change the selected format at any time before downloading.

**Proof Artifacts:**

- Screenshot: App with no image loaded shows Download button in a disabled state below the canvas.
- Screenshot: App with an image loaded shows Download button enabled with format dropdown visible.
- Unit test: `ExportControls.test.tsx` — button is disabled when `image` prop is null, enabled otherwise.

---

### Unit 2: Clean Image Export & Download

**Purpose:** Produce and trigger a browser download of a clean emoji image — transparent background, correct dimensions, no canvas decorations — in the selected format.

**Functional Requirements:**

- The system shall export the image at the exact pixel dimensions of the active preset (e.g., 128×128 for Slack).
- The system shall render only the emoji image onto a transparent background for export (no checkerboard, no safe-zone guide lines).
- The system shall encode the image in the user-selected format: `image/png`, `image/gif`, or `image/webp`.
- The system shall trigger a browser file download when the user clicks "Download".
- The system shall name the downloaded file using the pattern `emoji-YYYY-MM-DD.<ext>` where the date is today's date and `<ext>` matches the selected format (e.g., `emoji-2026-03-23.png`).

**Proof Artifacts:**

- E2E test: Upload a test image, click Download PNG → browser download is triggered with filename matching `emoji-YYYY-MM-DD.png`.
- Unit test: `exportUtils.test.ts` — `buildExportCanvas()` returns a canvas with transparent pixels where the checkerboard would be, and image pixels where the emoji is.
- Unit test: `exportUtils.test.ts` — `buildFilename('png')` returns a string matching `emoji-\d{4}-\d{2}-\d{2}\.png`.

---

### Unit 3: File Size Warning

**Purpose:** Surface a non-blocking warning when the exported file exceeds the active preset's `maxFileSizeKb` limit, so the user knows before they upload to their target platform.

**Functional Requirements:**

- The system shall compute the byte size of the exported image blob after encoding.
- The system shall compare the blob size against the active preset's `maxFileSizeKb` value.
- The system shall display a visible warning message (e.g., "Warning: file is 154 KB, exceeds Slack's 128 KB limit") when the limit is exceeded.
- The system shall still proceed with and complete the download even when the limit is exceeded.
- The system shall not show any warning when the file size is within the preset limit.

**Proof Artifacts:**

- Unit test: `exportUtils.test.ts` — `checkFileSizeWarning(blob, preset)` returns a warning string when blob exceeds `maxFileSizeKb`, returns null when within limit.
- E2E test: Upload a large test image, export as PNG → warning message is visible in the UI and download still completes.

## Non-Goals (Out of Scope)

1. **Image editing before export**: Cropping, resizing the source image, or applying filters are handled by future specs (Lightweight Editor, Visual Size Optimizer).
2. **Blocking download on size exceeded**: The size check is advisory only; the download always proceeds.
3. **Animated GIF creation**: GIF export uses `canvas.toBlob('image/gif')` which produces a static GIF. Multi-frame animation is not in scope.
4. **Upload directly to Slack/Discord**: The export produces a local file download only; platform API integration is out of scope.
5. **Custom filename input**: The filename is auto-generated; the user cannot set a custom name in this spec.
6. **Image compression controls**: No quality sliders or compression settings for this spec.

## Design Considerations

Export controls appear below the canvas in a single row:

```
[ PNG ▾ ]  [ Download ]
```

- The format selector is a standard HTML `<select>` element.
- The Download button matches the existing button style in the app.
- When the file size warning is triggered, it appears as a text message directly below the export controls, styled distinctly (e.g., amber/warning color) but not as a blocking modal.
- The Download button uses a disabled visual state (greyed out, `cursor: not-allowed`) when no image is loaded.

No design mockups exist; follow the app's existing minimal styling approach.

## Repository Standards

- **File organization**: New component `src/components/ExportControls.tsx` with co-located test `src/components/ExportControls.test.tsx`. New utility module `src/utils/exportUtils.ts` with co-located test `src/utils/exportUtils.test.ts`.
- **Testing**: Unit tests use Vitest + React Testing Library (co-located `*.test.ts` / `*.test.tsx`). E2E tests in `e2e/` using Playwright. Canvas-dependent logic mocked with `vi.fn()` in unit tests.
- **TypeScript**: Strict mode; no `any` types. All new functions and props must be typed.
- **Component pattern**: `ExportControls` receives `image: HTMLImageElement | null` and `preset: PlatformPreset` as props (following the existing pattern of lifting state to `App.tsx` and passing down).
- **Commit conventions**: Follow existing repo commit style (imperative mood, concise subject line).
- **Pre-commit**: All tasks (`lint`, `typecheck`, `test`) must pass before commit — enforced by Husky.

## Technical Considerations

- **Export canvas**: Create an offscreen `HTMLCanvasElement` at the preset's exact dimensions, clear it to fully transparent, then draw only the emoji image using the same `computeContainRect` logic already in `imageScaling.ts`. Do not draw checkerboard or safe-zone guide.
- **Format encoding**: Use `canvas.toBlob(callback, mimeType)` for PNG and WebP. For GIF, `canvas.toBlob` with `'image/gif'` may not be supported in all browsers; a fallback to PNG may be needed or a lightweight GIF library considered.
- **Download trigger**: Create a temporary `<a>` element with `href = URL.createObjectURL(blob)` and `download = filename`, programmatically click it, then revoke the object URL.
- **File size check**: Compare `blob.size` (bytes) against `preset.maxFileSizeKb * 1024`.
- **Date for filename**: Use `new Date().toISOString().slice(0, 10)` for `YYYY-MM-DD`.
- **GIF browser support**: `image/gif` is not a guaranteed `toBlob` MIME type. Investigate browser support; if unsupported, the spec should either drop GIF from the initial implementation or use a small library (e.g., `gif.js`). This is flagged as an open question.

## Security Considerations

- All export processing happens client-side in the browser; no image data is sent to any server.
- The download URL is a short-lived `blob:` URL created and immediately revoked after the download is triggered — no persistent storage of user image data.
- No API keys or credentials are involved in this feature.

## Success Metrics

1. **Format coverage**: All three formats (PNG, GIF, WebP) are downloadable from the UI.
2. **Export fidelity**: Downloaded PNG has a transparent background and matches the preset's pixel dimensions exactly.
3. **Size warning accuracy**: Warning appears when and only when the exported blob exceeds `preset.maxFileSizeKb`.
4. **Disabled state correctness**: Download button is disabled with no image loaded and enabled once an image is present.
5. **Test coverage**: All new utility functions have unit tests; download flow has at least one passing E2E test.

## Open Questions

1. **GIF support via `canvas.toBlob`**: Does Chromium (the E2E test browser) support `image/gif` in `toBlob`? If not, should GIF be deferred or handled with a library?
2. **Q4 assumption**: Canvas export content was not explicitly answered in the questions round — this spec assumes transparent background (image only, no checkerboard/safe-zone). Please confirm or correct.
