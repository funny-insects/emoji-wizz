# 09-tasks-aws-app-runner-deployment

## Relevant Files

- `Dockerfile` - Existing multi-stage build (Node → nginx). Needs nginx config update for SPA routing.
- `apprunner.yaml` - Existing source-based App Runner config. Will be deleted (replaced by ECR image-based deployment).
- `nginx.conf` - New custom nginx config file for SPA routing (try_files fallback). Copied into Docker image.
- `scripts/aws-setup.sh` - New script to provision all AWS resources (ECR, IAM roles, OIDC provider, App Runner service).
- `scripts/aws-teardown.sh` - New script to remove all AWS resources created by setup.
- `scripts/deploy.sh` - New script to build Docker image, tag with git SHA + latest, authenticate with ECR, and push.
- `.github/workflows/deploy.yml` - New GitHub Actions workflow for automated CD on pushes to `main`.
- `.github/workflows/ci.yml` - Existing CI workflow. Referenced by deploy workflow for pattern consistency.
- `Taskfile.yml` - Existing task definitions. Referenced for CI check commands.

### Notes

- Use `task` commands for lint/test/format as defined in `Taskfile.yml` — not raw `npx`.
- CI workflow pattern: checkout → setup Node 22 → npm ci → install Task → run checks.
- Shell scripts must not hardcode AWS account IDs or sensitive values — accept them as parameters or environment variables.
- All shell scripts should be idempotent (safe to re-run).
- Port 8080 is required for App Runner compatibility.
- Pre-commit hooks enforce linting and formatting via Husky + lint-staged.

## Tasks

### [x] 1.0 Fix Dockerfile for SPA Routing & Remove apprunner.yaml

Update the existing Dockerfile's nginx configuration to handle client-side routing (try_files fallback to `index.html`), and remove the now-unnecessary `apprunner.yaml` since the project is moving to image-based ECR deployment.

#### 1.0 Proof Artifact(s)

- CLI: `docker build -t emoji-wizz .` completes successfully demonstrates multi-stage build works
- CLI: `docker run -p 8080:8080 emoji-wizz` serves the app at `http://localhost:8080` demonstrates nginx serves the SPA
- CLI: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/some/deep/route` returns `200` demonstrates SPA routing fallback works
- Diff: `apprunner.yaml` removed from repository demonstrates cleanup of unused config

#### 1.0 Tasks

- [x] 1.1 Create a custom `nginx.conf` file in the project root that listens on port 8080, sets the root to `/usr/share/nginx/html`, and includes a `try_files $uri $uri/ /index.html` directive for SPA client-side routing fallback
- [x] 1.2 Update the `Dockerfile` Stage 2 (runner) to `COPY nginx.conf /etc/nginx/conf.d/default.conf` instead of using the `sed` commands to modify the default config
- [x] 1.3 Delete the `apprunner.yaml` file from the repository root since image-based ECR deployment replaces source-based deployment
- [x] 1.4 Build and run the Docker image locally (`docker build -t emoji-wizz . && docker run -p 8080:8080 emoji-wizz`) and verify the app loads at `http://localhost:8080` and that deep routes (e.g., `/some/path`) return 200 instead of 404

### [ ] 2.0 AWS Infrastructure Setup Scripts

Create idempotent shell scripts that provision all required AWS resources from scratch: ECR private repository, IAM roles/policies for App Runner and GitHub Actions OIDC, and the App Runner service itself. Include a teardown script to remove all resources.

#### 2.0 Proof Artifact(s)

- CLI: `./scripts/aws-setup.sh` runs without errors and outputs the App Runner service URL demonstrates end-to-end provisioning
- CLI: `aws ecr describe-repositories --repository-names emoji-wizz` returns repository info demonstrates ECR was created
- CLI: `aws apprunner list-services` shows the emoji-wizz service demonstrates App Runner service was created
- CLI: `./scripts/aws-teardown.sh` removes all created resources demonstrates clean teardown

#### 2.0 Tasks

- [ ] 2.1 Create the `scripts/` directory and add `scripts/aws-setup.sh` with a shebang, `set -euo pipefail`, and parameter handling for `--region` (defaulting to `us-east-1`) and `--account-id` (required, no default)
- [ ] 2.2 Add an ECR provisioning section to `aws-setup.sh` that creates a private repository named `emoji-wizz` (skip if it already exists) and adds a lifecycle policy to keep only the last 10 images
- [ ] 2.3 Add an IAM section to `aws-setup.sh` that creates an App Runner ECR access role (`emoji-wizz-apprunner-ecr-role`) with a trust policy for `build.apprunner.amazonaws.com` and attaches the `AWSAppRunnerServicePolicyForECRAccess` managed policy (skip if role already exists)
- [ ] 2.4 Add a GitHub Actions OIDC section to `aws-setup.sh` that creates the IAM OIDC identity provider for `token.actions.githubusercontent.com` (skip if it already exists), then creates an IAM role (`emoji-wizz-github-actions-role`) with a trust policy scoped to the specific GitHub repository, and attaches an inline policy granting ECR push and App Runner `StartDeployment`/`ListServices`/`DescribeService` permissions
- [ ] 2.5 Add an App Runner section to `aws-setup.sh` that creates the App Runner service named `emoji-wizz` using the ECR image URI, the access role from 2.3, port 8080, health check on `/`, and minimal scaling (1 min instance). Skip if service already exists. Output the App Runner service URL on success
- [ ] 2.6 Create `scripts/aws-teardown.sh` that deletes resources in reverse order: App Runner service, IAM roles/policies, OIDC provider (if no other roles use it), and ECR repository (with `--force` to delete images). Each step should gracefully handle resources that don't exist
- [ ] 2.7 Make both scripts executable (`chmod +x`) and test `aws-setup.sh` followed by `aws-teardown.sh` to verify idempotency and clean teardown

