# Task 4.0 — GitHub Actions CD Pipeline: Proof Artifacts

## Overview

Task 4.0 creates `.github/workflows/deploy.yml`, a CD pipeline that triggers on pushes to
`main`, runs CI checks, builds and pushes the Docker image to ECR via OIDC authentication,
and triggers an App Runner deployment. Sub-tasks 4.1–4.6 are verified by file inspection
below. Sub-task 4.7 (live pipeline run) is verified by GitHub Actions output after merge.

---

## 4.1–4.6 Workflow File Creation

### File Created

```
.github/workflows/deploy.yml
```

### Workflow Structure Verification

| Sub-task | Requirement                                                                                                               | Evidence     |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 4.1      | `push` to `main` trigger; `id-token: write` + `contents: read` permissions                                                | Lines 14–20  |
| 4.2      | `ci` job mirrors ci.yml: checkout, Node 22, `npm ci`, install Task, `task lint/typecheck/test`                            | Lines 22–56  |
| 4.3      | `deploy` job with `needs: ci`; `configure-aws-credentials@v4` with OIDC `role-to-assume` secret and `aws-region` variable | Lines 58–71  |
| 4.4      | `amazon-ecr-login@v2`; `docker build`; tag with git SHA (7-char) and `latest`; push both                                  | Lines 73–87  |
| 4.5      | Fetch service ARN via `aws apprunner list-services`; trigger `start-deployment`                                           | Lines 89–102 |
| 4.6      | Documentation comment block at top listing `AWS_ROLE_ARN` secret and `AWS_ACCOUNT_ID`/`AWS_REGION` variables              | Lines 1–9    |

### Required GitHub Configuration

Before the workflow runs, configure in **Settings → Secrets and variables → Actions**:

| Type     | Name             | Value                                                                                                    |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| Secret   | `AWS_ROLE_ARN`   | ARN from `scripts/aws-setup.sh` output (e.g. `arn:aws:iam::ACCOUNT:role/emoji-wizz-github-actions-role`) |
| Variable | `AWS_ACCOUNT_ID` | 12-digit AWS account ID                                                                                  |
| Variable | `AWS_REGION`     | AWS region (e.g. `us-east-1`)                                                                            |

---

## Quality Gates

```
$ task lint
task: [lint] npx eslint src/
(no errors)

$ task typecheck
task: [typecheck] npx tsc --noEmit
(no errors)

$ task test
 Test Files  18 passed (18)
       Tests  138 passed (138)
    Start at  13:27:57
    Duration  4.19s
```

---

## 4.7 Live Pipeline Run (post-merge verification)

> To be verified after merging the `deploy-to-ecr` branch to `main`.

### Expected GitHub Actions Output

```
CI job:
  ✓ Checkout
  ✓ Setup Node.js 22
  ✓ Install dependencies (npm ci)
  ✓ Install Task
  ✓ Lint
  ✓ Typecheck
  ✓ Unit tests

deploy job (runs after ci succeeds):
  ✓ Checkout
  ✓ Configure AWS credentials (OIDC)
  ✓ Login to Amazon ECR
  ✓ Build Docker image
  ✓ Tag and push to ECR
  ✓ Trigger App Runner deployment
```

### ECR Image Verification (after pipeline run)

```
$ aws ecr describe-images --repository-name emoji-wizz --region us-east-1
{
    "imageDetails": [
        {
            "imageTags": ["<7-char-git-sha>", "latest"],
            ...
        }
    ]
}
```

### App Runner Operations Verification (after pipeline run)

```
$ aws apprunner list-operations \
    --service-arn arn:aws:apprunner:us-east-1:[ACCOUNT]:service/emoji-wizz/... \
    --query 'OperationSummaryList[0]'
{
    "Type": "START_DEPLOYMENT",
    "Status": "SUCCEEDED",
    ...
}
```
