# Emoji Wizz (pronounced EMO JEE WIZZ)

Internal tool for creating custom emojis that look great in Slack.

## Quick Start

**Prerequisites:** Node 22 LTS, [Task](https://taskfile.dev/)

```bash
nvm use            # uses .nvmrc → Node 22
npm install        # install dependencies
npm run dev        # start dev server at localhost:5173
```

## File Structure

```
src/
  components/    # React components
  hooks/         # Custom React hooks
  services/      # API and external service integrations
  utils/         # Shared utility functions
  assets/        # Static assets (images, fonts, etc.)
```

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
