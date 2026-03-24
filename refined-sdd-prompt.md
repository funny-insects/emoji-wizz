# Emoji Wizz — Spec Prompt

 ## Problem Statement
 Slack workspace members create custom emojis but struggle with Slack's sizing
 constraints (128x128px, <128KB), transparent backgrounds, and visual weight
 matching built-in emojis. The result is emojis that appear too small or
 visually inconsistent with native ones.

 ## Primary User
 Internal Slack workspace members (non-designers) who want to upload custom
 emojis without needing Figma or Photoshop knowledge.

 ## Tech Stack (decided)
 - Frontend: React + TypeScript, Vite
 - Backend: TypeScript (Node/Lambda or App Runner — TBD, but App Runner preferred)
 - Database: DynamoDB (user saved emojis / project state)
 - Infrastructure: AWS App Runner
 - Tooling: Taskfile (build/lint/test), ESLint, Vitest
 - CI: GitHub Actions with type-check, lint, test gates
 - Pre-commit: Husky running Taskfile lint + test
 - Security: GitHub secret scanning, dependency scanning enabled

 ## External Integration
 Company image generation API at https://images.liatr.io/ — use for AI-powered
 emoji generation from text prompts. Treat as a required integration.

 ## MVP Scope (Phase 1)

 ### Smart Canvas
 - Platform presets: Slack (128x128, transparent bg, <128KB), Discord, Apple
 - Preset applies canvas size, margin, background settings automatically

 ### Visual Size Optimizer
 - Detect content bounds within canvas (non-transparent pixel area)
 - Side-by-side preview: user's emoji next to a reference built-in emoji at
  actual Slack display size (~22px)
 - Flag sizing issues with specific suggestions:
  - "Content fills only 40% of canvas — increase by 14%"
  - "Trim X transparent padding"
  - "Add outline to improve readability at small size"
 - One-click auto-fix for each suggestion

 ### Lightweight Editor (MVP tools only)
 Must-have:
 - Crop, resize, rotate
 - Erase / transparent background
 - Brush / pen
 - Outline / stroke
 - Fill / recolor

 Emoji overlays (stickers):
 - Tears, laser eyes, sunglasses, blush, sparkle, heart eyes, party hat,
  speech bubble, white/black outline

 ### AI Command Bar
 - Text input: "make this cuter", "add sunglasses", "remove background",
  "turn into pixel art"
 - Routes to images.liatr.io API with current canvas state as input
 - Shows diff preview before applying

 ### Preview
 - Show finalized emoji at 22px, 44px, and 128px alongside 3 native Slack emojis

 ### Export
 - PNG (transparent), WEBP, GIF (static)
 - Auto-validate against Slack constraints before export (size, dimensions)
 - Direct "Upload to Slack" flow if Slack OAuth is configured (Phase 2)

 ## Phase 2 (out of MVP scope)
 - Slack OAuth for direct upload
 - Save/load emoji projects (DynamoDB)
 - Animation support / GIF frames
 - Advanced editor: text tool, shadow/glow, blur/sharpen, contrast/saturation,
  shape tools, layers

 ## Non-Functional Requirements
 - Canvas operations must feel responsive (<100ms for local edits)
 - AI commands: show loading state, timeout at 10s with fallback error
 - No user accounts in Phase 1 — work is local/session only
 - Mobile: not required, desktop-first

 ## Out of Scope
 - Video/animated emoji in Phase 1
 - Slack workspace admin features
 - Selling or licensing emojis
 - User accounts / auth in Phase 1

 ## Acceptance Criteria (MVP done when)
 1. User can upload an image, apply Slack preset, see size optimizer feedback,
   make at least one suggested fix, and export a valid Slack emoji PNG
 2. AI command bar can process at least "remove background" and "add sunglasses"
   via images.liatr.io
 3. Side-by-side preview shows user emoji next to reference emoji at correct
   relative scale
 4. Export validates file meets Slack constraints and shows error if not

 ---
 Key changes made:
 - Converted "examples" lists into tiered requirements (must-have vs phase 2)
 - Added acceptance criteria — SDD's most important missing piece
 - Committed to tech decisions (App Runner, Vitest, image
