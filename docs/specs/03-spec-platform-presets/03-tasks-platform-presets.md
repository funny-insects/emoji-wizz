# 03 Tasks — Platform Presets

## Relevant Files

- `src/utils/presets.ts` — Add `maxFileSizeKb` field to `PlatformPreset` interface; add Discord and Apple preset entries.
- `src/utils/presets.test.ts` — Extend unit tests to assert all three presets and the new `maxFileSizeKb` field.
- `src/App.tsx` — Move `useImageImport` call here from `EmojiCanvas`; update `handlePresetChange` to check for a loaded image and show a confirmation dialog before switching.
- `src/App.test.tsx` — No changes expected, but verify existing tests still pass after the refactor.
- `src/components/EmojiCanvas.tsx` — Remove internal `useImageImport` call; extend `EmojiCanvasProps` to accept `image`, `handleFileInput`, `handleDrop`, and `handlePaste` as props.
- `src/components/EmojiCanvas.test.tsx` — Update the existing render test to pass the new required props (`image: null`, no-op handlers).
- `src/hooks/useImageImport.ts` — No changes; hook is moved up the component tree but its implementation is unchanged.
- `e2e/canvas.spec.ts` — Add two new E2E tests: silent preset switch (no image) and guarded preset switch (image loaded, confirm dialog).

### Notes

- Unit tests are co-located with source files (e.g., `presets.test.ts` lives next to `presets.ts`).
- Run `task test` for unit tests, `task typecheck` for TypeScript, `task lint` for ESLint.
- E2E tests live in `e2e/` and run with `task e2e` (Chromium only via Playwright).
- Use `page.on('dialog', handler)` in Playwright to intercept and accept/dismiss `window.confirm` dialogs.
- Pre-commit hooks run lint-staged automatically; ensure `task lint` and `task typecheck` pass before committing.

## Tasks

### [x] 1.0 Extend PlatformPreset Data Model

Add `maxFileSizeKb` to the `PlatformPreset` interface and populate all three platform entries. Update unit tests to cover the new field and the two new presets.

#### 1.0 Proof Artifact(s)

- CLI: `task test` passes with `presets.test.ts` asserting `discord` (128×128, `safeZonePadding: 10`, `maxFileSizeKb: 256`) and `apple` (512×512, `safeZonePadding: 40`, `maxFileSizeKb: 500`) entries exist and are correct — demonstrates data model is complete.
- CLI: `task typecheck` exits 0 — demonstrates the interface extension is valid and all preset objects satisfy the updated TypeScript type.
- CLI: `task lint` exits 0 with `max-warnings=0` — demonstrates no regressions introduced.

#### 1.0 Tasks

- [x] 1.1 In `src/utils/presets.ts`, add `maxFileSizeKb: number` as a required field to the `PlatformPreset` interface (after `safeZonePadding`).
- [x] 1.2 Add `maxFileSizeKb: 128` to the existing `slack` preset entry.
- [x] 1.3 Add a new `discord` preset entry: `id: "discord"`, `label: "Discord — 128×128"`, `width: 128`, `height: 128`, `safeZonePadding: 10`, `maxFileSizeKb: 256`.
- [x] 1.4 Add a new `apple` preset entry: `id: "apple"`, `label: "Apple — 512×512"`, `width: 512`, `height: 512`, `safeZonePadding: 40`, `maxFileSizeKb: 500`.
- [x] 1.5 In `src/utils/presets.test.ts`, add a test asserting the `slack` preset now includes `maxFileSizeKb: 128`.
- [x] 1.6 Add a test asserting the `discord` preset exists with correct `width`, `height`, `safeZonePadding`, and `maxFileSizeKb` values.
- [x] 1.7 Add a test asserting the `apple` preset exists with correct `width`, `height`, `safeZonePadding`, and `maxFileSizeKb` values.
- [x] 1.8 Update the existing `"every entry has all required fields defined"` test to include `maxFileSizeKb` in the `requiredFields` array.
- [x] 1.9 Run `task test`, `task typecheck`, and `task lint` — fix any errors before moving on.

---

### [ ] 2.0 Preset Switch — Confirmation Dialog, Canvas Resize, and Image Re-scale

Lift image state from `EmojiCanvas` to `App.tsx`, then add a `window.confirm` guard in the preset-change handler. Update `EmojiCanvas` to receive image state as props instead of managing it internally.

#### 2.0 Proof Artifact(s)

- E2E test (`canvas.spec.ts`): switching to the Apple preset with no image loaded resizes the canvas to `width="512"` and `height="512"` without triggering any dialog — demonstrates silent switch on empty canvas.
- E2E test (`canvas.spec.ts`): uploading an image then switching preset triggers a `window.confirm` dialog; accepting it resizes the canvas and changes pixel data — demonstrates confirmation guard and image re-scale work end-to-end.
- CLI: `task test` passes — demonstrates no unit test regressions from the state lift refactor.
- CLI: `task lint` and `task typecheck` exit 0 — demonstrates no type errors or lint warnings.

#### 2.0 Tasks

- [ ] 2.1 In `src/components/EmojiCanvas.tsx`, extend `EmojiCanvasProps` to add four new props: `image: HTMLImageElement | null`, `handleFileInput: React.ChangeEventHandler<HTMLInputElement>`, `handleDrop: React.DragEventHandler<HTMLDivElement>`, and `handlePaste: (e: ClipboardEvent) => void`.
- [ ] 2.2 Remove the `useImageImport()` call from inside `EmojiCanvas` — delete the line and its import. The component will now receive these values from props instead.
- [ ] 2.3 In `src/App.tsx`, add `import { useImageImport } from "./hooks/useImageImport";` and call `const { image, handleFileInput, handleDrop, handlePaste } = useImageImport();` inside the `App` component.
- [ ] 2.4 In `src/App.tsx`, update the `<EmojiCanvas>` JSX to pass down the four new props: `image={image}`, `handleFileInput={handleFileInput}`, `handleDrop={handleDrop}`, `handlePaste={handlePaste}`.
- [ ] 2.5 In `src/App.tsx`, update `handlePresetChange` to check `if (image)` before switching — if an image is loaded, call `window.confirm("Switching to [preset label] will resize the canvas. Your image will be re-scaled to fit. Continue?")` and only call `setActivePreset` if the user clicks OK.
- [ ] 2.6 In `src/components/EmojiCanvas.test.tsx`, update the existing render test to pass the new required props: `image={null}` and no-op handlers (`handleFileInput={() => {}}`, `handleDrop={() => {}}`, `handlePaste={() => {}}`).
- [ ] 2.7 In `e2e/canvas.spec.ts`, add a test: navigate to `/`, select the `"Apple — 512×512"` option in the dropdown (no image loaded), assert the canvas `width` attribute is `"512"` and `height` is `"512"` — no dialog should appear.
- [ ] 2.8 In `e2e/canvas.spec.ts`, add a test: navigate to `/`, upload the fixture image via the file input, then set up a dialog handler with `page.on('dialog', dialog => dialog.accept())`, select a different preset in the dropdown, and assert the canvas resizes to the new dimensions — demonstrates the confirmation guard fires and the canvas updates on acceptance.
- [ ] 2.9 Run `task test`, `task e2e`, `task typecheck`, and `task lint` — fix any errors before marking this task complete.
