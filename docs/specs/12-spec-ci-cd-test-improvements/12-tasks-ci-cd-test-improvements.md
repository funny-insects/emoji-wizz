# 12 Tasks - CI/CD Test Improvements

## Relevant Files

- `.github/workflows/ci.yml` - Main CI workflow; gains `workflow_dispatch`, coverage step, and the new `e2e` job.
- `vitest.config.ts` - Gains a `coverage` block specifying provider, reporters, and output directory.
- `Taskfile.yml` - Gains a new `test:coverage` task that passes `--coverage` to Vitest.
- `playwright.config.ts` - Reporter updated from `'list'` to include the HTML reporter.

### Notes

- Run `task test:coverage` locally after Task 1.0 to confirm the `coverage/` directory and `coverage-summary.json` are generated before moving to Task 2.0.
- The `workflow_dispatch` trigger in Task 3.0 is added to the top-level `on` block of `ci.yml`, not inside a job.
- Follow existing `ci.yml` patterns for steps: checkout → Node 22 → `npm ci` → install Task → run commands.
- `coverage/` and `playwright-report/` are already in `.gitignore` — no changes needed there.

## Tasks

### [x] 1.0 Configure Code Coverage Locally

#### 1.0 Proof Artifact(s)

- CLI: `task test:coverage` runs successfully and prints a coverage summary to the terminal demonstrates coverage tooling is wired up locally
- File: `coverage/coverage-summary.json` exists after running `task test:coverage` demonstrates the JSON report is generated (needed by the CI comment step)

#### 1.0 Tasks

- [x] 1.1 Open `vitest.config.ts` and add a `coverage` property inside the `test` object with the following settings:
  - `provider: 'v8'`
  - `reporter: ['text', 'json-summary']`
  - `reportsDirectory: './coverage'`
- [x] 1.2 Open `Taskfile.yml` and add a new `test:coverage` task after the existing `test` task:
  ```yaml
  test:coverage:
    desc: Run Vitest unit tests with coverage
    cmds:
      - npx vitest run --coverage
  ```
- [x] 1.3 Run `task test:coverage` locally and confirm it completes without errors, prints a text coverage table to the terminal, and creates a `coverage/coverage-summary.json` file.

---

### [x] 2.0 Add Coverage Reporting to CI with PR Comment

#### 2.0 Proof Artifact(s)

- Screenshot: PR comment on a test pull request showing a formatted coverage summary table (lines %, functions %, branches %) demonstrates the automated comment is posted by CI
- CI log: `Unit tests (with coverage)` step completing successfully in the GitHub Actions run demonstrates coverage runs in CI without failing the build

#### 2.0 Tasks

- [x] 2.1 Open `.github/workflows/ci.yml` and add a top-level `permissions` block to the `ci` job (below `runs-on`) to allow writing PR comments:
  ```yaml
  permissions:
    contents: read
    pull-requests: write
  ```
- [x] 2.2 In the `ci` job, rename the existing `Unit tests` step to `Unit tests (with coverage)` and change its command from `task test` to `task test:coverage`.
- [x] 2.3 Add a new step after the coverage step that uses `actions/github-script` to read `coverage/coverage-summary.json` and post a PR comment. The step should:
  - Only run when the workflow is triggered by a `pull_request` event (use `if: github.event_name == 'pull_request'`)
  - Read `coverage/coverage-summary.json` using `require('fs').readFileSync`
  - Extract `total.lines.pct`, `total.functions.pct`, and `total.branches.pct`
  - Post a markdown comment to the PR via `github.rest.issues.createComment` with the repo owner, repo name, PR number (`context.issue.number`), and a formatted body showing the three percentages in a table
- [x] 2.4 Push the branch and open a draft PR targeting `main`. Confirm in the Actions tab that the `ci` job passes and that a coverage comment appears on the PR.

---

### [ ] 3.0 Add Parallel E2E Job to CI

#### 3.0 Proof Artifact(s)

- Screenshot: GitHub Actions workflow run showing both the `ci` job and the new `e2e` job running in parallel demonstrates the separate job structure
- Screenshot: `playwright-report` artifact visible and downloadable on a failed E2E run in GitHub Actions demonstrates the upload-on-failure behaviour
- CI log: `task test:e2e` passing on the `e2e` job demonstrates E2E tests execute successfully in CI

#### 3.0 Tasks

- [ ] 3.1 Open `playwright.config.ts` and change the `reporter` field from `'list'` to an array that includes both the list reporter and the HTML reporter with `open: 'never'`:
  ```ts
  reporter: [['list'], ['html', { open: 'never' }]],
  ```
- [ ] 3.2 Open `.github/workflows/ci.yml` and add `workflow_dispatch: {}` to the top-level `on` block alongside the existing `pull_request` trigger.
- [ ] 3.3 Add a new job named `e2e` to `ci.yml` at the same level as the existing `ci` job (no `needs` dependency — they run in parallel). The job should use `runs-on: ubuntu-latest` and include these steps in order:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` with `node-version: '22'` and `cache: 'npm'`
  3. `npm ci`
  4. `arduino/setup-task@v2` with `version: 3.x` and `repo-token: ${{ secrets.GITHUB_TOKEN }}`
  5. A step named `Install Playwright browsers` that runs `npx playwright install --with-deps chromium`
  6. A step named `E2E tests` that runs `task test:e2e`
  7. A step named `Upload Playwright report` that uses `actions/upload-artifact@v4` with:
     - `if: failure()`
     - `name: playwright-report`
     - `path: playwright-report/`
     - `retention-days: 7`
- [ ] 3.4 Run `task test:e2e` locally to confirm the Playwright HTML report is generated at `playwright-report/index.html` (verifies the config change in 3.1 works).
- [ ] 3.5 Push the branch and confirm in the Actions tab that both the `ci` and `e2e` jobs appear and run in parallel on the PR.
