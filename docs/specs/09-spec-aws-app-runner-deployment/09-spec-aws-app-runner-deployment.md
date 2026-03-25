# 09-spec-aws-app-runner-deployment

## Introduction/Overview

Emoji Wizz is a client-side SPA that needs to be deployed to AWS App Runner so it is accessible on the web. The project already has a multi-stage Dockerfile (Node build → nginx serving) and a basic `apprunner.yaml`, but lacks a CI/CD pipeline to automate deployments. This spec covers setting up the full deployment pipeline: building a Docker image, pushing it to ECR, deploying to App Runner, and automating the entire flow via GitHub Actions on merges to `main`.

## Goals

- Deploy the Emoji Wizz SPA to AWS App Runner using the existing nginx-based Dockerfile and ECR
- Automate deployments via GitHub Actions so every merge to `main` triggers a build and deploy
- Provide shell scripts for provisioning all required AWS resources (ECR repo, App Runner service, IAM roles)
- Keep infrastructure minimal and cost-optimized for a low-traffic hobby project
- Ensure the existing CI checks (lint, typecheck, tests) pass before any deployment

## User Stories

- **As a developer**, I want merges to `main` to automatically deploy so that I don't have to manually build and push images.
- **As a developer**, I want shell scripts that create all AWS resources so that I can set up the infrastructure from scratch on a fresh AWS account.
- **As a user**, I want to access Emoji Wizz via a public URL so that I can use the app in my browser.
- **As a developer**, I want deployments to only proceed after CI checks pass so that broken code never reaches production.

## Demoable Units of Work

### Unit 1: AWS Infrastructure Setup Scripts

**Purpose:** Provide repeatable shell scripts that create all required AWS resources from scratch, so any developer with a fresh AWS account can provision the infrastructure.

**Functional Requirements:**

- The system shall include a shell script (`scripts/aws-setup.sh`) that creates an ECR private repository for the project
- The system shall include a shell script that creates the IAM roles and policies required for App Runner to pull images from ECR (App Runner access role + ECR access policy)
- The system shall include a shell script that creates an App Runner service configured to use the ECR image, listen on port 8080, with health checks on `/`
- The scripts shall be idempotent — running them again should not fail if resources already exist
- The scripts shall accept an AWS region parameter (defaulting to `us-east-1`)
- The scripts shall output the App Runner service URL upon successful creation
- The system shall include a teardown script (`scripts/aws-teardown.sh`) that removes all created resources

**Proof Artifacts:**

- CLI: Running `./scripts/aws-setup.sh` creates all AWS resources and outputs the App Runner service URL
- CLI: Running `aws apprunner list-services` shows the emoji-wizz service after setup

### Unit 2: Docker Build & ECR Push

**Purpose:** Validate the Docker image builds correctly and can be pushed to ECR, ensuring the existing Dockerfile works end-to-end with the deployment target.

**Functional Requirements:**

- The existing Dockerfile shall produce a working nginx image that serves the SPA on port 8080
- The Dockerfile shall handle SPA client-side routing by configuring nginx to fall back to `index.html` for all routes
- The system shall include a shell script (`scripts/deploy.sh`) that builds the Docker image, tags it, authenticates with ECR, and pushes the image
- The pushed image shall be tagged with both the git SHA and `latest`
- The system shall remove the existing `apprunner.yaml` since the image-based approach replaces it

**Proof Artifacts:**

- CLI: `docker build -t emoji-wizz .` completes successfully
- CLI: `docker run -p 8080:8080 emoji-wizz` serves the app at `http://localhost:8080`
- Screenshot: App loads correctly in browser from the Docker container

### Unit 3: GitHub Actions CD Pipeline

**Purpose:** Automate the entire build-and-deploy flow so that every merge to `main` deploys to App Runner without manual intervention.

**Functional Requirements:**

