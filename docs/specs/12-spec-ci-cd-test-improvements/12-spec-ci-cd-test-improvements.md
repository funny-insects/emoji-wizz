# 12-spec-ci-cd-test-improvements.md

## Introduction/Overview

The current CI pipeline runs lint, typecheck, and unit tests but has two significant gaps: code coverage is never measured, and end-to-end (Playwright) tests are never executed in CI. This means PRs can merge with untested user flows and no visibility into how much of the codebase is covered. This spec closes both gaps by wiring up the already-installed coverage tool and adding a dedicated E2E CI job.

## Goals

- Surface unit test coverage on every PR as an automated comment, with no external service dependency.
- Prevent regressions in user flows by running Playwright E2E tests in CI on every PR.
- Keep CI fast by running the E2E job in parallel with the existing lint/typecheck/unit job.
- Make E2E failures easy to debug by uploading Playwright HTML reports as artifacts when tests fail.
- Allow manual re-runs of the E2E job via GitHub's `workflow_dispatch` trigger.

## User Stories

**As a developer opening a PR**, I want to see a coverage summary comment posted automatically so that I can understand the testing impact of my changes without running anything locally.

**As a reviewer**, I want E2E tests to run in CI on every PR so that I can be confident user flows are not broken before merging.

**As a developer debugging a failed E2E run**, I want the Playwright HTML report uploaded as a CI artifact on failure so that I can see exactly which steps and screenshots caused the failure.

## Demoable Units of Work

### Unit 1: Code Coverage Reporting

**Purpose:** Wire up `@vitest/coverage-v8` (already installed), add a `test:coverage` task, and post a coverage summary as a PR comment on every CI run.

**Functional Requirements:**

- The `Taskfile.yml` shall include a new `test:coverage` task that runs Vitest with the `--coverage` flag.
- The `vitest.config.ts` shall include a `coverage` section that enables `provider: 'v8'`, sets `reporter: ['text', 'json-summary']`, and writes output to a `coverage/` directory.
- The existing `ci` job in `.github/workflows/ci.yml` shall run `task test:coverage` instead of (or after) `task test`.
- After tests complete, the CI job shall read the `coverage/coverage-summary.json` file and post a formatted coverage summary as a comment on the PR using `actions/github-script`.
- The coverage comment shall display at minimum: the percentage of lines, functions, and branches covered.
- The CI job shall NOT fail due to coverage percentages — thresholds are not enforced at this time.
- The `coverage/` directory shall be listed in `.gitignore` so generated reports are never committed.

**Proof Artifacts:**

- Screenshot: PR comment showing a formatted coverage summary table on a test PR demonstrates the comment is posted automatically.
- CI log: `task test:coverage` step completing successfully demonstrates coverage runs in CI.

### Unit 2: E2E Tests in CI

**Purpose:** Add a new parallel CI job that installs Playwright browsers and runs the full E2E suite on every PR, uploading an HTML report on failure.

**Functional Requirements:**

- A new job named `e2e` shall be added to `.github/workflows/ci.yml`, running in parallel with the existing `ci` job (no `needs` dependency between them).
- The workflow `on` trigger shall include `workflow_dispatch` in addition to the existing `pull_request` trigger, allowing manual re-runs.
- The `e2e` job shall install Node.js 22, install npm dependencies, and install Playwright browsers using `npx playwright install --with-deps chromium`.
- The `e2e` job shall install Task using `arduino/setup-task@v2` (matching the existing job pattern).
- The `e2e` job shall run `task test:e2e` to execute the Playwright tests.
- The `playwright.config.ts` reporter shall be updated to `[['list'], ['html', { open: 'never' }]]` so an HTML report is always generated locally but never auto-opens.
- On failure of the `e2e` job, the `playwright-report/` directory shall be uploaded as a GitHub Actions artifact using `actions/upload-artifact@v4`, with a retention period of 7 days.
- The artifact upload step shall use `if: failure()` so it only runs when the E2E job fails.

**Proof Artifacts:**

- Screenshot: GitHub Actions workflow run showing both `ci` and `e2e` jobs running in parallel demonstrates the parallel job structure.
- Screenshot: GitHub Actions artifact named `playwright-report` visible on a failed E2E run demonstrates the upload-on-failure behaviour.
- CI log: `task test:e2e` passing on a clean run demonstrates E2E tests execute successfully in CI.

## Non-Goals (Out of Scope)

1. **GitHub Code Scanning / CodeQL**: Security vulnerability scanning is a separate concern and will be handled in a future spec.
2. **Coverage thresholds**: No minimum coverage percentage will be enforced — this spec is about visibility, not gating.
3. **Multi-browser E2E**: Only Chromium is in scope, matching the current `playwright.config.ts`.
4. **Codecov or third-party coverage services**: Coverage stays within GitHub (PR comment), no external account or token required.
5. **Branch protection rules**: Requiring the `e2e` job to pass before merging is a repository settings change outside this spec.

## Design Considerations

No specific UI/UX design requirements. The PR coverage comment should be readable and scannable — a simple markdown table with emoji indicators (e.g. line/function/branch %) is sufficient. No specific branding or formatting template is mandated.

## Repository Standards

- All CI steps use `task <command>` via `arduino/setup-task@v2`, matching the existing `ci` job pattern — the new `test:coverage` task and `e2e` job must follow this convention.
- Node.js version is pinned to `22` in CI, matching the existing job.
- npm dependencies are installed with `npm ci` and cached via `actions/setup-node@v4` with `cache: 'npm'`.
- New task definitions go in `Taskfile.yml` alongside existing tasks (`lint`, `typecheck`, `test`, `test:e2e`).
- Configuration for test tooling goes in `vitest.config.ts` (Vitest) and `playwright.config.ts` (Playwright), not in `package.json`.

## Technical Considerations

- `@vitest/coverage-v8` is already installed as a devDependency — no new package installation is needed for coverage.
- Vitest's `json-summary` reporter produces `coverage/coverage-summary.json`, which `actions/github-script` can read with `fs.readFileSync` to extract totals.
- The Playwright `webServer` in `playwright.config.ts` is already configured with `reuseExistingServer: !process.env.CI`, so in CI it will start the dev server automatically — no separate server step is needed in the E2E job.
- The `playwright-report/` output directory is Playwright's default HTML report location; the `actions/upload-artifact` step targets this path directly.
- `workflow_dispatch` must be added at the top-level `on` block of the workflow file, not inside a specific job.

## Security Considerations

- The `actions/github-script` step that posts the PR comment requires `pull-requests: write` permission. The workflow must declare this via a `permissions` block. The `GITHUB_TOKEN` secret is used automatically — no additional secrets need to be configured.
- No API keys, external tokens, or credentials are introduced by this spec.
- Coverage reports and Playwright artifacts may contain file paths or component names from the codebase but contain no user data or secrets — they are safe to upload as artifacts.

## Success Metrics

1. **Coverage comment**: Every PR to `main` receives an automated coverage summary comment within the CI run time.
2. **E2E in CI**: Zero PRs merge with broken E2E tests without a visible CI failure on the `e2e` job.
3. **Artifact on failure**: When the E2E job fails, a `playwright-report` artifact is available for download within the failed run.
4. **Parallel execution**: Total CI wall time does not increase by more than the E2E test suite duration (the `e2e` job runs in parallel, not sequentially).

## Open Questions

No open questions at this time.
