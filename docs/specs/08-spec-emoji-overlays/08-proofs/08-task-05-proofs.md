# Task 5.0 Proofs — Export Integration + Undo/Redo for Stickers and Frames

## CLI Output

### Typecheck

```
task: [typecheck] npx tsc --noEmit
(0 errors)
```

### Lint

```
task: [lint] npx eslint src/
(0 warnings or errors)
```

### Test Results

```
RUN  v4.1.0 /Users/anmol/emoji-wizz

 Test Files  15 passed (15)
       Tests  100 passed (100)
   Start at  16:23:27
   Duration  2.51s (transform 1.19s, setup 1.09s, import 2.31s, tests 2.80s, environment 12.76s)
```

## New Files Created

### `src/hooks/useStickerHistory.ts`

Mirrors `useHistory.ts` exactly but stores `StickerDescriptor[]` snapshots instead of `string`.
Exports: `{ pushState, undo, redo, canUndo, canRedo, clear }`.

### `src/hooks/useStickerHistory.test.ts`

10 tests mirroring `useHistory.test.ts`, all using `StickerDescriptor[]` snapshots.
All 10 tests pass.

## Modified Files

### `src/utils/exportUtils.ts`

Added `exportStageAsBlob(stage: Konva.Stage): Promise<Blob | null>`:

- Hides Layer 0 (checkerboard background) before export
- Calls `stage.toDataURL({ pixelRatio: 1 })`
- Restores Layer 0 visibility
- Converts data URL to Blob via `fetch`

### `src/App.tsx`

- Added `useStickerHistory` import and hook instance
- Renamed `undo`/`redo` from `useHistory` to `imageUndo`/`imageRedo`
- Added `latestSnapshotRef` (kept in sync with `latestSnapshot`) for stale-closure-free access in callbacks
- `handlePushState` now also calls `stickerHistory.pushState([...stickers])`
- `handleUndo`: calls both `imageUndo()` and `stickerHistory.undo()`, restores image snapshot and sticker array
- `handleRedo`: calls both `imageRedo()` and `stickerHistory.redo()`, restores image snapshot and sticker array
- `handlePlaceSticker`, `handleSpeechBubblePlace`, `handleUpdateSticker`, `handleDeleteSticker`, `handleToggleFrame`: each now calls `pushState(latestSnapshotRef.current ?? "")` and `stickerHistory.pushState(newStickers)` after mutating state
- `handleDownload`: when stickers or a frame are active, uses `exportStageAsBlob(stageRef.current)` to capture all Konva layers; falls back to existing snapshot/canvas path when no overlays are present; handles null `stageRef.current` with early return + warning

## Verification

- `useStickerHistory` and `useHistory` stacks are always pushed together, keeping them the same length
- Undo/redo restores both the image canvas state and the sticker array atomically
- Export via `exportStageAsBlob` hides the checkerboard (Layer 0) so exported PNG has transparent background
- All 100 tests pass with no regressions
