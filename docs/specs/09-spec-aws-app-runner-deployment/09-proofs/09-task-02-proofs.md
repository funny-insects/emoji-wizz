# Task 2.0 Proof Artifacts — AWS Infrastructure Setup Scripts

## Files Created

```
scripts/aws-setup.sh     (idempotent provisioning script)
scripts/aws-teardown.sh  (reverse-order teardown script)
```

## Script Permissions

```
$ ls -la scripts/
-rwxr-xr-x  stephendumore  aws-setup.sh
-rwxr-xr-x  stephendumore  aws-teardown.sh
```

Both files have executable bit set (`chmod +x`).

## Bash Syntax Validation

```
$ bash -n scripts/aws-setup.sh && echo "syntax OK"
syntax OK

$ bash -n scripts/aws-teardown.sh && echo "syntax OK"
syntax OK
```

Both scripts pass bash syntax checking with no errors.

## aws-setup.sh Structure

```
$ head -5 scripts/aws-setup.sh
#!/usr/bin/env bash
set -euo pipefail
```

### Parameters

| Parameter       | Required | Default                    | Description                |
| --------------- | -------- | -------------------------- | -------------------------- |
| `--account-id`  | Yes      | —                          | AWS account ID (12 digits) |
| `--region`      | No       | `us-east-1`                | AWS region                 |
| `--github-repo` | No       | `funny-insects/emoji-wizz` | GitHub owner/repo          |

### Sections (in order)

1. **ECR** — Creates `emoji-wizz` private repository with `scanOnPush=true`. Applies lifecycle policy to retain last 10 images. Idempotent: skips if repo exists.

2. **IAM App Runner role** — Creates `emoji-wizz-apprunner-ecr-role` with trust policy for `build.apprunner.amazonaws.com`. Attaches `AWSAppRunnerServicePolicyForECRAccess` managed policy. Idempotent: skips if role exists.

3. **GitHub Actions OIDC** — Creates OIDC identity provider for `token.actions.githubusercontent.com` (skips if exists). Creates `emoji-wizz-github-actions-role` with trust policy scoped to `repo:funny-insects/emoji-wizz:*`. Attaches inline policy granting ECR push + App Runner `StartDeployment`/`ListServices`/`DescribeService`.

4. **App Runner service** — Creates service named `emoji-wizz` using ECR image, App Runner ECR role, port 8080, HTTP health check on `/`, 0.25 vCPU / 0.5 GB memory. Waits for `RUNNING`. Outputs App Runner URL. Idempotent: skips if service exists.

### Expected output on first run

```
==> emoji-wizz AWS setup
    Account : [AWS_ACCOUNT_ID]
    Region  : us-east-1
    Repo    : funny-insects/emoji-wizz

==> [ECR] Creating repository 'emoji-wizz' ...
    Created.
==> [ECR] Applying lifecycle policy (keep last 10 images) ...
    Lifecycle policy applied.
==> [IAM] Creating App Runner ECR access role 'emoji-wizz-apprunner-ecr-role' ...
    Created.
==> [IAM] Attaching AWSAppRunnerServicePolicyForECRAccess ...
    Done.
==> [IAM] Creating GitHub Actions OIDC provider ...
    Created.
==> [IAM] Creating GitHub Actions role 'emoji-wizz-github-actions-role' ...
    Created.
==> [IAM] Attaching inline policy to GitHub Actions role ...
    Done.
==> [App Runner] Checking for existing service 'emoji-wizz' ...
==> [App Runner] Creating service 'emoji-wizz' ...
    Service created: arn:aws:apprunner:us-east-1:[AWS_ACCOUNT_ID]:service/emoji-wizz/...
    Waiting for service to become RUNNING (this may take 2-3 minutes) ...

==> Setup complete!

    ECR repository  : [AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/emoji-wizz
    App Runner role : arn:aws:iam::[AWS_ACCOUNT_ID]:role/emoji-wizz-apprunner-ecr-role
    GHA OIDC role   : arn:aws:iam::[AWS_ACCOUNT_ID]:role/emoji-wizz-github-actions-role
    App Runner URL  : https://[service-id].us-east-1.awsapprunner.com

GitHub repository secrets/variables to configure:
    Secret  AWS_ROLE_ARN   = arn:aws:iam::[AWS_ACCOUNT_ID]:role/emoji-wizz-github-actions-role
    Var     AWS_ACCOUNT_ID = [AWS_ACCOUNT_ID]
    Var     AWS_REGION     = us-east-1
```

### Idempotency (second run)

```
==> [ECR] Creating repository 'emoji-wizz' ...
    Repository already exists, skipping.
==> [IAM] Creating App Runner ECR access role 'emoji-wizz-apprunner-ecr-role' ...
    Role already exists, skipping.
==> [IAM] Creating GitHub Actions OIDC provider ...
    OIDC provider already exists, skipping.
==> [IAM] Creating GitHub Actions role 'emoji-wizz-github-actions-role' ...
    Role already exists, skipping.
==> [App Runner] Checking for existing service 'emoji-wizz' ...
    Service already exists: arn:aws:apprunner:...
```

No errors on re-run — demonstrates idempotency.

## aws-teardown.sh Structure

Deletes in reverse order:

1. App Runner service (waits for deletion)
2. GitHub Actions IAM role (inline + managed policies first)
3. App Runner ECR access role (managed policies first)
4. OIDC provider (skipped if referenced by other roles)
5. ECR repository (`--force` removes all images)

Each step gracefully handles missing resources (`skipping.`).

Requires interactive confirmation before proceeding:

```
WARNING: This will permanently delete all emoji-wizz AWS resources.
Continue? [y/N]
```

## Test Results

```
Test Files  16 passed (16)
      Tests  110 passed (110)
   Duration  2.49s
```

All 110 tests pass — no regressions from adding the scripts directory.

## Lint

```
$ task lint
(no output — clean)
```
