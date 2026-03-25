# 09 Tasks — Background Removal

## Relevant Files

- `src/utils/removeBackground.ts` — NEW: pure `removeBackground(imageData, tolerance)` utility implementing corner-sampling and BFS flood-fill.
- `src/utils/removeBackground.test.ts` — NEW: unit tests for `removeBackground` with synthetic `ImageData`.
- `src/components/Toolbar.tsx` — MODIFY: add `onRemoveBackground`, `bgTolerance`, and `onBgToleranceChange` props; add "Remove BG" button and tolerance number input.
- `src/components/Toolbar.test.tsx` — MODIFY: add test cases for the new button (enabled/disabled states, no active class, callback invocation) and tolerance input.
- `src/App.tsx` — MODIFY: add `bgTolerance` state, `bgRemovalRequest` state, `handleRemoveBackground` callback; wire new props to `Toolbar` and `EmojiCanvas`.
- `src/components/EmojiCanvas.tsx` — MODIFY: add `bgRemovalRequest` prop and a `useEffect` that reads the offscreen canvas, applies `removeBackground`, and pushes a history snapshot.

### Notes

- Unit tests are colocated with source files (e.g., `removeBackground.ts` and `removeBackground.test.ts` in the same directory).
- Use `task test` to run the full test suite, or `task test src/utils/removeBackground.test.ts` to run a single file (Vitest supports path filtering).
- Use `task lint`, `task typecheck`, and `task test` as quality gates before marking any task complete.
- Pre-commit hooks enforce linting and formatting — do not skip them with `--no-verify`.

## Tasks

### [x] 1.0 Implement `removeBackground` Utility and Unit Tests

#### 1.0 Proof Artifact(s)

- Test: `task test src/utils/removeBackground.test.ts` passes — all cases green, demonstrating the flood-fill algorithm correctly zeroes border-connected pixels and preserves interior pixels.

#### 1.0 Tasks

- [x] 1.1 Create `src/utils/removeBackground.ts` and export a function with the signature `export function removeBackground(imageData: ImageData, tolerance: number): ImageData`.
- [x] 1.2 Inside `removeBackground`, sample the four corner pixels at `(0,0)`, `(width-1,0)`, `(0,height-1)`, `(width-1,height-1)` and compute their average R, G, B values to get the background color. Ignore the alpha channel when averaging.
- [x] 1.3 Allocate a `Uint8Array` of size `width * height` as a visited map (all zeros). Seed a BFS queue with the pixel indices of the four corners.
- [x] 1.4 Run the BFS loop: for each pixel dequeued, check if its RGB Euclidean distance from the background color is `<= tolerance` using `Math.sqrt(dr*dr + dg*dg + db*db)`. If yes, mark alpha as 0 in the output data. Push unvisited 4-connected neighbors (up/down/left/right) that are also within tolerance onto the queue.
- [x] 1.5 Return a new `ImageData` constructed from the modified pixel data — do not mutate the input `imageData.data` array.
- [x] 1.6 Create `src/utils/removeBackground.test.ts`. Add a `makeImageData` helper (same pattern as `detectContentBounds.test.ts`) that accepts `width`, `height`, and a `fillFn(x, y) => [r, g, b, a]`.
- [x] 1.7 Add a test: create a 10×10 `ImageData` with all border pixels set to white `[255,255,255,255]` and a 6×6 red center `[255,0,0,255]`. Call `removeBackground(img, 10)` and assert every border pixel has `alpha === 0` and every center pixel has `alpha === 255`.
- [x] 1.8 Add a test: call `removeBackground` twice on the result of the first call (simulating repeated application) and assert the output has no border pixels with `alpha > 0`.
- [x] 1.9 Run `task test src/utils/removeBackground.test.ts` and confirm all tests pass.

---

### [x] 2.0 Add "Remove BG" Button and Tolerance Input to Toolbar

#### 2.0 Proof Artifact(s)

- Test: `task test src/components/Toolbar.test.tsx` passes — new cases confirm "Remove BG" button is present and enabled with an image, is disabled without an image, never receives `toolbar-btn--active`, and calls `onRemoveBackground` with the current tolerance on click.

#### 2.0 Tasks

- [x] 2.1 Add three new props to the `ToolbarProps` interface in `Toolbar.tsx`:
  - `onRemoveBackground: (tolerance: number) => void`
  - `bgTolerance: number`
  - `onBgToleranceChange: (t: number) => void`
- [x] 2.2 Destructure the three new props in the `Toolbar` function signature.
- [x] 2.3 In the `toolbar-tools` div (alongside the pointer/eraser/brush/text buttons), add a new button:
  - `aria-label="Remove BG"`, `title="Remove Background"`
  - `className="toolbar-btn"` (no active-state logic — this is not a toggle tool)
  - `disabled={!image}`
  - `onClick={() => onRemoveBackground(bgTolerance)}`
