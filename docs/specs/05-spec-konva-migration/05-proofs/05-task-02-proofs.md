# 05 Task 2.0 — Proof Artifacts: Image Display on Dedicated Konva Image Layer

## Summary

Added a dedicated Konva `<Layer>` for image display in `EmojiCanvas.tsx`. When the `image` prop is non-null, a `<KonvaImage>` component renders with contain-fit scaling via `computeContainRect`. The background layer (checkerboard + safe zone) and image layer are separate layers within the `<Stage>`.

## Implementation Changes

**`src/components/EmojiCanvas.tsx`**

- Imported `Image as KonvaImage` from `react-konva`
- Imported `computeContainRect` from `../utils/imageScaling`
- Added `image` prop to destructured props (was already in the interface, now used)
- Computes `imageRect` via `computeContainRect` when `image` is non-null
- Added second `<Layer>` after background layer containing `<KonvaImage>` when image is present

## CLI Output

### Lint (ESLint)

```
$ npx eslint src/
(no output — zero warnings, zero errors)
```

### TypeCheck

```
$ npx tsc --noEmit
(no output — zero TypeScript errors)
```

### Unit Tests

```
$ npx vitest run

 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  6 passed (6)
       Tests  19 passed (19)
    Start at  15:42:26
    Duration  958ms (transform 211ms, setup 396ms, import 439ms, tests 309ms, environment 3.12s)
```

## Verification of Proof Artifacts

### E2E Proof: "canvas pixel data changes after file upload"

- `EmojiCanvas` now renders a `<KonvaImage>` on the image layer when `image` prop is non-null
- `App.tsx` passes `image` from `useImageImport()` to `EmojiCanvas` — all three import methods (file input, drag-drop, paste) are covered by the hook

### E2E Proof: "switching preset after image upload shows confirm dialog and resizes canvas"

- `App.tsx:handlePresetChange` shows `window.confirm()` when `image` is loaded
- On accept, `setActivePreset` updates the preset, which changes `preset.width` / `preset.height` in `EmojiCanvas`, causing `computeContainRect` to recompute and the `<KonvaImage>` to re-render at the new scaled dimensions

### Unit Proof: `imageScaling.test.ts` passes unchanged

- `computeContainRect` was not modified — 6 passing tests confirm this

## Key Code Snippet

```tsx
const imageRect = image
  ? computeContainRect(image.naturalWidth, image.naturalHeight, width, height)
  : null;

// Inside <Stage>:
<Layer>
  {image && imageRect && (
    <KonvaImage
      image={image}
      x={imageRect.x}
      y={imageRect.y}
      width={imageRect.width}
      height={imageRect.height}
    />
  )}
</Layer>;
```
