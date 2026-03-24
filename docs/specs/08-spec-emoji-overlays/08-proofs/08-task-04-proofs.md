# Task 4.0 Proof Artifacts — Speech Bubble Modal + Custom PNG Sticker Upload

## Summary

Task 4.0 adds the speech bubble modal (text entry before placement) and custom PNG upload to the Stickers tab, plus Konva Text overlay for speech bubble stickers.

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

 Test Files  14 passed (14)
       Tests  90 passed (90)
    Start at  16:17:04
    Duration  2.16s
```

All 90 tests pass, 14 test files pass (5 new tests in `SpeechBubbleModal.test.tsx`).

---

## Implementation Evidence

### 4.1 — `SpeechBubbleModal.tsx`

Centered modal overlay with:

- Autofocused `<input>` (via `useRef` + `useEffect`)
- "Place" button calls `onPlace(input.value)`
- "Cancel" button calls `onCancel()`
- Enter key on input calls `onPlace`
- Escape key (document listener) calls `onCancel`
- Backdrop click calls `onCancel`; inner dialog `stopPropagation`

### 4.2 + 4.3 + 4.4 — `App.tsx` modal wiring

```tsx
const [showSpeechBubbleModal, setShowSpeechBubbleModal] = useState(false);
const pendingTextStickerRef = useRef<StickerDefinition | null>(null);
```

`handlePlaceSticker` intercepts `requiresText` stickers:

```tsx
if (def.requiresText) {
  pendingTextStickerRef.current = def;
  setShowSpeechBubbleModal(true);
  return;
}
```

`handleSpeechBubblePlace` creates descriptor with text and closes modal. Modal rendered conditionally in JSX.

### 4.5 — Konva Text overlay for speech bubble stickers

In the sticker layer, after each `KonvaImage`, a `KonvaText` node is conditionally rendered when `sticker.text` is set:

```tsx
{
  sticker.text && (
    <KonvaText
      x={sticker.x + sticker.width * sticker.scaleX * 0.1}
      y={sticker.y + sticker.height * sticker.scaleY * 0.3}
      width={sticker.width * sticker.scaleX * 0.8}
      text={sticker.text}
      fontSize={Math.max(10, sticker.width * sticker.scaleX * 0.15)}
      fill="#222"
      align="center"
      wrap="word"
      listening={false}
    />
  );
}
```

### 4.6 + 4.7 + 4.8 — Custom PNG upload in `DecoratePanel.tsx`

- "Upload PNG" button above sticker grid triggers hidden `<input type="file" accept="image/png">`
- `handleUploadChange`: creates object URL, adds to `customStickers` state (shown first), calls `onPlaceSticker` immediately
- Object URLs tracked in `objectUrlsRef`; cleanup `useEffect` revokes all on unmount

### 4.9 — `SpeechBubbleModal.test.tsx`

5 tests covering all required interactions:

- (a) Modal renders with text input and two buttons
- (b) Clicking "Place" calls `onPlace` with input text
- (c) Clicking "Cancel" calls `onCancel`
- (d) Pressing Escape calls `onCancel`
- (e) Pressing Enter calls `onPlace` with input text

---

## Verification Checklist

- [x] `SpeechBubbleModal.tsx` created with all required interactions
- [x] `handlePlaceSticker` intercepts `requiresText` stickers; modal shown
- [x] `handleSpeechBubblePlace` creates descriptor with text, closes modal
- [x] Modal rendered in `App.tsx` JSX when `showSpeechBubbleModal` is true
- [x] Konva `Text` overlay rendered for speech bubble stickers with text
- [x] "Upload PNG" button in Stickers tab triggers file picker
- [x] File upload creates object URL, adds to sidebar, places sticker immediately
- [x] Object URLs revoked on `DecoratePanel` unmount
- [x] All 5 `SpeechBubbleModal` tests pass
- [x] All 90 tests pass, lint clean, typecheck clean
