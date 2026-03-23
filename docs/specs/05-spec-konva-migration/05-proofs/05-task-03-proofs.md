# 05 Task 3.0 Proofs — Rewrite Unit Tests for Konva Components

## CLI Output: `task test`

```
RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 ✓ src/utils/presets.test.ts > PLATFORM_PRESETS > has at least one entry 1ms
 ✓ src/utils/presets.test.ts > PLATFORM_PRESETS > slack preset has correct dimensions, safe zone, and maxFileSizeKb 0ms
 ✓ src/utils/presets.test.ts > PLATFORM_PRESETS > discord preset has correct dimensions, safe zone, and maxFileSizeKb 0ms
 ✓ src/utils/presets.test.ts > PLATFORM_PRESETS > apple preset has correct dimensions, safe zone, and maxFileSizeKb 0ms
 ✓ src/utils/presets.test.ts > PLATFORM_PRESETS > every entry has all required fields defined 0ms
 ✓ src/utils/canvasDrawing.test.ts > drawCheckerboard > calls fillRect to fill the canvas with tiles 2ms
 ✓ src/utils/canvasDrawing.test.ts > drawCheckerboard > each fillRect call covers an 8×8 tile 5ms
 ✓ src/utils/canvasDrawing.test.ts > drawSafeZone > calls strokeRect once 0ms
 ✓ src/utils/canvasDrawing.test.ts > drawSafeZone > strokeRect is inset by the padding value 0ms
 ✓ src/utils/canvasDrawing.test.ts > drawSafeZone > calls setLineDash to produce a dashed line 0ms
 ✓ src/utils/imageScaling.test.ts > computeContainRect > square image into same-size canvas fills exactly 2ms
 ✓ src/utils/imageScaling.test.ts > computeContainRect > landscape image is letterboxed — full width, centered vertically 0ms
 ✓ src/utils/imageScaling.test.ts > computeContainRect > portrait image is pillarboxed — full height, centered horizontally 0ms
 ✓ src/utils/imageScaling.test.ts > computeContainRect > small image is scaled up to fit canvas 0ms
 ✓ src/components/PresetSelector.test.tsx > PresetSelector > renders one option per preset 83ms
 ✓ src/components/PresetSelector.test.tsx > PresetSelector > calls onChange with the selected preset id 11ms
 ✓ src/components/EmojiCanvas.test.tsx > EmojiCanvas > renders a canvas inside .konvajs-content with correct dimensions for the Slack preset 60ms
 □ src/components/EmojiCanvas.test.tsx > EmojiCanvas > renders three layers: background, image, and overlays (overlays layer added in task 4.0)
 ✓ src/components/EmojiCanvas.test.tsx > EmojiCanvas > renders 256 checkerboard Rect tiles for the 128×128 Slack preset 18ms
 ✓ src/components/EmojiCanvas.test.tsx > EmojiCanvas > renders the safe-zone Rect with correct stroke, dash, and position 16ms
 ✓ src/App.test.tsx > App > renders a canvas element 63ms
 ✓ src/App.test.tsx > App > renders a select element for preset selection 70ms

 Test Files  6 passed (6)
       Tests  21 passed | 1 todo (22)
    Start at  15:50:18
    Duration  1.00s
```

## CLI Output: `task typecheck`

```
(no output — zero TypeScript errors)
```

## Test Changes Summary

### `src/components/EmojiCanvas.test.tsx` (rewritten)

Replaced the single canvas attribute test with four Konva-specific tests:

| Test                                       | What it verifies                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| renders a canvas inside `.konvajs-content` | Konva stage creates a canvas in its wrapper div with `width=128`, `height=128`                                                          |
| renders three layers (todo)                | Placeholder for overlays layer test — completed in task 4.0                                                                             |
| renders 256 checkerboard Rect tiles        | `Konva.stages[0].getLayers()[0]` background layer has exactly 256 filled Rects                                                          |
| renders safe-zone Rect with correct props  | Safe-zone Rect has `stroke="rgba(0, 120, 255, 0.5)"`, `strokeWidth=1`, `dash=[4,4]`, positioned at `(safeZonePadding, safeZonePadding)` |

### `src/App.test.tsx` (unchanged)

`document.querySelector("canvas")` still locates Konva's internally rendered canvas — no changes needed.

## Verification

- All 21 tests pass with zero failures
- 1 todo (three-layer structure — deferred to task 4.0)
- TypeScript: zero errors (`tsc --noEmit` exits cleanly)
