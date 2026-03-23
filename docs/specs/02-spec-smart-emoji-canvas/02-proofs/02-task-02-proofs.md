# Task 2.0 Proof Artifacts — EmojiCanvas Component: Checkerboard & Safe Zone

## Unit Tests — `task test`

```
 Test Files  5 passed (5)
       Tests  13 passed (13)
```

### Test files run:

- `src/utils/presets.test.ts` — 3 tests ✅
- `src/utils/canvasDrawing.test.ts` — 5 tests ✅
- `src/components/PresetSelector.test.tsx` — 2 tests ✅
- `src/components/EmojiCanvas.test.tsx` — 1 test ✅
- `src/App.test.tsx` — 2 tests ✅

### canvasDrawing.test.ts assertions:

- ✅ drawCheckerboard calls fillRect to fill the canvas with tiles
- ✅ drawCheckerboard: each fillRect call covers an 8×8 tile
- ✅ drawSafeZone calls strokeRect once
- ✅ drawSafeZone: strokeRect is inset by the padding value (x=12, y=12, w=104, h=104 for 128×128 canvas with padding=12)
- ✅ drawSafeZone calls setLineDash to produce a dashed line

### EmojiCanvas.test.tsx assertions:

- ✅ renders a canvas with width="128" and height="128" for the Slack preset

## E2E Tests — `task test:e2e`

```
4 passed (1.8s)
```

### canvas.spec.ts assertions:

- ✅ canvas renders with Slack preset dimensions (width="128", height="128")
- ✅ canvas renders non-empty pixel data (checkerboard is drawing — waitForFunction confirms pixel data is non-zero)

## Verification

- `drawCheckerboard` fills the full canvas with 8×8 alternating #FFFFFF/#CCCCCC tiles.
- `drawSafeZone` draws a dashed rgba(0,120,255,0.5) rectangle inset by `safeZonePadding` px on all sides.
- `EmojiCanvas` renders at preset dimensions and calls both drawing functions via `useEffect`.
- `PresetSelector` renders one `<option>` per preset and fires `onChange` with the selected id.
- E2E confirms the canvas element is present and non-empty in a real browser.
