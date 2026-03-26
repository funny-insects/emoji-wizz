# 14-spec-post-deploy-testing

## Introduction/Overview

After a successful deployment to AWS App Runner, there is currently no automated verification that the production application is healthy. This feature adds a post-deployment testing stage to the GitHub Actions deploy workflow: a fast `curl`-based smoke test confirms the app is reachable, followed by a dedicated Playwright E2E suite that validates critical production behavior. If either stage fails, the pipeline automatically rolls back to the previous App Runner image.

## Goals

- Detect broken production deployments within minutes of release, before users are affected.
- Provide a fast (~2s) smoke test that confirms the deployed app returns HTTP 200.
- Run a curated set of Playwright E2E tests against the live production URL to verify core functionality.
- Automatically roll back to the previous working deployment if smoke or E2E tests fail.
- Keep the post-deploy testing stage self-contained so it can be extended with new production tests over time.

## User Stories

- **As a developer**, I want the deploy pipeline to automatically verify that the production app is healthy after deployment so that I know a broken release will be caught and rolled back without manual intervention.
- **As a developer**, I want a dedicated `e2e/prod/` test folder so that I can write production-specific tests separately from local development tests.
- **As a developer**, I want to see clear reporting when a deployment fails post-deploy checks so that I can quickly diagnose what went wrong.

## Demoable Units of Work

### Unit 1: Smoke Test with Deployment Wait

**Purpose:** Verify the deployed application is reachable via HTTP after App Runner finishes deploying. Uses `curl` to poll the production URL, with a fallback to query AWS deployment status on timeout.

**Functional Requirements:**

- The deploy workflow shall query the App Runner service URL dynamically from AWS after the deploy step completes.
- The workflow shall run `curl --retry <count> --retry-delay <seconds> --max-time 600` against the production root URL (`/`) to wait for the deployment to become available.
- If `curl` receives an HTTP 200 response, the smoke test shall pass.
- If `curl` times out (600s), the workflow shall query the App Runner deployment status via AWS CLI, log the status, and fail the job.
- The smoke test shall run as a step within a new `post-deploy` job in the deploy workflow, which depends on the existing `deploy` job.

**Proof Artifacts:**

- GitHub Actions log: Successful smoke test showing `curl` receiving HTTP 200 from the production URL demonstrates deployment health verification works.
- GitHub Actions log: Timeout scenario showing AWS deployment status query and job failure demonstrates the fallback error reporting works.

### Unit 2: Production E2E Tests with Playwright

**Purpose:** Run a curated set of Playwright tests against the live production URL to verify core application behavior beyond a simple health check.

**Functional Requirements:**

- A new Playwright config file (`playwright.prod.config.ts`) shall be created that targets the production URL (passed via environment variable), disables the local `webServer`, and points to the `e2e/prod/` test directory.
- A new `e2e/prod/` directory shall contain production-specific Playwright tests.
- Production E2E tests shall verify at minimum: the app loads, the canvas element renders, and the preset selector is functional.
- The production E2E tests shall run as a step in the `post-deploy` job, after the smoke test passes.
- A new `task test:e2e:prod` command shall be added to `Taskfile.yml` to allow running production E2E tests locally (requires `PROD_URL` env var).

**Proof Artifacts:**

- GitHub Actions log: Playwright test results passing against the live production URL demonstrates production E2E verification works.
- Local run: `PROD_URL=<url> task test:e2e:prod` executes the production tests locally demonstrates developer workflow works.

### Unit 3: Automatic Rollback on Failure

**Purpose:** If the smoke test or E2E tests fail, automatically roll back the App Runner service to the previous image tag so that users are not left on a broken deployment.

**Functional Requirements:**

