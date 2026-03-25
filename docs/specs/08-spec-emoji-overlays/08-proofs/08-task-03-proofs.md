# Task 3.0 Proof Artifacts — Frame System (Reactions Category)

## Summary

Task 3.0 adds the frame system: a fifth Konva layer in `EmojiCanvas` that renders the active frame as a full-canvas overlay, wired through `App.tsx` with toggle logic, and covered by updated `DecoratePanel` tests.

---

## CLI Output — Lint

```
task: [lint] npx eslint src/
(no errors or warnings)
```

## CLI Output — Typecheck

```
task: [typecheck] npx tsc --noEmit
(no errors)
```

## CLI Output — Test Suite

```
 RUN  v4.1.0 /Users/anmol/emoji-wizz

 Test Files  13 passed (13)
       Tests  85 passed (85)
    Start at  16:12:54
    Duration  1.99s
```

All 85 tests pass, 13 test files pass.

---

## Implementation Evidence

### 3.1 + 3.2 — Fifth Layer (frame) added to `EmojiCanvas.tsx`

New `activeFrameSrc` prop added to `EmojiCanvasProps`:

```tsx
activeFrameSrc?: string | null;
```

Frame image loaded via `useEffect` + `new Image()` (cleanup sets image to null when src changes):

```tsx
useEffect(() => {
  if (!activeFrameSrc) return;
  const img = new window.Image();
  img.onload = () => setFrameImage(img);
  img.src = activeFrameSrc;
  return () => {
    setFrameImage(null);
  };
}, [activeFrameSrc]);
```

Fifth `<Layer>` added after sticker layer inside `<Stage>`:

```tsx
<Layer>
  {frameImage && (
    <KonvaImage
      image={frameImage}
      x={0}
      y={0}
      width={width}
      height={height}
      listening={false}
    />
  )}
</Layer>
```

`listening={false}` ensures frames are non-interactive. `width={width}` and `height={height}` come from `preset`, so frames automatically scale with preset changes (3.5 — preset-aware scaling verified).

### 3.3 — `App.tsx` wires activeFrameSrc

```tsx
const activeFrameSrc =
  FRAME_DEFINITIONS.find((f) => f.id === activeFrameId)?.src ?? null;
```

Passed to `EmojiCanvas`:

```tsx
<EmojiCanvas
  ...
  activeFrameSrc={activeFrameSrc}
/>
```

`handleToggleFrame` and `activeFrameId` state were already in place from Task 2.0.

### 3.4 — Frames tab in `DecoratePanel.tsx`

Already implemented in Task 2.0. Frames tab renders thumbnail grid; active frame gets `decorate-panel__item--active` class (hotpink border via CSS).

### 3.6 — New frame tests in `DecoratePanel.test.tsx`

Two new tests added (mock data expanded to 4 frames):

- **"renders all 4 frame thumbnails in the Frames tab"** — switches to Frames tab, asserts all 4 frame `<img>` alt texts visible and total count is 4.
- **"calls onToggleFrame with the correct ID when a frame is clicked"** — clicks "Nice" frame, asserts `onToggleFrame` called once with `"nice"`.

Existing test **"highlights the active frame with active CSS class"** covers requirement (c).

### EmojiCanvas layer count test updated

`EmojiCanvas.test.tsx` updated: test description and assertion changed from 4 layers to 5 layers to reflect the new frame layer.

---

## Verification Checklist

- [x] Fifth frame layer added to `EmojiCanvas` (Layer index 4, after sticker layer)
- [x] Frame renders with `listening={false}` — non-interactive
- [x] Frame dimensions use `preset.width` / `preset.height` — preset-aware scaling ✓
- [x] `activeFrameSrc` resolved in `App.tsx` from `FRAME_DEFINITIONS`
- [x] Frames tab in `DecoratePanel` renders 4 thumbnails with active highlight
- [x] 2 new frame tests added to `DecoratePanel.test.tsx`
- [x] All 85 tests pass, lint clean, typecheck clean
