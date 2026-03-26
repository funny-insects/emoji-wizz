# 15 Tasks - Frame Controls

## Relevant Files

- `src/App.tsx` — Main app state; owns `activeFrameId`, will own new `frameThickness` state; contains `handleToggleFrame`, `handleUndo`, `handleRedo`, and all `stickerHistory.pushState()` call sites.
- `src/components/EmojiCanvas.tsx` — Konva canvas; owns the frame `<Layer>` + `<KonvaImage>` that will be scaled based on `frameThickness`.
- `src/components/DecoratePanel.tsx` — Frames tab UI; will receive slider and remove button.
- `src/components/DecoratePanel.css` — Styles for the panel; slider and × button styling goes here.
- `src/components/DecoratePanel.test.tsx` — Existing unit tests for `DecoratePanel`; must be updated for new props and new assertions added.
- `src/hooks/useStickerHistory.ts` — Undo/redo history hook; snapshot type needs to be extended to include `activeFrameId` and `frameThickness` so undo restores frame state.

### Notes

- Unit tests are colocated with source files (e.g. `DecoratePanel.test.tsx` lives next to `DecoratePanel.tsx`).
- Run tests with `task test`, lint with `task lint`, type checking with `task typecheck`.
- Pre-commit hooks enforce linting and formatting automatically — do not skip them.
- Follow existing code patterns: `useCallback` for handlers in `App.tsx`, optional props with defaults in component interfaces.

---

## Tasks

### [x] 1.0 Add frameThickness state and canvas rendering

**Purpose:** Establish `frameThickness` in App state and wire it to `EmojiCanvas` so the Konva frame layer visually scales with its outer edge anchored to the canvas boundary.

#### 1.0 Proof Artifact(s)

- Dev server: With `frameThickness` hardcoded to `50` in `App.tsx` (temporarily), the frame visibly covers only ~half the original width while its outer corners stay flush with the canvas edge — demonstrates the scaling math is correct.
- Dev server: Removing the hardcoded value and applying a frame shows it at 50% thickness by default — demonstrates the reset-on-apply logic works.

#### 1.0 Tasks

- [x] 1.1 In `App.tsx`, add a new state variable: `const [frameThickness, setFrameThickness] = useState<number>(50);` — place it directly below the `activeFrameId` state declaration on line 85.
- [x] 1.2 In `App.tsx`, update `handleToggleFrame` so that when a **new** frame is applied (i.e. the incoming `id` is different from the current `activeFrameId`), it also calls `setFrameThickness(50)` to reset to the default. When toggling off (same `id`), no thickness reset is needed. The existing toggle logic (`setActiveFrameId((prev) => (prev === id ? null : id))`) should stay intact.
- [x] 1.3 In `EmojiCanvas.tsx`, add `frameThickness?: number` to the `EmojiCanvasProps` interface (after `activeFrameSrc`). Set its default value to `100` in the function parameter destructuring: `frameThickness = 100`.
- [x] 1.4 In `EmojiCanvas.tsx`, in the frame `<Layer>` block (around line 866), replace the hardcoded `x={0} y={0} width={width} height={height}` props on `<KonvaImage>` with computed values. Use this scaling approach to keep the outer edge anchored at the canvas boundary while making the frame thinner:
  ```ts
  const frameScale = 100 / frameThickness;
  const frameW = width * frameScale;
  const frameH = height * frameScale;
  const frameX = -(frameW - width) / 2;
  const frameY = -(frameH - height) / 2;
  ```
  Then pass `x={frameX} y={frameY} width={frameW} height={frameH}` to `<KonvaImage>`. The Konva stage is a bounded canvas, so the overflow is automatically clipped — you do not need an explicit clip.
- [x] 1.5 In `App.tsx`, pass the new prop to `<EmojiCanvas>`: add `frameThickness={frameThickness}` to the `EmojiCanvas` JSX element (around line 448).

---

### [x] 2.0 Add thickness slider UI in DecoratePanel

**Purpose:** Surface the thickness control as a compact range slider that appears inline below the active frame thumbnail in the Frames tab, updating the canvas in real time as the user drags.