- [x] 2.4 Below the `toolbar-tools` div (and outside the existing `activeTool === "brush"` and `activeTool === "text"` blocks), add a `toolbar-bg-settings` div that is always visible when `image` is not null. Inside it, add a tolerance `<input type="number">` following the exact same structure as the existing brush-size input: a `<label>` with text `tol`, `id="bg-tolerance"`, `min={0}`, `max={128}`, `value={bgTolerance}`, and an `onChange` handler that parses the integer and calls `onBgToleranceChange` only if the value is in range.
- [x] 2.5 Update `defaultTextProps` in `Toolbar.test.tsx` to include the three new props: `onRemoveBackground: () => {}`, `bgTolerance: 15`, `onBgToleranceChange: () => {}`.
- [x] 2.6 Update the existing test `"renders all 5 buttons when image is provided"` — rename it to `"renders all tool buttons when image is provided"` and add an assertion that `screen.getByRole("button", { name: "Remove BG" })` is in the document.
- [x] 2.7 Add a new test: `"Remove BG button is disabled when image is null"` — render with `image={null}` and assert the "Remove BG" button is disabled.
- [x] 2.8 Add a new test: `"Remove BG button never has the active class"` — render with `image={mockImage}` and assert the button does not have class `toolbar-btn--active`.
- [x] 2.9 Add a new test: `"Remove BG button calls onRemoveBackground with current tolerance"` — render with `bgTolerance={30}` and a `vi.fn()` for `onRemoveBackground`, fire a click on the button, and assert the mock was called with `30`.
- [x] 2.10 Add a new test: `"tolerance input is visible when image is provided and updates on change"` — render with `image={mockImage}` and a `vi.fn()` for `onBgToleranceChange`, assert the input is in the document, fire a change with value `"20"`, and assert `onBgToleranceChange` was called with `20`.
- [x] 2.11 Run `task test src/components/Toolbar.test.tsx` and confirm all tests pass.

---

### [x] 3.0 Wire Background Removal Through App and EmojiCanvas

#### 3.0 Proof Artifact(s)

- Test: `task test` full suite passes with no regressions — demonstrates end-to-end wiring is correct and doesn't break existing canvas behavior.

#### 3.0 Tasks

- [x] 3.1 In `EmojiCanvas.tsx`, import `removeBackground` from `../utils/removeBackground`.
- [x] 3.2 Add `bgRemovalRequest?: { tolerance: number; seq: number } | null` to `EmojiCanvasProps` and destructure it in the function signature (default `null`).
- [x] 3.3 Add a `useEffect` in `EmojiCanvas.tsx` that depends on `[bgRemovalRequest]`. Inside the effect:
  - Guard: if `!bgRemovalRequest || !offscreenCanvasRef.current` return early.
  - Read the current canvas: `const src = offscreenCanvasRef.current`.
  - Get pixel data: `const ctx = src.getContext("2d"); const imageData = ctx.getImageData(0, 0, src.width, src.height)`.
  - Process: `const result = removeBackground(imageData, bgRemovalRequest.tolerance)`.
  - Create a new canvas of the same size, get its 2d context, and call `ctx.putImageData(result, 0, 0)`.
  - Call `setDisplayCanvas(newCanvas)` — this replaces the offscreen canvas and automatically pushes history via the existing `useEffect` that watches `displayCanvas`.
- [x] 3.4 In `App.tsx`, add `bgTolerance` state: `const [bgTolerance, setBgTolerance] = useState<number>(15)`.
- [x] 3.5 In `App.tsx`, add `bgRemovalRequest` state: `const [bgRemovalRequest, setBgRemovalRequest] = useState<{ tolerance: number; seq: number } | null>(null)`.
- [x] 3.6 In `App.tsx`, add a `handleRemoveBackground` callback:
  ```ts
  const handleRemoveBackground = useCallback((tolerance: number) => {
    setBgRemovalRequest((prev) => ({ tolerance, seq: (prev?.seq ?? 0) + 1 }));
  }, []);
  ```
- [x] 3.7 Pass the new props to `<Toolbar />` in `App.tsx`: `bgTolerance={bgTolerance}`, `onBgToleranceChange={setBgTolerance}`, `onRemoveBackground={handleRemoveBackground}`.
- [x] 3.8 Pass `bgRemovalRequest={bgRemovalRequest}` to `<EmojiCanvas />` in `App.tsx`.
- [x] 3.9 Run `task test` and confirm the full suite passes with no regressions.

---

### [ ] 4.0 Quality Gate Pass

#### 4.0 Proof Artifact(s)

- CLI: `task lint` exits 0 demonstrates no lint errors.
- CLI: `task typecheck` exits 0 demonstrates no TypeScript errors.
- CLI: `task test` exits 0 demonstrates full test suite is green.

#### 4.0 Tasks

- [ ] 4.1 Run `task lint`. Fix any ESLint errors or warnings before proceeding.
- [ ] 4.2 Run `task typecheck`. Fix any TypeScript type errors before proceeding.
- [ ] 4.3 Run `task test`. Confirm all tests pass and there are zero failures.