### [ ] 3.0 Docker Build & ECR Push Script

Create a deployment script (`scripts/deploy.sh`) that builds the Docker image, authenticates with ECR, tags with git SHA and `latest`, and pushes to the ECR repository. This validates the full local build-and-push flow before automating it in CI.

#### 3.0 Proof Artifact(s)

- CLI: `./scripts/deploy.sh` completes successfully demonstrates build and push pipeline works
- CLI: `aws ecr describe-images --repository-name emoji-wizz` shows images tagged with git SHA and `latest` demonstrates images were pushed correctly
- CLI: App Runner service updates to use the new image demonstrates end-to-end deployment

#### 3.0 Tasks

- [ ] 3.1 Create `scripts/deploy.sh` with a shebang, `set -euo pipefail`, and parameter handling for `--region` (defaulting to `us-east-1`) and `--account-id` (required). Derive the ECR registry URL from the account ID and region
- [ ] 3.2 Add a step that retrieves the current git SHA (`git rev-parse --short HEAD`) to use as the image tag
- [ ] 3.3 Add a step that builds the Docker image with `docker build -t emoji-wizz .`
- [ ] 3.4 Add a step that authenticates with ECR using `aws ecr get-login-password | docker login`
- [ ] 3.5 Add steps that tag the image with both the git SHA and `latest`, then push both tags to the ECR repository
- [ ] 3.6 Add a step that triggers an App Runner deployment using `aws apprunner start-deployment --service-arn <arn>` (fetch the service ARN dynamically via `aws apprunner list-services`)
- [ ] 3.7 Make the script executable and test the full flow: build, push, and verify images appear in ECR with correct tags

### [ ] 4.0 GitHub Actions CD Pipeline

Create a GitHub Actions workflow (`.github/workflows/deploy.yml`) that triggers on pushes to `main`, runs CI checks, builds and pushes the Docker image to ECR using OIDC authentication, and triggers an App Runner deployment.

#### 4.0 Proof Artifact(s)

- Diff: `.github/workflows/deploy.yml` exists with correct trigger, CI steps, and deploy steps demonstrates workflow is configured
- CLI: GitHub Actions workflow runs successfully after a push to `main` demonstrates automated deployment works
- CLI: `aws apprunner list-operations --service-arn <arn>` shows a successful deployment demonstrates App Runner received the update
- URL: App is accessible at the App Runner URL after automated deployment demonstrates end-to-end automation

#### 4.0 Tasks

- [ ] 4.1 Create `.github/workflows/deploy.yml` with trigger on `push` to `main` branch and add top-level `permissions` for `id-token: write` (OIDC) and `contents: read`
- [ ] 4.2 Add a `ci` job that replicates the existing CI checks: checkout, setup Node 22, `npm ci`, install Task, run `task lint`, `task typecheck`, `task test` (mirror the pattern from `.github/workflows/ci.yml`)
- [ ] 4.3 Add a `deploy` job that depends on (`needs`) the `ci` job and runs only on success. Add steps to: checkout code, configure AWS credentials using `aws-actions/configure-aws-credentials@v4` with OIDC (`role-to-assume` from a GitHub secret, region from a GitHub variable)
- [ ] 4.4 Add steps to the `deploy` job for: authenticate with ECR using `aws-actions/amazon-ecr-login@v2`, build Docker image, tag with git SHA and `latest`, push both tags to ECR
- [ ] 4.5 Add a step to the `deploy` job that fetches the App Runner service ARN and triggers a deployment using `aws apprunner start-deployment`
- [ ] 4.6 Add a documentation comment block at the top of the workflow file listing the required GitHub secrets (`AWS_ROLE_ARN`) and variables (`AWS_ACCOUNT_ID`, `AWS_REGION`) that must be configured in the repository settings
- [ ] 4.7 Push the workflow to a branch, open a PR, and merge to `main` to trigger the full pipeline. Verify the GitHub Actions UI shows CI passing and deploy succeeding, and that the app is accessible at the App Runner URL
