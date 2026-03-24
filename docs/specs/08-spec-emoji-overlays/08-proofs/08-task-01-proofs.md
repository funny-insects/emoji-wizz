# 08 Task 1.0 — Proof Artifacts: Source and bundle sticker and frame assets

## CLI Output

### Sticker assets listing

```
$ ls src/assets/stickers/
crying-tears.png
googly-eyes.png
heart-eyes.png
index.ts
laser-eyes.png
sparkle-eyes.png
speech-bubble.png
sunglasses.png
```

7 files present: 6 eyes stickers + speech bubble + typed registry.

### Frame assets listing

```
$ ls src/assets/frames/
approved.png
index.ts
nice.png
no.png
one-hundred.png
```

4 frame PNGs + typed registry.

### Typecheck output

```
$ task typecheck
task: [typecheck] npx tsc --noEmit
(no errors — clean exit)
```

## Asset Registry Content

### src/assets/stickers/index.ts

```ts
export interface StickerDefinition {
  id: string;
  label: string;
  src: string;
  category: string;
  requiresText?: boolean;
}

export const STICKER_DEFINITIONS: StickerDefinition[] = [
  {
    id: "heart-eyes",
    label: "Heart Eyes",
    src: heartEyesSrc,
    category: "eyes",
  },
  {
    id: "sunglasses",
    label: "Sunglasses",
    src: sunglassesSrc,
    category: "eyes",
  },
  {
    id: "crying-tears",
    label: "Crying Tears",
    src: cryingTearsSrc,
    category: "eyes",
  },
  {
    id: "sparkle-eyes",
    label: "Sparkle Eyes",
    src: sparkleEyesSrc,
    category: "eyes",
  },
  {
    id: "googly-eyes",
    label: "Googly Eyes",
    src: googlyEyesSrc,
    category: "eyes",
  },
  {
    id: "laser-eyes",
    label: "Laser Eyes",
    src: laserEyesSrc,
    category: "eyes",
  },
  {
    id: "speech-bubble",
    label: "Speech Bubble",
    src: speechBubbleSrc,
    category: "eyes",
    requiresText: true,
  },
];
```

### src/assets/frames/index.ts

```ts
export interface FrameDefinition {
  id: string;
  label: string;
  src: string;
  category: string;
}

export const FRAME_DEFINITIONS: FrameDefinition[] = [
  {
    id: "approved",
    label: "Approved",
    src: approvedSrc,
    category: "reactions",
  },
  { id: "nice", label: "Nice", src: niceSrc, category: "reactions" },
  {
    id: "one-hundred",
    label: "100",
    src: oneHundredSrc,
    category: "reactions",
  },
  { id: "no", label: "No", src: noSrc, category: "reactions" },
];
```

## Verification

- [x] All 7 sticker PNGs present in `src/assets/stickers/`
- [x] All 4 frame PNGs present in `src/assets/frames/`
- [x] `StickerDefinition` interface exported with `id`, `label`, `src`, `category`, `requiresText?`
- [x] `FrameDefinition` interface exported with `id`, `label`, `src`, `category`
- [x] Speech bubble entry has `requiresText: true`
- [x] `task typecheck` passes with 0 errors