- The system shall include a GitHub Actions workflow (`.github/workflows/deploy.yml`) that triggers on pushes to `main`
- The workflow shall run the existing CI checks (lint, typecheck, tests) before deploying
- The workflow shall build the Docker image, push to ECR, and trigger an App Runner deployment
- The workflow shall use GitHub Actions OIDC for AWS authentication (no long-lived access keys stored as secrets)
- The workflow shall report the deployment status (success/failure) in the GitHub Actions UI
- The workflow shall use the App Runner `start-deployment` API to trigger a new deployment after pushing the image

**Proof Artifacts:**

- Screenshot: GitHub Actions shows a successful deploy workflow run after a merge to `main`
- CLI: `aws apprunner list-operations --service-arn <arn>` shows a successful deployment
- Browser: App is accessible at the App Runner URL after the automated deployment

## Non-Goals (Out of Scope)

1. **Custom domain configuration**: The app will use the default App Runner URL. Custom domains can be added later.
2. **Staging/preview environments**: Only a single production environment will be created.
3. **Advanced monitoring/alerting**: Rely on App Runner's built-in health checks and CloudWatch metrics only.
4. **CDN/CloudFront integration**: No CDN layer in front of App Runner for this iteration.
5. **Database or backend services**: The app is a static SPA with no server-side dependencies.
6. **Auto-scaling configuration**: Use App Runner defaults, optimized for low traffic.

## Design Considerations

No specific design requirements identified. This is an infrastructure-only change with no UI modifications.

## Repository Standards

- Use `task` commands for lint/test/format as defined in `Taskfile.yml` — not raw `npx`
- CI workflow pattern: checkout → setup Node 22 → npm ci → install Task → run checks
- Multi-stage Docker builds with Alpine base images
- Port 8080 for App Runner compatibility
- Pre-commit hooks enforce linting and formatting via Husky + lint-staged
- TypeScript strict mode enabled

## Technical Considerations

- **Image-based deployment**: App Runner pulls from ECR rather than building from source. This uses the optimized nginx-based Dockerfile instead of `npx serve`.
- **SPA routing**: The nginx config in the Dockerfile needs to be updated to handle client-side routing (try_files fallback to `index.html`). Currently it only does the default nginx config with a port change.
- **OIDC authentication**: GitHub Actions will use OIDC federation with AWS IAM instead of storing AWS access keys as GitHub secrets. This requires an IAM OIDC identity provider and a role with a trust policy for the GitHub repo.
- **ECR lifecycle policy**: Consider adding a lifecycle policy to limit the number of stored images and control costs.
- **App Runner auto-scaling**: Configure minimum instances to 1 (App Runner's minimum) with provisioned concurrency set low to minimize costs.
- **Removal of `apprunner.yaml`**: Since we're using image-based deployment via ECR, the source-based `apprunner.yaml` is no longer needed and should be removed to avoid confusion.

## Security Considerations

- **AWS credentials**: No long-lived AWS access keys. Use GitHub Actions OIDC federation with an IAM role scoped to the specific repository.
- **IAM least privilege**: The App Runner service role should only have ECR pull permissions. The GitHub Actions role should only have ECR push + App Runner deploy permissions.
- **ECR repository policy**: Private repository only, no public access.
- **Secrets management**: AWS account ID and region will be stored as GitHub repository variables (not secrets, as they're not sensitive). The OIDC role ARN will be stored as a GitHub secret.
- **Shell scripts**: Scripts should not hardcode any AWS account IDs or sensitive values — accept them as parameters or environment variables.

## Success Metrics

1. **Automated deployment**: Every merge to `main` triggers a successful deployment within 5 minutes
2. **Zero-downtime deploys**: App Runner handles rolling deployments with no user-visible downtime
3. **Infrastructure reproducibility**: Running the setup scripts on a fresh AWS account produces a working deployment
4. **CI gate enforced**: No deployment proceeds unless lint, typecheck, and tests pass

## Open Questions

1. Which AWS region do you prefer? (Spec defaults to `us-east-1`)
2. Do you have the AWS CLI installed and configured locally, or will all AWS interactions be through GitHub Actions only?
3. Should the setup scripts also configure the GitHub OIDC provider in AWS, or will that be a manual step?
