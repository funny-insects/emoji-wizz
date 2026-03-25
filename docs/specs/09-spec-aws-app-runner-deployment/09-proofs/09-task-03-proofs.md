# Task 3.0 — Docker Build & ECR Push Script: Proof Artifacts

## Overview

Task 3.0 creates `scripts/deploy.sh`, a script that builds the Docker image, authenticates
with ECR, tags with the git SHA and `latest`, pushes both tags, and triggers an App Runner
deployment. Live execution requires real AWS credentials and a provisioned ECR repository,
so proofs below show file creation, syntax validation, and structure verification. The
end-to-end run proof will be collected after AWS infrastructure is confirmed live.

---

## 3.1–3.7 Script Creation & Structure

### File Created

```
scripts/deploy.sh  (executable, -rwxr-xr-x)
```

### Directory Listing

```
$ ls -la scripts/
total 48
drwxr-xr-x   5 stephendumore  staff    160 Mar 25 13:14 .
drwxr-xr-x  35 stephendumore  staff   1120 Mar 25 12:24 ..
-rwxr-xr-x   1 stephendumore  staff  10673 Mar 25 12:24 aws-setup.sh
-rwxr-xr-x   1 stephendumore  staff   6792 Mar 25 12:24 aws-teardown.sh
-rwxr-xr-x   1 stephendumore  staff   3962 Mar 25 13:14 deploy.sh
```

### Bash Syntax Check

```
$ bash -n scripts/deploy.sh && echo "Syntax OK"
Syntax OK
```

---

## Script Structure Verification

Each sub-task requirement is covered in `scripts/deploy.sh`:

| Sub-task | Requirement                                                                                                                           | Line(s) in script               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 3.1      | Shebang, `set -euo pipefail`, `--account-id` (required), `--region` (default `us-east-1`), ECR registry derived from account + region | 1, 16, 21–40, 43                |
| 3.2      | `git rev-parse --short HEAD` for image tag                                                                                            | 49–50                           |
| 3.3      | `docker build -t emoji-wizz .`                                                                                                        | 54–56                           |
| 3.4      | `aws ecr get-login-password \| docker login`                                                                                          | 60–63                           |
| 3.5      | Tag with SHA and `latest`, push both                                                                                                  | 67–75                           |
| 3.6      | Fetch service ARN via `aws apprunner list-services`, call `start-deployment`                                                          | 79–93                           |
| 3.7      | `chmod +x scripts/deploy.sh` applied                                                                                                  | confirmed by `-rwxr-xr-x` above |

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
    Start at  13:20:30
    Duration  4.44s
```

---

## End-to-End Run Output

> **Note**: The following shows the expected output pattern. Live output requires
> a provisioned ECR repository (`aws-setup.sh` completed) and valid AWS credentials.
> To execute: `./scripts/deploy.sh --account-id [YOUR_ACCOUNT_ID] --region us-east-1`

```
==> emoji-wizz deploy
    Account  : [YOUR_ACCOUNT_ID]
    Region   : us-east-1
    Registry : [YOUR_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com

==> [Git] Using SHA: <7-char-sha>
==> [Docker] Building image ...
    Build complete.
==> [ECR] Authenticating ...
    Authenticated.
==> [ECR] Tagging image as <sha> and latest ...
==> [ECR] Pushing [YOUR_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/emoji-wizz:<sha> ...
==> [ECR] Pushing [YOUR_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/emoji-wizz:latest ...
    Push complete.
==> [App Runner] Fetching service ARN ...
    Service ARN: arn:aws:apprunner:us-east-1:[YOUR_ACCOUNT_ID]:service/emoji-wizz/...
==> [App Runner] Triggering deployment ...
    Deployment triggered. Operation ID: <uuid>

==> Deploy complete!

    Image SHA tag    : [YOUR_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/emoji-wizz:<sha>
    Image latest tag : [YOUR_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/emoji-wizz:latest
```

### ECR Image Verification (after live run)

```
$ aws ecr describe-images --repository-name emoji-wizz --region us-east-1
{
    "imageDetails": [
        {
            "repositoryName": "emoji-wizz",
            "imageTags": ["<git-sha>", "latest"],
            ...
        }
    ]
}
```
