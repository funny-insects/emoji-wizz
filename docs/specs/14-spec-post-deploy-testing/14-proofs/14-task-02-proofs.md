# Task 2.0 Proof Artifacts — Production E2E Tests with Playwright

## Diff: `playwright.prod.config.ts` (new file)

Production Playwright config targeting `PROD_URL` env var, `e2e/prod/` test dir, no `webServer`:

```typescript
import { defineConfig, devices } from "@playwright/test";

const prodUrl = process.env.PROD_URL;
if (!prodUrl) {
  throw new Error("PROD_URL environment variable is required");
}

export default defineConfig({
  testDir: "./e2e/prod",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: prodUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

## Diff: `e2e/prod/prod.spec.ts` (new file)

Three production tests following existing `e2e/app.spec.ts` patterns:

```typescript
import { test, expect } from "@playwright/test";

test("app loads successfully", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/emoji wizz/i);
});

test("canvas element renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".konvajs-content canvas").first()).toBeVisible();
});

test("preset selector is functional", async ({ page }) => {
  await page.goto("/");
  const select = page.locator("select").first();
  await expect(select).toBeVisible();
  const options = select.locator("option");
  await expect(options).not.toHaveCount(0);
});
```

## Diff: `Taskfile.yml`

```diff
+  test:e2e:prod:
+    desc: Run Playwright production E2E tests (requires PROD_URL env var)
+    cmds:
+      - npx playwright test --config playwright.prod.config.ts
```

## Diff: `.github/workflows/deploy.yml` — E2E steps added to `post-deploy` job

```diff
+      - name: Checkout
+        uses: actions/checkout@v4
+
+      - name: Setup Node.js
+        uses: actions/setup-node@v4
+        with:
+          node-version: "22"
+          cache: "npm"
+
+      - name: Install dependencies
+        run: npm ci
+
+      - name: Install Playwright browsers
+        run: npx playwright install --with-deps chromium
+
+      - name: Run production E2E tests
+        env:
+          PROD_URL: ${{ env.PROD_URL }}
+        run: npx playwright test --config playwright.prod.config.ts
```

## Quality Gate Results

```
task: [lint] npx eslint src/
task: [typecheck] npx tsc --noEmit
Test Files  20 passed (20)
      Tests  147 passed (147)
   Duration  4.32s
```

## Verification Checklist

- [x] `playwright.prod.config.ts` — `baseURL` set from `PROD_URL`, throws if not set
- [x] `playwright.prod.config.ts` — `testDir` is `./e2e/prod`, no `webServer` section
- [x] `playwright.prod.config.ts` — Chromium-only, CI retry/worker settings, list+html reporters
- [x] `e2e/prod/prod.spec.ts` — "app loads successfully" test verifies title
- [x] `e2e/prod/prod.spec.ts` — "canvas element renders" test verifies `.konvajs-content canvas`
- [x] `e2e/prod/prod.spec.ts` — "preset selector is functional" test verifies `select` with options
- [x] `Taskfile.yml` — `test:e2e:prod` task added with correct command and description
- [x] `deploy.yml` — Checkout, Node 22, `npm ci`, Playwright chromium install, E2E run steps added
- [ ] Sub-tasks 2.4 and 2.6 require live prod URL — proof will be captured after deployment
