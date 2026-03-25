# Task 4.0 Proofs — Crop Tool: Apply, Auto-Reframe, and Undo Integration

## CLI Output

```
$ task lint && task typecheck && task test && task format:check
task: [lint] npx eslint src/
task: [typecheck] npx tsc --noEmit
task: [test] npx vitest run

 Test Files  17 passed (17)
      Tests  133 passed (133)

task: [format:check] npx prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

## Implementation Summary

### 4.1 handleCropConfirm in EmojiCanvas

- Implemented as a `useEffect` watching `cropConfirmSeq` prop (request pattern matching `bgRemovalRequest`/`transformRequest`)
- Reads `cropRect` and `offscreenCanvasRef.current`
- Calls `cropCanvas()` to extract the selected region
- Calls `reframeCanvas()` to scale+center to 512x512
- Updates `displayCanvas` state (triggers snapshot push via existing `useEffect`)
- Resets `activeTool` to "pointer" via `onToolChange`
- Clears `cropRect`

### 4.2 Exposed to App.tsx via request pattern

- `cropConfirmSeq` state + `cropConfirmSeqRef` counter in App.tsx
- Passed as prop to EmojiCanvas
- EmojiCanvas tracks previous seq via `prevCropConfirmSeqRef` to detect new requests

### 4.3 Wired to Confirm button and Enter key

- Toolbar Confirm button calls `onCropConfirm` which increments `cropConfirmSeq`
- Enter key in `handleKeyDown` calls `handleCropConfirm`

### 4.4 Undo integration

- Setting `displayCanvas` triggers the existing `useEffect` that calls `onPushState`
- This pushes a snapshot to `useHistory`, enabling Ctrl+Z to restore pre-crop state
- No additional code needed for undo support

### 4.5 Quality gates

- All pass: lint, typecheck, test (133/133), format:check

## Verification

- Lint: pass
- TypeScript: pass
- Tests: 133/133 pass
- Formatting: pass