#### 2.0 Proof Artifact(s)

- Screenshot: Frames tab with an active frame shows a slider (labelled "Size") below the selected thumbnail; switching to a different frame or having no frame hides the slider — demonstrates correct conditional rendering.
- Screen recording: Dragging the slider left and right causes the frame border on the canvas to shrink and grow in real time — demonstrates end-to-end data flow from slider to canvas.

#### 2.0 Tasks

- [x] 2.1 In `DecoratePanel.tsx`, add two new props to the `DecoratePanelProps` interface:
  ```ts
  frameThickness: number;
  onFrameThicknessChange: (value: number) => void;
  ```
- [x] 2.2 In `DecoratePanel.tsx`, destructure the new props in the function signature: `{ ..., frameThickness, onFrameThicknessChange }`.
- [x] 2.3 In the Frames tab JSX (inside `{activeTab === "frames" && ...}`), after the `frames.map(...)` grid, add a conditional block that renders only when `activeFrameId !== null`:
  ```tsx
  {
    activeFrameId !== null && (
      <div className="decorate-panel__frame-controls">
        <label className="decorate-panel__frame-label">
          Size
          <input
            type="range"
            min={10}
            max={100}
            value={frameThickness}
            className="decorate-panel__frame-slider"
            onChange={(e) => onFrameThicknessChange(Number(e.target.value))}
          />
        </label>
      </div>
    );
  }
  ```
- [x] 2.4 In `DecoratePanel.css`, add styles for the new elements. Keep them minimal and consistent with existing panel styles:

  ```css
  .decorate-panel__frame-controls {
    padding: 8px 4px 0;
  }

  .decorate-panel__frame-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--color-text-secondary, #888);
  }

  .decorate-panel__frame-slider {
    flex: 1;
  }
  ```

- [x] 2.5 In `App.tsx`, create a `handleFrameThicknessChange` callback using `useCallback`:
  ```ts
  const handleFrameThicknessChange = useCallback((value: number) => {
    setFrameThickness(value);
  }, []);
  ```
- [x] 2.6 In `App.tsx`, pass the new props to `<DecoratePanel>`:
  ```tsx
  frameThickness = { frameThickness };
  onFrameThicknessChange = { handleFrameThicknessChange };
  ```

---

### [x] 3.0 Integrate thickness changes into undo/redo

**Purpose:** Store `activeFrameId` and `frameThickness` in the undo/redo history alongside stickers, so that Cmd/Ctrl+Z steps back through thickness adjustments (without removing the frame) and also correctly removes the frame when undoing a frame-add action.

#### 3.0 Proof Artifact(s)

- Screen recording: User applies a frame (50%), moves slider to 20%, moves slider to 80%, then presses Cmd+Z twice — frame stays active but thickness steps back to 20%, then to 50% — demonstrates per-release undo works.
- Screen recording: User applies a frame then presses Cmd+Z once — frame disappears from canvas — demonstrates undo correctly removes the frame.
- Dev: When a frame is removed via undo, `frameThickness` resets to 50 on re-apply — demonstrates thickness starts fresh.

#### 3.0 Tasks

- [x] 3.1 In `src/hooks/useStickerHistory.ts`, define a new snapshot type and update the hook to use it. Replace the existing `StickerDescriptor[]` snapshot with a richer object:
  ```ts
  export interface StickerSnapshot {
    stickers: StickerDescriptor[];
    activeFrameId: string | null;
    frameThickness: number;
  }
  ```
  Update the hook's internal stacks from `StickerDescriptor[][]` to `StickerSnapshot[][]`, and update `pushState`, `undo`, and `redo` accordingly so they accept/return `StickerSnapshot` instead of `StickerDescriptor[]`.
