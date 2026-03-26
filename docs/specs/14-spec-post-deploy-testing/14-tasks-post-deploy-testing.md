# 14-tasks-post-deploy-testing

## Relevant Files

- `.github/workflows/deploy.yml` - Main deploy workflow; add `post-deploy` job, modify `deploy` job to capture previous image tag
- `playwright.prod.config.ts` - New Playwright config targeting production URL via `PROD_URL` env var
- `e2e/prod/prod.spec.ts` - New production E2E test suite (app loads, canvas renders, preset selector works)
- `Taskfile.yml` - Add `test:e2e:prod` task for local production E2E test execution
- `playwright.config.ts` - Existing Playwright config (reference for patterns; no modifications needed)
- `e2e/app.spec.ts` - Existing smoke tests (reference for test patterns; no modifications needed)

### Notes

- Use `task` commands (defined in `Taskfile.yml`) for test/lint operations — not raw `npx`.
- Follow existing Playwright test patterns in `e2e/` for test structure and assertions.
- Workflow YAML follows existing conventions in `.github/workflows/deploy.yml` (job naming, step naming, OIDC auth pattern).
- Pre-commit hooks enforce linting and formatting — all new files must pass `task lint` and `task format:check`.
- Production tests live in `e2e/prod/` — existing tests in `e2e/` remain unchanged.

## Tasks

### [x] 1.0 Smoke Test with Deployment Wait

Add a `post-deploy` job to the deploy workflow that queries the App Runner service URL dynamically and uses `curl` to poll the production URL until it returns HTTP 200. If `curl` times out after 600s, query the App Runner deployment status via AWS CLI, log it, and fail the job.

#### 1.0 Proof Artifact(s)

- GitHub Actions Log: Successful `post-deploy` job showing `curl` receiving HTTP 200 from the production URL demonstrates deployment health verification works
- GitHub Actions Log: The `post-deploy` job correctly depends on the `deploy` job and runs after it completes demonstrates job sequencing works
- Diff: `.github/workflows/deploy.yml` showing the new `post-deploy` job with dynamic URL discovery, `curl` retry logic, and AWS CLI fallback demonstrates the smoke test implementation

#### 1.0 Tasks

- [x] 1.1 Add a `post-deploy` job to `.github/workflows/deploy.yml` that depends on the `deploy` job (`needs: deploy`). Configure it with `runs-on: ubuntu-latest` and the same OIDC AWS credentials step used by the `deploy` job (using `aws-actions/configure-aws-credentials@v4` with `secrets.AWS_ROLE_ARN` and `vars.AWS_REGION`).
- [x] 1.2 Add a step named "Get App Runner service URL" that queries the production URL dynamically using `aws apprunner list-services` with `--query "ServiceSummaryList[?ServiceName=='emoji-wizz'].ServiceUrl | [0]"` and stores the result in a `PROD_URL` environment variable (prefixed with `https://`). Echo the URL for log visibility.
- [x] 1.3 Add a step named "Smoke test — wait for healthy deployment" that runs `curl --retry 30 --retry-delay 20 --retry-all-errors --max-time 600 -sf "${PROD_URL}"` to poll the production root URL. On success, echo a confirmation message.
- [x] 1.4 Add a step named "Log deployment status on timeout" with `if: failure()` that runs `aws apprunner list-operations --service-arn <SERVICE_ARN> --region <REGION>` to query and log the App Runner deployment status when the smoke test fails. The service ARN should be queried the same way as in the `deploy` job.
- [ ] 1.5 Push the workflow changes to a branch, trigger a deployment, and verify in GitHub Actions logs that the `post-deploy` job runs after `deploy` and the smoke test passes with HTTP 200.

### [x] 2.0 Production E2E Tests with Playwright

Create a production-specific Playwright configuration and test suite in `e2e/prod/` that runs against the live production URL. Add a `test:e2e:prod` task to `Taskfile.yml` for local execution. Wire the E2E tests into the `post-deploy` job after the smoke test step.

#### 2.0 Proof Artifact(s)

- CLI: `PROD_URL=<url> task test:e2e:prod` executes production tests locally demonstrates developer workflow works
- Diff: `playwright.prod.config.ts` targeting `PROD_URL` env var with `e2e/prod/` test directory and no `webServer` demonstrates production config is correctly separated
- Diff: `e2e/prod/` test files verifying app loads, canvas renders, and preset selector is functional demonstrates minimum production test coverage
- GitHub Actions Log: Playwright test results passing in the `post-deploy` job against the live production URL demonstrates production E2E verification works