- Before deploying the new image, the `deploy` job shall record the current (pre-deploy) image tag (e.g., the short SHA of the previous commit) and pass it as a job output.
- The `post-deploy` job shall accept the previous image tag as an input.
- If any step in the `post-deploy` job fails, a rollback step shall trigger: it re-tags the previous image as `latest` in ECR and triggers a new App Runner deployment with the previous image.
- The rollback step shall use `if: failure()` so it only runs when preceding steps fail.
- The workflow shall log clearly whether a rollback was triggered and whether the rollback deployment was initiated successfully.
- After the rollback deployment completes, the workflow shall re-run the smoke test against the production URL to verify the rollback was successful.
- If the post-rollback smoke test fails, the workflow shall log an error indicating the rollback did not restore a healthy state.

**Proof Artifacts:**

- GitHub Actions log: Rollback step executing after a failed E2E test, showing the previous image being redeployed demonstrates automatic rollback works.
- GitHub Actions log: Post-rollback smoke test passing demonstrates the rollback restored a healthy deployment.
- GitHub Actions log: Rollback step skipped on a successful deployment demonstrates rollback only triggers on failure.

## Non-Goals (Out of Scope)

1. **Visual regression testing**: No screenshot comparison or visual diff tooling will be added.
2. **Load/performance testing**: This spec covers functional correctness only, not production load testing.
3. **Monitoring/alerting integration**: No Slack notifications, PagerDuty, or other alerting beyond GitHub Actions job status.
4. **Modifying existing local E2E tests**: The tests in `e2e/` remain unchanged; production tests live in `e2e/prod/`.
5. **Health check endpoint**: We will test the root URL (`/`) as-is — no new server-side health endpoint will be added.

## Design Considerations

No specific design requirements identified. All changes are to CI/CD pipeline configuration and test infrastructure.

## Repository Standards

- Use `task` commands (defined in `Taskfile.yml`) for test/lint operations — not raw `npx`.
- Follow existing Playwright test patterns in `e2e/` for test structure and assertions.
- Workflow YAML follows the existing conventions in `.github/workflows/deploy.yml` (job naming, step naming, OIDC auth pattern).
- Pre-commit hooks enforce linting and formatting — all new files must pass `task lint` and `task format:check`.

## Technical Considerations

- **App Runner URL discovery**: The production URL must be queried dynamically via `aws apprunner list-services` (consistent with how the deploy job already queries the service ARN). The service URL is available in the `ServiceUrl` field.
- **Playwright in CI**: The `post-deploy` job needs Node.js and Playwright browsers installed. Use the same Node 22 + `npm ci` + `npx playwright install --with-deps chromium` pattern.
- **Environment variable for prod URL**: The Playwright prod config reads from `PROD_URL` env var. The workflow sets this from the dynamically queried App Runner URL.
- **Rollback mechanism**: App Runner deployments are triggered by `aws apprunner start-deployment`. Rollback works by pushing the previous image tag as `latest` to ECR and triggering a new deployment. The previous image tag must be captured before the new image is pushed.
- **curl retry strategy**: Use `curl --retry 30 --retry-delay 20 --retry-all-errors --max-time 600 -sf` to poll the production URL. The `--retry-all-errors` flag ensures retries on connection failures (not just HTTP errors), and `-sf` suppresses output on success while failing on HTTP errors.

## Security Considerations

- The `post-deploy` job requires the same OIDC AWS credentials as the `deploy` job (for querying App Runner and ECR).
- No new secrets are introduced — the existing `AWS_ROLE_ARN` secret and `AWS_ACCOUNT_ID`/`AWS_REGION` variables are sufficient.
- The rollback step has write access to ECR (re-tagging images) and App Runner (triggering deployments) — this is the same permission scope as the existing deploy job.

## Success Metrics

1. **Broken deployments are detected automatically**: Any deployment that fails the smoke test or E2E suite triggers a rollback without manual intervention.
2. **Post-deploy stage completes within 10 minutes**: Smoke test + E2E tests finish in a reasonable time after deployment.
3. **Zero false positives in the first 2 weeks**: The post-deploy tests are reliable and don't fail spuriously.

## Open Questions

No open questions at this time. (Resolved: IAM permissions likely already sufficient since the deploy job calls `list-services`/`start-deployment`; rollback will re-run the smoke test to verify health.)
