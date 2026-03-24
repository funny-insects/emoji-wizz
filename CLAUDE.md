# Emoji Wizz

Visual editor for creating custom emojis optimized for Slack, Discord, and other platforms. Users import images, resize/position them on a canvas, and export platform-ready emoji files. Built with React, TypeScript, and Konva.js for 2D canvas rendering.

## Commands

Use `task` commands (defined in Taskfile.yml) for lint/test/format — not raw npx.

- `npm run dev` — start dev server (localhost:5173)
- `npm run build` — typecheck + production build
- `task lint` — ESLint
- `task typecheck` — TypeScript type checking
- `task test` — Vitest unit tests
- `task test:e2e` — Playwright e2e tests
- `task format` — format with Prettier
- `task format:check` — check formatting

## Verifying changes

Run `task lint`, `task typecheck`, and `task test` to verify changes. Pre-commit hooks enforce linting and formatting automatically — do not skip them.

## Codebase orientation

- `src/components/` — React components (canvas editor, controls, panels)
- `src/utils/` — shared logic (presets, image processing, export)
- `src/hooks/` — custom React hooks
- `e2e/` — Playwright end-to-end tests
- Tests are colocated with source files (`*.test.ts` / `*.test.tsx`)