#### 2.0 Tasks

- [x] 2.1 Create `playwright.prod.config.ts` in the project root. Model it after the existing `playwright.config.ts` but: set `baseURL` to `process.env.PROD_URL` (throw an error if not set), set `testDir` to `./e2e/prod`, remove the `webServer` section entirely, keep Chromium-only project, keep CI retry/worker settings, and use `list` + `html` reporters.
- [x] 2.2 Create the `e2e/prod/` directory and add `prod.spec.ts` with three tests following existing `e2e/app.spec.ts` patterns: (1) "app loads successfully" — navigate to `/` and verify the page title or a root element is visible; (2) "canvas element renders" — verify `.konvajs-content canvas` is visible; (3) "preset selector is functional" — verify the `select` element is visible and has selectable options.
- [x] 2.3 Add a `test:e2e:prod` task to `Taskfile.yml` with the command `npx playwright test --config playwright.prod.config.ts` and description "Run Playwright production E2E tests (requires PROD_URL env var)".
- [ ] 2.4 Verify the production tests work locally by running `PROD_URL=<your-prod-url> task test:e2e:prod` and confirming all three tests pass.
- [x] 2.5 Add steps to the `post-deploy` job in `.github/workflows/deploy.yml` after the smoke test: (1) "Setup Node.js" using `actions/setup-node@v4` with node-version 22 and npm cache; (2) "Install dependencies" running `npm ci`; (3) "Install Playwright browsers" running `npx playwright install --with-deps chromium`; (4) "Run production E2E tests" running `npx playwright test --config playwright.prod.config.ts` with `PROD_URL` set from the dynamically queried URL.
- [ ] 2.6 Push the changes, trigger a deployment, and verify in GitHub Actions logs that the production E2E tests run and pass in the `post-deploy` job after the smoke test.

### [x] 3.0 Automatic Rollback on Failure

Modify the `deploy` job to capture the pre-deploy image tag and pass it as a job output. Add rollback steps to the `post-deploy` job that trigger on failure: re-tag the previous image as `latest` in ECR, trigger a new App Runner deployment, and re-run the smoke test to verify rollback health.

#### 3.0 Proof Artifact(s)

- Diff: `deploy` job changes showing previous image tag capture and job output demonstrates pre-deploy state is preserved
- Diff: `post-deploy` job rollback steps with `if: failure()` condition showing ECR re-tag, App Runner redeployment, and post-rollback smoke test demonstrates automatic rollback implementation
- GitHub Actions Log: Rollback step skipped on a successful deployment demonstrates rollback only triggers on failure
- GitHub Actions Log: Rollback step executing after a failed test, showing the previous image redeployed and post-rollback smoke test passing demonstrates automatic rollback works end-to-end

#### 3.0 Tasks

- [x] 3.1 Modify the `deploy` job to add an `outputs` section. Before the "Tag and push to ECR" step, add a step named "Capture previous image tag" that queries ECR for the current `latest` image tag using `aws ecr describe-images --repository-name emoji-wizz --image-ids imageTag=latest --query "imageDetails[0].imageTags[?@ != 'latest'] | [0]"` and saves it as a step output (e.g., `previous-tag`). Expose this as a job output `previous-image-tag`.
- [x] 3.2 Update the `post-deploy` job to accept the previous image tag from the `deploy` job output via `needs.deploy.outputs.previous-image-tag`.
- [x] 3.3 Add a step named "Rollback — re-tag previous image as latest" with `if: failure()` that pulls the previous image manifest from ECR using `aws ecr batch-get-image`, then puts the image with the `latest` tag using `aws ecr put-image`. Use the `ECR_REGISTRY` and previous image tag from the deploy job output.
- [x] 3.4 Add a step named "Rollback — trigger App Runner redeployment" with `if: failure()` that queries the App Runner service ARN and runs `aws apprunner start-deployment` to trigger a redeployment with the rolled-back image. Log the operation ID.
- [x] 3.5 Add a step named "Rollback — verify healthy deployment" with `if: failure()` that re-runs the same `curl` smoke test (`curl --retry 30 --retry-delay 20 --retry-all-errors --max-time 600 -sf "${PROD_URL}"`) to verify the rolled-back deployment is healthy. Log success or failure clearly.
- [ ] 3.6 Push the changes and verify in GitHub Actions logs on a successful deployment that all rollback steps are skipped (shown as skipped due to `if: failure()` condition).
