# 14-task-03-proofs — Automatic Rollback on Failure

## Overview

Task 3.0 adds automatic rollback to the deploy pipeline: if the smoke test or E2E tests fail in the `post-deploy` job, the previous ECR image is re-tagged as `latest` and a new App Runner deployment is triggered. A post-rollback smoke test then verifies the rollback restored a healthy deployment.

---

## CLI Output

### Diff — `deploy` job: previous image tag capture and job outputs

```diff
@@ -56,6 +56,9 @@ jobs:
     name: Build, Push & Deploy
     runs-on: ubuntu-latest
     needs: ci
+    outputs:
+      previous-image-tag: ${{ steps.capture-prev-tag.outputs.previous-tag }}
+      ecr-registry: ${{ steps.ecr-login.outputs.registry }}

     steps:
       - name: Checkout
@@ -71,6 +74,20 @@ jobs:
         id: ecr-login
         uses: aws-actions/amazon-ecr-login@v2

+      - name: Capture previous image tag
+        id: capture-prev-tag
+        env:
+          AWS_REGION: ${{ vars.AWS_REGION }}
+        run: |
+          PREV_TAG=$(aws ecr describe-images \
+            --repository-name emoji-wizz \
+            --image-ids imageTag=latest \
+            --region "${AWS_REGION}" \
+            --query "imageDetails[0].imageTags[?@ != 'latest'] | [0]" \
+            --output text 2>/dev/null || echo "")
+          echo "Previous image tag: ${PREV_TAG}"
+          echo "previous-tag=${PREV_TAG}" >> "$GITHUB_OUTPUT"
+
       - name: Build Docker image
```

### Diff — `post-deploy` job: rollback steps added

```diff
@@ -105,6 +122,9 @@ jobs:
     name: Post-Deploy Verification
     runs-on: ubuntu-latest
     needs: deploy
+    env:
+      PREVIOUS_IMAGE_TAG: ${{ needs.deploy.outputs.previous-image-tag }}
+      ECR_REGISTRY: ${{ needs.deploy.outputs.ecr-registry }}

     steps:
       ...
@@ -163,3 +183,54 @@ jobs:
         env:
           PROD_URL: ${{ env.PROD_URL }}
         run: npx playwright test --config playwright.prod.config.ts
+
+      - name: Rollback — re-tag previous image as latest
+        if: failure()
+        ...
+      - name: Rollback — trigger App Runner redeployment
+        if: failure()
+        ...
+      - name: Rollback — verify healthy deployment
+        if: failure()
+        ...
```

---

## Verification

### Sub-task 3.1 — `deploy` job outputs + "Capture previous image tag" step

- `deploy` job has `outputs:` section exposing `previous-image-tag` (from `steps.capture-prev-tag.outputs.previous-tag`) and `ecr-registry` (from `steps.ecr-login.outputs.registry`)
- "Capture previous image tag" step (id: `capture-prev-tag`) runs before "Build Docker image"
- Uses `aws ecr describe-images` with JMESPath filter `imageDetails[0].imageTags[?@ != 'latest'] | [0]` to find the short-SHA tag associated with the current `latest` image
- Gracefully handles first-deploy case (no existing `latest`) with `2>/dev/null || echo ""`
- Saves result via `echo "previous-tag=..." >> "$GITHUB_OUTPUT"`

### Sub-task 3.2 — `post-deploy` consumes deploy outputs

- `post-deploy` job-level `env:` block references `${{ needs.deploy.outputs.previous-image-tag }}` and `${{ needs.deploy.outputs.ecr-registry }}`
- Both values are available to all steps, including rollback steps with `if: failure()`

### Sub-task 3.3 — "Rollback — re-tag previous image as latest"

- `if: failure()` — only runs when any prior step in the job failed
- Guards against empty `PREVIOUS_IMAGE_TAG` (no prior image to roll back to) and exits with error
- Uses `aws ecr batch-get-image` to fetch the manifest, then `aws ecr put-image` to re-tag it as `latest`
- Logs confirmation: `Rollback: image <tag> re-tagged as latest in ECR`

### Sub-task 3.4 — "Rollback — trigger App Runner redeployment"

- `if: failure()` — runs after the re-tag step if job is still in failed state
- Queries the service ARN dynamically (same pattern as deploy job)
- Calls `aws apprunner start-deployment` and logs the returned `OperationId`

### Sub-task 3.5 — "Rollback — verify healthy deployment"

- `if: failure()` — runs to verify the rollback deployment is healthy
- Re-uses the same `curl --retry 30 --retry-delay 20 --retry-all-errors --max-time 600 -sf` pattern as the initial smoke test
- Logs `Rollback successful` on HTTP 200 or `ERROR: Rollback did not restore a healthy deployment` and exits 1

### Sub-task 3.6 — Live verification (pending CI run)

- Proof: GitHub Actions log showing rollback steps in `SKIPPED` state on a successful deployment
- Proof: GitHub Actions log showing rollback steps executing and post-rollback smoke test passing after a failed test

---

## Spec Compliance

| Requirement                                             | Status                   |
| ------------------------------------------------------- | ------------------------ |
| `deploy` job records pre-deploy image tag as job output | ✅                       |
| `post-deploy` job receives previous image tag as input  | ✅                       |
| Rollback step re-tags previous ECR image as `latest`    | ✅                       |
| Rollback step triggers new App Runner deployment        | ✅                       |
| Rollback step uses `if: failure()`                      | ✅                       |
| Post-rollback smoke test verifies healthy state         | ✅                       |
| Workflow logs rollback trigger and outcome clearly      | ✅                       |
| Rollback only runs on failure (skipped on success)      | ✅ (via `if: failure()`) |
