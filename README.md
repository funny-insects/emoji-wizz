# Emoji Wizz (pronounced EMO JEE WIZZ)

Internal tool for creating custom emojis that look great in Slack. Built with TypeScript, React, and Konva.js — runs entirely in the browser, no backend.

## Running locally

**Prerequisites:** Node 22 via [nvm](https://github.com/nvm-sh/nvm), [Task](https://taskfile.dev/)

```bash
nvm use         # pins to Node 22 via .nvmrc
npm install
npm run dev     # localhost:5173
```

**On mobile:** expose the dev server to your local network so a phone on the same Wi-Fi can access it:

```bash
npm run dev -- --host
```

Vite will print a network URL (e.g. `http://192.168.x.x:5173`) — open that on your phone.

## Architecture

Emoji Wizz is a three-stage pipeline: **import → edit → export**. React manages state, Konva.js handles canvas rendering, and all processing happens client-side in the browser — no backend required.

### Pipeline

```
useImageImport (hook)
  └─ file input / drag-and-drop / paste
  └─ resolves to HTMLImageElement → stored in App state

EmojiCanvas (component)
  └─ receives image + active preset
  └─ renders via react-konva Stage with 3 layers:
       Layer 0 — checkerboard (transparency indicator)
       Layer 1 — the imported image (scaled via computeContainRect)
       Layer 2 — reserved / empty
  └─ stageRef exposed to App for pixel reads

On Analyze → OptimizerPanel
  └─ stageRef.toCanvas() → getImageData()
  └─ detectContentBounds() scans pixels for non-transparent content
  └─ generateSuggestions() checks fill ratio against safe zone

On Download → ExportControls
  └─ buildExportCanvas() draws image onto a plain HTML canvas
  └─ canvas.toBlob() → browser file download
  └─ checkFileSizeWarning() compares blob size against preset limit
```

### src/ directories

**`components/`** — React UI components

| File                 | Role                                                                          |
| -------------------- | ----------------------------------------------------------------------------- |
| `EmojiCanvas.tsx`    | Konva `Stage` with checkerboard + image layers; handles drop and paste events |
| `PresetSelector.tsx` | Dropdown to switch between platform presets (Slack / Discord / Apple)         |
| `OptimizerPanel.tsx` | Analyze button, suggestions list, side-by-side emoji size comparison          |
| `ExportControls.tsx` | Format picker (PNG / GIF / WebP), download button, file size warning          |

**`hooks/`** — Custom React hooks

| File                | Role                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `useImageImport.ts` | Unified handler for file input, drag-and-drop, and clipboard paste; returns an `HTMLImageElement` |

**`utils/`** — Pure functions, no React

| File                     | Role                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `presets.ts`             | Defines `PlatformPreset` type and the three platform configs (canvas size, safe zone padding, max file size)       |
| `imageScaling.ts`        | `computeContainRect` — scales image to fit canvas while preserving aspect ratio (`object-fit: contain` equivalent) |
| `detectContentBounds.ts` | Scans raw `ImageData` pixel-by-pixel to find the bounding box of non-transparent content                           |
| `generateSuggestions.ts` | Compares content bounds against the preset safe zone; flags if fill ratio is below 60%                             |
| `exportUtils.ts`         | `buildExportCanvas` (draws image to HTML canvas), `buildFilename`, `checkFileSizeWarning`                          |

**`services/`** — Empty; reserved for future API integrations

**`assets/`** — Static files bundled by Vite (e.g. `reference-emoji.png` used in the optimizer comparison view)

## Commands

Use `task` for all quality checks — not raw `npx`. The Taskfile wraps the underlying tools so commands stay consistent across local dev and CI.

### Dev server & build (npm scripts)

| Command           | What it does                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite dev server at `localhost:5173` with hot reload       |
| `npm run build`   | Type-checks with `tsc`, then produces a production bundle in `dist/` |
| `npm run preview` | Serves the `dist/` build locally to verify the production output     |

### Quality checks (task)

| Command             | What it does                                                                          |
| ------------------- | ------------------------------------------------------------------------------------- |
| `task lint`         | Runs ESLint across `src/` — zero warnings allowed                                     |
| `task typecheck`    | Runs `tsc --noEmit` to check types without emitting files                             |
| `task test`         | Runs all Vitest unit tests once (non-watch)                                           |
| `task test:e2e`     | Runs Playwright e2e tests — requires the dev server to be running at `localhost:5173` |
| `task format`       | Formats all files with Prettier (rewrites in place)                                   |
| `task format:check` | Checks formatting without writing — used in CI                                        |

> **Note:** `task lint`, `task typecheck`, and `task test` are the three gates that must pass before merging. `task test:e2e` is run manually; it is not part of CI.

## Testing

### Unit tests (Vitest)

Run with `task test`. Tests run in jsdom and use Testing Library for component tests.

- **Location:** colocated with source — `src/utils/exportUtils.test.ts` lives next to `exportUtils.ts`
- **Utils** are tested with plain inputs/outputs, no React
- **Components** are tested by rendering and asserting on DOM output
- `src/test-setup.ts` patches `ImageData` and the Canvas 2D context so Konva and pixel-scanning utils work under jsdom — loaded automatically, no import needed

### E2E tests (Playwright)

Run with `task test:e2e`. Requires the dev server running first:

```bash
npm run dev       # terminal 1
task test:e2e     # terminal 2
```

Tests live in `e2e/` organised by feature (`app.spec.ts`, `canvas.spec.ts`, `export.spec.ts`). Use `e2e/fixtures/test-emoji.png` for any test that needs a real file upload.

## CI/CD & Code Quality

### Pre-commit hooks

[Husky](https://typicode.github.io/husky/) runs `lint-staged` automatically on every commit. You don't invoke this manually — it fires when you `git commit`.

- **`.ts` / `.tsx` files** — ESLint (zero warnings) + Prettier
- **`.js`, `.json`, `.css`, `.md` files** — Prettier only

If ESLint fails, the commit is blocked until the issues are fixed.

### GitHub Actions

CI runs on every pull request to `main`. It must pass before merging:

1. `task lint`
2. `task typecheck`
3. `task test`

E2E tests are not run in CI.

## Tech Stack

- **Frontend:** TypeScript + React 19 (Vite)
- **Deployment:** AWS App Runner
- **Task runner:** Taskfile (lint, test, typecheck)
- **CI:** GitHub Actions

## Features

### Smart Emoji Canvas

- Platform-aware presets (canvas size, margins, contrast, background transparency)
- Presets for: Slack, Discord, Apple custom emojis

### Visual Size Optimizer

- Detects bounds of emoji subject
- Side-by-side preview vs. built-in emoji for sizing comparison
- Suggests fixes: resize, trim padding, boost outline, simplify details

### Lightweight Editor

- General tools: crop, resize, rotate, erase background, brush/pen, text, outline/stroke, shadow/glow, sticker layers, shape tools, blur/sharpen, contrast/saturation, fill/recolor, transparent background
- Emoji-specific overlays: tears, laser eyes, angry brows, blush, sweat drop, sparkle, heart eyes, sunglasses, party hat, speech bubble, thumbs up, white/black outline

### AI Command Bar

- Natural language commands: "make this cuter", "add sunglasses", "turn this into pixel art", "remove the background"

### Preview

- Show finalized emoji next to other emojis for size/style comparison

### Export

- Export to multiple image formats (PNG, GIF, WebP)
