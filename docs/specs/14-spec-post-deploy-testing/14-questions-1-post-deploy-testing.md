# 14 Questions Round 1 - Post-Deploy Testing

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Production URL Configuration

Where does the production URL come from, and how should the tests reference it?

- [ ] (A) Already exists as a GitHub Actions variable (e.g. `vars.APP_URL`) — just reference it
- [x] (B) It's the App Runner service URL, which can be queried dynamically from AWS during the deploy job
- [ ] (C) I'll add it as a new GitHub Actions variable — just tell me what to name it
- [ ] (D) Other (describe)

## 2. Smoke Test Tool

For the smoke test, I'd recommend a simple `curl`/HTTP check rather than Playwright — it's faster (~2s vs ~30s), has no browser dependency, and answers the core question: "is the app reachable and returning a valid response?" Playwright is better used for the full E2E run that follows. Does this split make sense?

- [x] (A) Yes — use `curl` (or similar HTTP check) for the smoke test, Playwright for the full E2E suite
- [ ] (B) No — keep everything in Playwright; I'd rather have one tool
- [ ] (C) Use Playwright for the smoke test only, skip the full E2E suite against prod
- [ ] (D) Other (describe)

## 3. Which Tests Run Against Production

The current Playwright suite tests canvas interactions, file uploads, brush drawing, text tools, etc. Running all of these against a live production URL is possible but some (e.g. export with file download) may behave differently in a remote context. Which tests should run post-deploy?

- [ ] (A) A small curated subset — just the most critical happy-path tests (e.g. app loads, canvas renders, preset selector works)
- [ ] (B) The full existing Playwright suite, run as-is against the production URL
- [x] (C) Create a new, separate `e2e/prod/` test folder with production-specific tests
- [ ] (D) Other (describe)

## 4. Failure Handling

If the post-deploy smoke test or E2E tests fail, what should happen?

- [ ] (A) Fail the GitHub Actions job — surfaces the failure in the PR/commit status, no automatic rollback
- [x] (B) Fail the job AND attempt an automatic rollback (re-deploy previous image tag in App Runner)
- [ ] (C) Report the failure but don't block — mark the job as a warning/soft failure
- [ ] (D) Other (describe)

## 5. Smoke Test Success Criteria

What should the smoke test verify to consider the deployment successful?

- [x] (A) HTTP 200 response from the root URL (`/`) — page is reachable
- [ ] (B) HTTP 200 response AND the HTML body contains a known string (e.g. `Emoji Wizz` or a specific element)
- [ ] (C) HTTP 200 response AND the app's JS bundle loads without error (checked via Playwright)
- [ ] (D) Other (describe)

## 6. Timing / Wait Strategy

App Runner deployments can take 1–3 minutes after the deployment is triggered. How should the pipeline handle waiting?

- [ ] (A) Add a fixed `sleep` (e.g. 90s) before running tests — simple but imprecise
- [ ] (B) Poll the App Runner service status via AWS CLI until it reaches `RUNNING`, then run tests
- [ ] (C) Poll the production URL with `curl --retry` until it returns 200, then run tests
- [x] (D) Other (describe) `curl --max-time 600` If it times out query AWS for the status of the deployment. Report the status of the deployment then fail the workflow.
