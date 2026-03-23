# 01 Questions Round 1 - Project Foundation

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. React Framework / Bundler

What tool should scaffold and bundle the React + TypeScript app?

- [x ] (A) Vite — fast dev server, lightweight, modern default for SPAs
- [ ] (B) Create React App — legacy, widely known but slow and no longer maintained
- [ ] (C) Next.js — SSR/SSG framework, more than needed for an internal tool but feature-rich
- [ ] (D) Other (describe)

## 2. Package Manager

Which package manager should the project use?

- [ x] (A) npm — ships with Node, no extra install
- [ ] (B) yarn (v1 classic) — deterministic lockfile, widely used
- [ ] (C) pnpm — fast, disk-efficient, strict dependency resolution
- [ ] (D) Other (describe)

## 3. Node Version

What Node.js version should the project target?

- [ ] (A) Node 20 LTS (Active LTS, widely supported)
- [x ] (B) Node 22 LTS (Current LTS, latest features)
- [ ] (C) No preference / latest LTS at time of setup
- [ ] (D) Other (describe)

## 4. Linting & Formatting

What linting and formatting tools should be configured?

- [ x] (A) ESLint + Prettier — ESLint for code quality, Prettier for formatting (industry standard)
- [ ] (B) Biome — single tool for both linting and formatting, fast, newer
- [ ] (C) ESLint only — formatting via ESLint rules
- [ ] (D) Other (describe)

## 5. Testing Framework

What testing framework should be used?

- [ ] (A) Vitest — fast, native Vite integration, Jest-compatible API
- [ ] (B) Jest — mature, widely used, large ecosystem
- [ x] (C) Both Vitest (unit) + Playwright/Cypress (e2e) — if you want e2e included in foundation
- [ ] (D) Other (describe)

## 6. Pre-commit Hook Tool

How should pre-commit hooks be managed?

- [ x] (A) Husky + lint-staged — Husky manages git hooks, lint-staged runs linters on staged files only
- [ ] (B) lefthook — single binary, fast, no Node dependency for hooks
- [ ] (C) Simple shell script in .git/hooks — manual, no dependency
- [ ] (D) Other (describe)

## 7. CI Platform

What CI platform should run type checking, linting, and tests?

- [x ] (A) GitHub Actions — native to GitHub, free for public repos
- [ ] (B) Other CI (Jenkins, CircleCI, etc.) — describe which one
- [ ] (C) No CI in this spec — defer to a later spec

## 8. Deployment Scaffold

Should this foundation spec include any AWS App Runner / Docker setup, or save that for later?

- [x ] (A) Include a basic Dockerfile + App Runner config — so the app is deployable from day one
- [ ] (B) Dockerfile only — containerize but defer App Runner config
- [ ] (C) Neither — defer all deployment to a later spec
- [ ] (D) Other (describe)

## 9. DynamoDB in Foundation

Should DynamoDB setup (table definitions, local dev with DynamoDB Local) be part of this spec, or deferred?

- [ ] (A) Include basic DynamoDB table setup + local dev config — so the data layer is ready
- [ ] (B) Defer entirely — no database until a feature needs it
- [ x] (C) Other (describe) scrap dynamo db. no loner using. update readme accordingly

## 10. Directory Structure

Any preferences for source code organization?

- [ ] (A) Feature-based — `src/features/canvas/`, `src/features/editor/`, etc.
- [x ] (B) Layer-based — `src/components/`, `src/hooks/`, `src/services/`, etc.
- [ ] (C) Hybrid — top-level layers with feature folders inside components
- [ ] (D) No preference — I'll trust your recommendation
- [ ] (E) Other (describe)

## 11. Proof Artifacts

What would convince you that the foundation is "done" and ready for feature work?

- [ ] (A) App runs locally with `npm run dev` (or equivalent) showing a placeholder page
- [ ] (B) CI pipeline passes (lint + typecheck + tests) on a PR
- [ ] (C) Pre-commit hooks block a bad commit (e.g., lint error)
- [ ] (D) Taskfile commands work (`task lint`, `task test`, `task typecheck`)
- [ x] (E) All of the above
- [ ] (F) Other (describe)
