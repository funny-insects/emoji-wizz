# Task 3.0 Proof Artifacts — Add Parallel E2E Job to CI

## Configuration Changes

### playwright.config.ts — reporter updated

Before:

```ts
reporter: "list",
```

After:

```ts
reporter: [["list"], ["html", { open: "never" }]],
```

### ci.yml — workflow_dispatch added

```yaml
on:
  pull_request:
    branches:
      - main
  workflow_dispatch: {}
```

### ci.yml — e2e job added (parallel, no `needs` dependency)

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest

  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: "22"
        cache: "npm"

    - name: Install dependencies
      run: npm ci

    - name: Install Task
      uses: arduino/setup-task@v2
      with:
        version: 3.x
        repo-token: ${{ secrets.GITHUB_TOKEN }}

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: E2E tests
      run: task test:e2e

    - name: Upload Playwright report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

## Local HTML Report Verification

`task test:e2e` was run locally with the updated `playwright.config.ts`. The HTML report was generated at the expected path:

```
$ ls playwright-report/
data/
index.html
```

`playwright-report/index.html` exists, confirming the HTML reporter is correctly configured with `open: "never"` (no browser auto-opened).

Note: 8 pre-existing test failures were observed locally — these are unrelated to this task and tracked separately on the `improve_tests` branch.

## Verification Notes

- The `e2e` job has no `needs:` key — it runs in parallel with the `ci` job.
- `workflow_dispatch: {}` is at the top-level `on` block, allowing manual re-runs from the GitHub Actions UI.
- The `Upload Playwright report` step uses `if: failure()` — it only uploads when the E2E job fails, keeping artifact storage clean.
- `playwright-report/` is already in `.gitignore` — the local report directory is not committed.
- Sub-task 3.5 (screenshot of parallel jobs in Actions UI) to be captured when this branch is pushed and a PR is opened against `main`.