- [x] 3.2 In `App.tsx`, update every call to `stickerHistory.pushState(...)` to pass the full snapshot object. There are currently 5 call sites (in `handlePushState`, `handlePlaceSticker`, `handleSpeechBubblePlace`, `handleUpdateSticker`, `handleDeleteSticker`, and `handleToggleFrame`). Each call should become:
  ```ts
  stickerHistory.pushState({ stickers: <current stickers array>, activeFrameId, frameThickness });
  ```
  Note: in `handleToggleFrame`, pass the **next** frame ID (after the toggle), not `prev`. You may need to compute the next value explicitly:
  ```ts
  const nextFrameId = activeFrameId === id ? null : id;
  const nextThickness =
    nextFrameId !== null && nextFrameId !== activeFrameId ? 50 : frameThickness;
  setActiveFrameId(nextFrameId);
  setFrameThickness(nextThickness);
  stickerHistory.pushState({
    stickers,
    activeFrameId: nextFrameId,
    frameThickness: nextThickness,
  });
  ```
  (This replaces the existing `setActiveFrameId((prev) => ...)` pattern in `handleToggleFrame` with explicit next-value computation so it can be passed to `pushState` synchronously.)
- [x] 3.3 In `App.tsx`, update `handleUndo` to restore `activeFrameId` and `frameThickness` from the returned snapshot:
  ```ts
  const handleUndo = useCallback(() => {
    const imgSnap = imageUndo();
    const stickerSnap = stickerHistory.undo();
    if (imgSnap) {
      setRestoreSnapshot(imgSnap);
      setLatestSnapshot(imgSnap);
    }
    if (stickerSnap) {
      setStickers(stickerSnap.stickers);
      setActiveFrameId(stickerSnap.activeFrameId);
      setFrameThickness(stickerSnap.frameThickness);
    } else {
      setStickers([]);
    }
  }, [imageUndo, stickerHistory]);
  ```
- [x] 3.4 In `App.tsx`, update `handleRedo` the same way — restore `stickers`, `activeFrameId`, and `frameThickness` from the snapshot returned by `stickerHistory.redo()`.
- [x] 3.5 In `App.tsx`, add a `handleFrameThicknessCommit` callback that sets the thickness AND pushes a new undo snapshot (called on slider release, not on every drag tick):
  ```ts
  const handleFrameThicknessCommit = useCallback(
    (value: number) => {
      setFrameThickness(value);
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState({
        stickers,
        activeFrameId,
        frameThickness: value,
      });
    },
    [stickers, activeFrameId, pushState, stickerHistory],
  );
  ```
- [x] 3.6 In `DecoratePanel.tsx`, add `onFrameThicknessCommit: (value: number) => void` to `DecoratePanelProps`, and add `onPointerUp` to the slider element that calls it:
  ```tsx
  onPointerUp={(e) => onFrameThicknessCommit(Number((e.target as HTMLInputElement).value))}
  ```
- [x] 3.7 In `App.tsx`, pass `onFrameThicknessCommit={handleFrameThicknessCommit}` to `<DecoratePanel>`.

---

### [ ] 4.0 Add frame remove button and verify all three remove methods

**Purpose:** Add a visible × button on the active frame thumbnail so users can clearly remove a frame, and confirm that all three removal paths (click-toggle, × button, Cmd/Ctrl+Z) work correctly.

#### 4.0 Proof Artifact(s)

- Screenshot: Active frame thumbnail in the Frames tab displays a × button in the top-right corner; inactive thumbnails do not show it — demonstrates conditional rendering.
- Screen recording: Three remove flows in sequence — (1) click active thumbnail to toggle off, (2) re-apply frame then click × button, (3) re-apply frame then Cmd+Z — each removes the frame from the canvas — demonstrates all three removal paths.

#### 4.0 Tasks

- [ ] 4.1 In `DecoratePanel.tsx`, add `onRemoveFrame: () => void` to `DecoratePanelProps`.
- [ ] 4.2 In the Frames tab JSX, update the `frames.map(...)` block so that the active frame's `<button>` contains a nested × button overlaid in the top-right corner. Use `position: relative` on the parent button and `position: absolute` on the × button. Render the × button only when `activeFrameId === def.id`:
  ```tsx
  <button
    key={def.id}
    className={`decorate-panel__item${activeFrameId === def.id ? " decorate-panel__item--active" : ""}`}
    onClick={() => onToggleFrame(def.id)}
    title={def.label}
    style={{ position: "relative" }}
  >
    <img src={def.src} alt={def.label} />
    <span className="decorate-panel__item-label">{def.label}</span>
    {activeFrameId === def.id && (
      <button
        className="decorate-panel__frame-remove"
        onClick={(e) => {
          e.stopPropagation(); // prevent toggle-off from also firing
          onRemoveFrame();
        }}
        aria-label="Remove frame"
        title="Remove frame"
      >
        ×
      </button>
    )}
  </button>
  ```
