# Engineering Process

## Branching Strategy

We used **trunk-based development**. `main` is the trunk and is branch-protected — direct pushes are not allowed. All changes go through a pull request.

Developers create short-lived feature branches off `main`, typically scoped to a single feature or bug fix. Once the work is done, they open a PR against `main`. The PR must pass CI and receive at least one approval before it can be merged. Branches are deleted after merging.

This keeps the history linear and the feedback loop short — no long-lived feature branches, no merge hell.

---

## Environments

### Development

Each developer's local machine is the development environment. No cloud resources are needed — the app is entirely client-side (no backend).

Setup:

```bash
nvm use          # pins to Node 22 via .nvmrc
npm install
npm run dev      # starts Vite dev server at localhost:5173
```

### Production

Production runs on **AWS App Runner** in `us-east-1`. The infrastructure was provisioned by running `scripts/aws-setup.sh`, which is an idempotent script that created all required AWS resources from scratch:

1. **ECR repository** (`emoji-wizz`) — private Docker image registry, with a lifecycle policy to retain the last 10 images
2. **App Runner ECR access role** — IAM role that allows App Runner to pull images from ECR
3. **GitHub Actions OIDC role** — IAM role that GitHub Actions assumes via OIDC federation (no long-lived AWS credentials stored in GitHub)
4. **App Runner service** — runs the containerized app at 0.25 vCPU / 0.5 GB memory, with HTTP health checks on `/`

After running the script, three values were added to the GitHub repository:

- Secret `AWS_ROLE_ARN` — ARN of the GitHub Actions OIDC role
- Variable `AWS_ACCOUNT_ID` — 12-digit AWS account ID
- Variable `AWS_REGION` — `us-east-1`

---

## CI/CD Pipeline

### CI — Pull Requests (`ci.yml`)

GitHub Actions runs the CI workflow on every pull request to `main`. The PR cannot be merged until all checks pass.

| Step       | Command              | What it checks                               |
| ---------- | -------------------- | -------------------------------------------- |
| Lint       | `task lint`          | ESLint across `src/` — zero warnings allowed |
| Typecheck  | `task typecheck`     | TypeScript types via `tsc --noEmit`          |
| Unit tests | `task test:coverage` | Vitest unit tests with coverage report       |
| E2E tests  | `task test:e2e`      | Playwright tests against the dev server      |

The CI job also posts a coverage summary comment directly on the PR (lines, functions, branches) so reviewers can see it without leaving GitHub.

### CD — Deploy on Merge (`deploy.yml`)

When a PR is merged to `main`, the deploy workflow runs automatically:

1. **CI gate** — lint, typecheck, and unit tests run again to ensure the merged code is clean
2. **Build** — Docker image is built from the repo
3. **Push** — image is tagged with the short commit SHA and `latest`, then pushed to ECR
4. **Deploy** — App Runner is instructed to pull the new image and deploy it
5. **Smoke test** — waits up to 10 minutes for the production URL to return HTTP 200
6. **Production E2E tests** — Playwright tests run against the live production URL to verify the deployment

If the smoke test fails, the workflow logs the App Runner operation status to help diagnose what went wrong.

---

## Project Management Integration with CI

We used **GitHub Projects** to track issues and work. The integration with CI is built into GitHub's pull request workflow:

- Every feature or fix starts as a GitHub Issue on the project board
- When a developer opens a PR, they reference the issue in the PR description (e.g., `Closes #42`)
- When the PR's CI passes and the PR is merged to `main`, GitHub automatically closes the linked issue and moves the card to **Done** on the project board

This means a card only reaches Done when code has passed linting, typechecking, and tests — the project board reflects real, verified delivery, not just someone moving a card manually.

---

## Build, Test, and Run

### Building

```bash
npm run build    # type-checks with tsc, then bundles with Vite into dist/
```

In the CD pipeline, the `dist/` output is packaged into a Docker image (via `Dockerfile`) and pushed to ECR.

### Testing

| Command                                                  | Type                   | When it runs               |
| -------------------------------------------------------- | ---------------------- | -------------------------- |
| `task lint`                                              | Static analysis        | Pre-commit hook + CI       |
| `task typecheck`                                         | Type checking          | Pre-commit hook + CI       |
| `task test`                                              | Unit tests (Vitest)    | CI on every PR and deploy  |
| `task test:e2e`                                          | E2E tests (Playwright) | CI on every PR             |
| `npx playwright test --config playwright.prod.config.ts` | Production E2E tests   | Post-deploy in CD pipeline |

Pre-commit hooks (via Husky + lint-staged) run ESLint and Prettier automatically on every `git commit`, blocking the commit if there are lint errors.

### Running

**Locally:**

```bash
npm run dev      # localhost:5173
```

**In production:** App Runner pulls the Docker image from ECR and serves it. Deployments are triggered automatically by the CD pipeline on every merge to `main`.
