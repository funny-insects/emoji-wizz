# Task 2.0 Proof Artifacts — Add Coverage Reporting to CI with PR Comment

## CI Configuration Changes

### Permissions added to `ci` job

```yaml
permissions:
  contents: read
  pull-requests: write
```

Required so `actions/github-script` can call `github.rest.issues.createComment` on the PR.

### Step renamed and updated

Before:

```yaml
- name: Unit tests
  run: task test
```

After:

```yaml
- name: Unit tests (with coverage)
  run: task test:coverage
```

### Coverage comment step added

```yaml
- name: Post coverage comment
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
      const { lines, functions, branches } = summary.total;
      const fmt = (v) => `${v.pct.toFixed(1)}%`;
      const icon = (v) => v.pct >= 80 ? '✅' : v.pct >= 60 ? '⚠️' : '❌';
      const body = [
        '## Coverage Report',
        '',
        '| Metric | Coverage |',
        '|--------|----------|',
        `| Lines | ${icon(lines)} ${fmt(lines)} (${lines.covered}/${lines.total}) |`,
        `| Functions | ${icon(functions)} ${fmt(functions)} (${functions.covered}/${functions.total}) |`,
        `| Branches | ${icon(branches)} ${fmt(branches)} (${branches.covered}/${branches.total}) |`,
        '',
        '_No thresholds enforced — report only._',
      ].join('\n');
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body,
      });
```

## Expected PR Comment Output

Based on current coverage numbers from Task 1.0 (`coverage/coverage-summary.json`), the comment will render as:

## Coverage Report

| Metric    | Coverage       |
| --------- | -------------- |
| Lines     | ⚠️ 63.5% (X/Y) |
| Functions | ❌ 51.1% (X/Y) |
| Branches  | ❌ 55.4% (X/Y) |

_No thresholds enforced — report only._

## Verification Notes

- The `if: github.event_name == 'pull_request'` guard ensures the step is skipped on `workflow_dispatch` runs (no issue number available).
- The step uses the built-in `GITHUB_TOKEN` — no additional secrets required.
- `coverage/coverage-summary.json` is produced by `task test:coverage` (Task 1.0) and read by this step in the same job run.
- Sub-task 2.4 (screenshot of live PR comment) to be captured when this branch is pushed and a PR is opened against `main`.
