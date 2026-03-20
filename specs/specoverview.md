# Emoji Wizz — Product Overview & Spec Roadmap

## Use Case

Internal tool for our Slack workspace to create custom emojis.

**Core problem:** Custom emojis often look too small or lack transparent backgrounds when uploaded to Slack.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | TypeScript + React |
| Database | DynamoDB |
| Deployment | AWS App Runner |
| Task runner | Taskfile (lint, test, typecheck) |
| Pre-commit | Run tasks + tests before commits |
| CI | Type checking, linting, tests |
| Security | GitHub secret scanning |

## Open Decisions

- **Auth**: Is this internal-only (no login) or do users need accounts to save emoji history?
- **DynamoDB usage**: What gets persisted? Saved projects? Export history? User preferences?
- **`images.liatr.io`**: Internal AI image generation service — how does it integrate? Text-to-image? What API does it expose?
- **Deployment**: App Runner selected, but ECS is an alternative if needed.

## Feature Overview

### Smart Emoji Canvas
- Platform-aware presets (canvas size, margins, contrast, background transparency)
- Presets: Slack, Discord, Apple custom emojis

### Visual Size Optimizer
- Detects bounds of emoji subject
- Side-by-side preview vs. built-in emoji (e.g., shows custom pink emoji next to default yellow one)
- Suggests fixes:
  - "Increase face size by 14%"
  - "Trim transparent padding"
  - "Boost outline for readability"
  - "Simplify details for small display"

### Lightweight Editor
**General tools:** crop, resize, rotate, erase background, brush/pen, text, outline/stroke, shadow/glow, sticker layers, shape tools, blur/sharpen, contrast/saturation, fill/recolor, transparent background support

**Emoji-specific overlays:** tears, laser eyes, angry brows, blush, sweat drop, sparkle, heart eyes, sunglasses, party hat, speech bubble, thumbs up, white/black outline

### AI Command Bar
Natural language editing commands:
- "make this cuter"
- "add sunglasses"
- "turn this into pixel art"
- "remove the background"

Potentially powered by `images.liatr.io` internal service.

### Preview
Show finalized emoji next to other emojis for size and style comparison.

### Export
Export to multiple image formats (PNG, GIF, WebP) ready for Slack upload.

---

## Suggested Spec Build Order

| # | Spec | Why First |
|---|------|-----------|
| 01 | **Project Foundation** | Repo setup, tech stack, tooling, CI/CD |
| 02 | **Smart Emoji Canvas** | Core editing surface everything else builds on |
| 03 | **Platform Presets** | Slack/Discord/Apple sizing rules |
| 04 | **Lightweight Editor** | General editing tools |
| 05 | **Emoji Overlays** | Emoji-specific stickers/effects |
| 06 | **Visual Size Optimizer** | Sizing analysis + suggestions |
| 07 | **Export** | Output to file formats |
| 08 | **AI Command Bar** | Natural language editing |
