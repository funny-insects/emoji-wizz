# 12 Questions Round 1 - CI/CD Test Improvements

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Code Coverage Upload Destination

Where should coverage reports be published after each CI run?

- [ ] (A) Codecov — free for public repos, shows coverage diff badges and PR comments automatically
- [ ] (B) GitHub Actions artifact only — upload the HTML report as a downloadable artifact on each run (no external service needed)
- [x] (C) PR comment via `actions/github-script` — post a coverage summary comment directly on the PR (no external service, stays in GitHub)
- [ ] (D) Both (C) a PR comment and (B) an artifact for the full HTML report
- [ ] (E) Other (describe)

## 2. Coverage Thresholds

Should the CI build fail if coverage drops below a threshold? If yes, what thresholds make sense given the current codebase?

- [x] (A) No thresholds yet — just report coverage without failing the build
- [ ] (B) Fail if overall coverage drops below 50% (a starting baseline)
- [ ] (C) Fail if overall coverage drops below 80% (a stricter target)
- [ ] (D) Custom thresholds — I'll specify lines/functions/branches separately (describe below)
- [ ] (E) Other (describe)

## 3. GitHub Code Scanning (CodeQL)

As clarified above, GitHub Code Scanning is a _security_ tool (finds vulnerabilities), separate from coverage. Do you want to include it in this spec?

- [ ] (A) Yes — add a CodeQL workflow that runs on PRs and scans for security vulnerabilities in TypeScript/JavaScript
- [x] (B) No — keep this spec focused on coverage + E2E; security scanning is a separate concern for later
- [ ] (C) Yes, but as a separate spec — I want to scope it properly on its own

## 4. E2E Artifact Uploads

When should Playwright HTML reports be uploaded as CI artifacts?

- [x] (A) Only on failure — keeps artifact storage clean, uploads the report when tests fail so you can debug
- [ ] (B) Always — upload on every run regardless of pass/fail
- [ ] (C) Only on failure, plus always upload the trace files
- [ ] (D) Other (describe)

## 5. E2E CI Trigger Behaviour

Should the E2E job run on every PR, or only under certain conditions?

- [ ] (A) Every PR to `main` — same trigger as the existing CI job
- [x] (B) Every PR to `main`, but allow manual re-runs via `workflow_dispatch`
- [ ] (C) Only when files in `e2e/` or `src/` change (path filtering to save CI minutes)
- [ ] (D) Other (describe)

## 6. E2E Job Structure

Should the E2E tests run in the same CI job as lint/typecheck/unit tests, or as a separate job?

- [x] (A) Separate job — runs in parallel with the existing `ci` job, faster overall wall time
- [ ] (B) Separate job — runs _after_ the existing `ci` job passes (unit tests must pass before E2E runs)
- [ ] (C) Same job — add steps to the existing `ci` job (simpler but slower and all-or-nothing)
- [ ] (D) Other (describe)
