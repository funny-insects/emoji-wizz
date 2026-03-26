# Spec 15 — Task 3.0 Proofs: Undo/Redo Integration for frameThickness

## Changes Made

### src/hooks/useStickerHistory.ts

- Exported `StickerSnapshot` interface: `{ stickers: StickerDescriptor[]; activeFrameId: string | null; frameThickness: number }`
- Changed internal stacks from `StickerDescriptor[][]` to `StickerSnapshot[][]`
- Updated `pushState`, `undo`, and `redo` to accept/return `StickerSnapshot`

### App.tsx

- All 6 `stickerHistory.pushState(...)` call sites updated to pass `{ stickers, activeFrameId, frameThickness }`:
  - `handlePushState`
  - `handlePlaceSticker`
  - `handleSpeechBubblePlace`
  - `handleUpdateSticker`
  - `handleDeleteSticker`
  - `handleToggleFrame` (uses explicit next-value computation: `nextFrameId`, `nextThickness`)
- `handleUndo` restored to set `stickers`, `activeFrameId`, and `frameThickness` from snapshot
- `handleRedo` restored to set `stickers`, `activeFrameId`, and `frameThickness` from snapshot
- Added `handleFrameThicknessCommit`: sets thickness + pushes snapshot on slider pointer-up
- Passes `onFrameThicknessCommit={handleFrameThicknessCommit}` to `<DecoratePanel>`

### DecoratePanel.tsx

- Added `onFrameThicknessCommit: (value: number) => void` to `DecoratePanelProps`
- Destructured `onFrameThicknessCommit` in function signature
- Added `onPointerUp` on slider that calls `onFrameThicknessCommit` with the current input value

## CLI Output

### TypeScript Typecheck

```
task: [typecheck] npx tsc --noEmit
(exit 0 — no errors)
```

### ESLint

```
task: [lint] npx eslint src/
(exit 0 — no errors)
```

## Verification

- Slider drag fires `onFrameThicknessChange` (live update, no history push)
- Slider release fires `onFrameThicknessCommit` → pushes undo snapshot with current thickness
- Cmd+Z steps back thickness values (50% → 20% → back to 50% scenario)
- Cmd+Z on frame-add action removes frame from canvas (restores `activeFrameId: null`)
- Cmd+Shift+Z (redo) restores frame and thickness correctly
- `handleToggleFrame` computes next values synchronously before pushing to history, avoiding stale closure issues
