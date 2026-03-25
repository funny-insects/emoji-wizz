# Task 2.0 Proofs — DecoratePanel with Sticker System

## CLI Output

### Lint

```
task: [lint] npx eslint src/
(no errors)
```

### Typecheck

```
task: [typecheck] npx tsc --noEmit
(no errors)
```

### Test Results

```
 RUN  v4.1.0

 Test Files  13 passed (13)
       Tests  83 passed (83)
    Start at  16:06:38
    Duration  2.02s
```

## Files Created / Modified

### New files

- `src/utils/stickerTypes.ts` — `StickerDescriptor` interface
- `src/components/DecoratePanel.tsx` — Floating sidebar with Stickers / Frames tabs
- `src/components/DecoratePanel.css` — Panel styles
- `src/components/DecoratePanel.test.tsx` — 5 unit tests (null image, thumbnail render, click callback, tab switch, active frame class)

### Modified files

- `src/App.tsx` — Added `stickers`, `selectedStickerId`, `activeFrameId` state; `handlePlaceSticker`, `handleUpdateSticker`, `handleDeleteSticker`, `handleSelectSticker`, `handleToggleFrame` callbacks; Delete/Backspace keydown handler; `<DecoratePanel>` in JSX
- `src/components/EmojiCanvas.tsx` — Added sticker props, sticker image loading, Transformer wiring, Layer 3 with `KonvaImage` nodes + `<Transformer>`, floating delete button
- `src/components/EmojiCanvas.test.tsx` — Updated layer count assertion from 3 → 4

## Verification

### Proof artifact (a): DecoratePanel returns null when image is null

Test: `"returns null when image is null"` — `container.firstChild` is null.

### Proof artifact (b): Sticker thumbnails render when image present

Test: `"renders sticker thumbnails when image is present"` — `getByAltText("Laser Eyes")` and `getByAltText("Heart Eyes")` both resolve.

### Proof artifact (c): Clicking thumbnail calls onPlaceSticker

Test: `"calls onPlaceSticker with the correct definition"` — mock fn called once with `mockStickers[0]`.

### Proof artifact (d): Tab switching works

Test: `"switches to Frames tab"` — after clicking Frames button, frame `img` is visible and sticker `img` is gone.

### Sticker layer in EmojiCanvas

Layer 3 (`index 3`) added to Konva Stage. Test `"renders four layers"` passes.