- [ ] 4.3 In `DecoratePanel.css`, add styles for the remove button:

  ```css
  .decorate-panel__frame-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    padding: 0;
    font-size: 12px;
    line-height: 1;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .decorate-panel__frame-remove:hover {
    background: rgba(200, 0, 0, 0.8);
  }
  ```

- [ ] 4.4 In `App.tsx`, add `handleRemoveFrame` — a dedicated callback that removes the active frame and pushes an undo snapshot:
  ```ts
  const handleRemoveFrame = useCallback(() => {
    pushState(latestSnapshotRef.current ?? "");
    stickerHistory.pushState({
      stickers,
      activeFrameId: null,
      frameThickness: 50,
    });
    setActiveFrameId(null);
    setFrameThickness(50);
  }, [stickers, pushState, stickerHistory]);
  ```
- [ ] 4.5 In `App.tsx`, pass `onRemoveFrame={handleRemoveFrame}` to `<DecoratePanel>`.
- [ ] 4.6 Manually verify the three removal flows in the dev server (`npm run dev`): (1) click active frame thumbnail → deselects, (2) click × button → deselects, (3) apply frame then Cmd+Z → frame is removed.

---

### [ ] 5.0 Tests and quality gates

**Purpose:** Add unit tests covering the new slider, remove button, and frame rendering behavior. Ensure all existing tests pass and all quality gates are green.

#### 5.0 Proof Artifact(s)

- CLI: `task test` output shows all tests pass with no failures — demonstrates correct implementation and no regressions.
- CLI: `task lint` exits 0 — demonstrates no linting violations.
- CLI: `task typecheck` exits 0 — demonstrates no TypeScript errors.

#### 5.0 Tasks

- [ ] 5.1 In `DecoratePanel.test.tsx`, update every existing `render(<DecoratePanel ... />)` call to include the three new required props:
  ```tsx
  frameThickness={100}
  onFrameThicknessChange={vi.fn()}
  onFrameThicknessCommit={vi.fn()}
  onRemoveFrame={vi.fn()}
  ```
- [ ] 5.2 Add a test: "renders thickness slider below active frame thumbnail in Frames tab":
  - Render `DecoratePanel` with `activeFrameId="approved"`, switch to the Frames tab.
  - Assert that a slider input (`type="range"`) is present in the document.
- [ ] 5.3 Add a test: "does not render thickness slider when no frame is active":
  - Render `DecoratePanel` with `activeFrameId={null}`, switch to the Frames tab.
  - Assert that no slider input (`type="range"`) is present.
- [ ] 5.4 Add a test: "calls onFrameThicknessChange when slider is dragged":
  - Render with `activeFrameId="approved"`, switch to Frames tab.
  - Fire a `change` event on the slider with value `30`.
  - Assert `onFrameThicknessChange` was called with `30`.
- [ ] 5.5 Add a test: "renders remove button on the active frame thumbnail":
  - Render with `activeFrameId="approved"`, switch to Frames tab.
  - Assert an element with `aria-label="Remove frame"` is present.
- [ ] 5.6 Add a test: "does not render remove button when no frame is active":
  - Render with `activeFrameId={null}`, switch to Frames tab.
  - Assert no element with `aria-label="Remove frame"` is present.
- [ ] 5.7 Add a test: "calls onRemoveFrame when the × button is clicked":
  - Render with `activeFrameId="approved"`, switch to Frames tab.
  - Fire a `click` event on the remove button (`aria-label="Remove frame"`).
  - Assert `onRemoveFrame` was called once and `onToggleFrame` was NOT called (because `stopPropagation` prevents the parent click).
- [ ] 5.8 Run `task test` and fix any failures. Run `task lint` and `task typecheck` and fix any issues reported.
