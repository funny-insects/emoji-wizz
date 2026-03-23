# Task 5.0 Proof Artifacts — CI Pipeline (GitHub Actions)

## File

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches:
      - main

jobs:
  ci:
    name: Lint, Typecheck & Test
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

      - name: Lint
        run: task lint

      - name: Typecheck
        run: task typecheck

      - name: Unit tests
        run: task test
```

## CLI Output

### YAML syntax validation

```
YAML valid
```

## GitHub Secret Scanning

Secret scanning should be enabled at: **Settings → Code security → Secret scanning → Enable**.

This ensures GitHub automatically scans all commits for accidentally committed API keys, tokens, and credentials and alerts repository owners.

## Verification

| Proof Artifact                                    | Status |
| ------------------------------------------------- | ------ |
| `.github/workflows/ci.yml` exists                 | ✅     |
| Triggered on PRs to `main`                        | ✅     |
| Node 22 setup via `actions/setup-node@v4`         | ✅     |
| `npm ci` install step                             | ✅     |
| Task runner installed via `arduino/setup-task@v2` | ✅     |
| `task lint` step                                  | ✅     |
| `task typecheck` step                             | ✅     |
| `task test` step                                  | ✅     |
| YAML syntax valid                                 | ✅     |
| Secret scanning documented                        | ✅     |
