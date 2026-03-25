# Task 3.0 Proof Artifacts — Analyzer with Export-Format-Aware Suggestions

## Summary

Task 3.0 updates the analyzer to work on the 512×512 canvas while generating suggestions relative to the selected export format's constraints. Safe zone padding is scaled proportionally (e.g., Slack 12px at 128 → 48px at 512). The optimizer preview is downscaled to the selected export format's resolution.

---

## CLI Output

### TypeScript Check

```
task: [typecheck] npx tsc --noEmit
(no output — passed cleanly)
```

### Lint

```
task: [lint] npx eslint src/
(no output — passed cleanly)
```

### Test Results

```
 RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

 Test Files  16 passed (16)
       Tests  118 passed (118)
    Start at  10:19:10
    Duration  2.22s (transform 605ms, setup 738ms, import 1.08s, tests 2.35s, environment 6.41s)
```

---

## Code Changes

### `src/utils/generateSuggestions.ts`

Added optional `canvasSize` parameter (default 512). Canvas boundary check now uses `canvasSize` instead of `preset.width`/`preset.height`. Safe zone padding is scaled proportionally:

```typescript
export function generateSuggestions(
  bounds: ContentBounds,
  preset: PlatformPreset,
  canvasSize: number = 512,
): string[] {
  // ...
  if (bounds.width < canvasSize || bounds.height < canvasSize) {
    results.push("Trim transparent padding");
  }
  const scaledPadding = preset.safeZonePadding * (canvasSize / preset.width);
  const safeW = canvasSize - 2 * scaledPadding;
  const safeH = canvasSize - 2 * scaledPadding;
  // ...
}
```

**Scaling examples:**

- Slack (12px at 128) with 512 canvas → `12 * (512/128) = 48px`
- Apple (40px at 512) with 512 canvas → `40 * (512/512) = 40px` (unchanged)

### `src/App.tsx` — `handleAnalyze`

Updated to:

1. Pass `exportPreset` (instead of hardcoded `PLATFORM_PRESETS[0]`) and `CANVAS_SIZE` (512) to `generateSuggestions`
2. Downscale the 512×512 data URL to `exportPreset` dimensions for the optimizer panel preview when `exportPreset.width < 512`

```typescript
setSuggestions(generateSuggestions(bounds, exportPreset, CANVAS_SIZE));

if (exportPreset.width < CANVAS_SIZE) {
  // ... downscale to exportPreset dimensions for preview
  const scaled = downscaleCanvas(
    sourceCanvas,
    exportPreset.width,
    exportPreset.height,
  );
  setCustomEmojiDataUrl(scaled.toDataURL());
} else {
  setCustomEmojiDataUrl(dataUrl);
}
```

---

## Test Results — New Test Cases

### `src/utils/generateSuggestions.test.ts`

New tests added under `canvasSize scaling` describe block:

| Test                        | Description                                                      | Result  |
| --------------------------- | ---------------------------------------------------------------- | ------- |
| Slack 512x512 full bounds   | Scaled padding 48px, full 512×512 content → no suggestions       | ✅ pass |
| Slack 512x512 small content | 50×50 content → triggers "Increase content size" suggestion      | ✅ pass |
| Apple 512x512 full bounds   | Padding 40px (no scaling), full 512×512 content → no suggestions | ✅ pass |
| Updated existing test       | Native preset resolution uses `canvasSize = slackPreset.width`   | ✅ pass |

---

## Verification

- [x] `generateSuggestions` accepts optional `canvasSize` (default 512)
- [x] Padding scales proportionally: Slack 12px → 48px at 512×512 canvas
- [x] Apple padding unchanged at 512×512 (40px, no scaling needed)
- [x] `handleAnalyze` uses `exportPreset` for format-aware analysis
- [x] Optimizer preview downscaled to export preset dimensions (128×128 for Slack/Discord)
- [x] All 118 tests pass with no regressions
- [x] TypeScript and ESLint pass cleanly
