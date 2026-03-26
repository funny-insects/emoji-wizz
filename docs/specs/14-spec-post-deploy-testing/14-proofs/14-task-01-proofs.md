# Task 1.0 Proof Artifacts — Smoke Test with Deployment Wait

## Diff: `.github/workflows/deploy.yml`

New `post-deploy` job added with dynamic URL discovery, `curl` retry logic, and AWS CLI fallback:

```diff
+  post-deploy:
+    name: Post-Deploy Verification
+    runs-on: ubuntu-latest
+    needs: deploy
+
+    steps:
+      - name: Configure AWS credentials (OIDC)
+        uses: aws-actions/configure-aws-credentials@v4
+        with:
+          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
+          aws-region: ${{ vars.AWS_REGION }}
+
+      - name: Get App Runner service URL
+        env:
+          AWS_REGION: ${{ vars.AWS_REGION }}
+        run: |
+          SERVICE_URL=$(aws apprunner list-services \
+            --region "${AWS_REGION}" \
+            --output text \
+            --query "ServiceSummaryList[?ServiceName=='emoji-wizz'].ServiceUrl | [0]")
+          PROD_URL="https://${SERVICE_URL}"
+          echo "PROD_URL=${PROD_URL}" >> "$GITHUB_ENV"
+          echo "Production URL: ${PROD_URL}"
+
+      - name: Smoke test — wait for healthy deployment
+        run: |
+          curl --retry 30 --retry-delay 20 --retry-all-errors --max-time 600 -sf "${PROD_URL}"
+          echo "Smoke test passed — production URL returned HTTP 200"
+
+      - name: Log deployment status on timeout
+        if: failure()
+        env:
+          AWS_REGION: ${{ vars.AWS_REGION }}
+        run: |
+          SERVICE_ARN=$(aws apprunner list-services \
+            --region "${AWS_REGION}" \
+            --output text \
+            --query "ServiceSummaryList[?ServiceName=='emoji-wizz'].ServiceArn | [0]")
+          echo "Querying App Runner operations for service: ${SERVICE_ARN}"
+          aws apprunner list-operations \
+            --service-arn "${SERVICE_ARN}" \
+            --region "${AWS_REGION}"
```

## Quality Gate Results

```
task: [lint] npx eslint src/
task: [typecheck] npx tsc --noEmit
Test Files  20 passed (20)
      Tests  147 passed (147)
   Duration  4.36s
```

All lint, typecheck, and unit tests pass.

## Verification Checklist

- [x] `post-deploy` job added with `needs: deploy` — ensures job sequencing
- [x] OIDC AWS credentials step matches existing `deploy` job pattern (`aws-actions/configure-aws-credentials@v4`)
- [x] Dynamic URL discovery via `aws apprunner list-services` query on `ServiceUrl` field
- [x] `PROD_URL` written to `$GITHUB_ENV` for use by subsequent steps
- [x] `curl` uses `--retry 30 --retry-delay 20 --retry-all-errors --max-time 600 -sf` as specified
- [x] Fallback step uses `if: failure()` and queries `aws apprunner list-operations`
- [x] Sub-task 1.5 requires a live GitHub Actions run to fully verify — proof will be a GitHub Actions log link once deployed
