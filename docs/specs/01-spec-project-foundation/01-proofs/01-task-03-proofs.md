# Task 3.0 Proof Artifacts — Testing Infrastructure (Vitest + Playwright)

## CLI Output

### `task test` — Vitest unit tests

```
task: [test] npx vitest run

 RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

 Test Files  1 passed (1)
       Tests  2 passed (2)
    Start at  16:34:06
    Duration  408ms (transform 20ms, setup 28ms, import 31ms, tests 52ms, environment 219ms)
```

### `task test:e2e` — Playwright e2e tests

```
task: [test:e2e] npx playwright test

Running 2 tests using 2 workers

  ✓  2 [chromium] › e2e/app.spec.ts:8:1 › placeholder page shows tagline (116ms)
  ✓  1 [chromium] › e2e/app.spec.ts:3:1 › placeholder page loads with app name (107ms)

  2 passed (2.9s)
```

## Configuration Files

### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
```

### `playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Files

### `src/App.test.tsx` — Unit test

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the Emoji Wizz heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /emoji wizz/i }),
    ).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<App />);
    expect(screen.getByText(/create custom emojis/i)).toBeInTheDocument();
  });
});
```

### `e2e/app.spec.ts` — E2E test

```ts
import { test, expect } from "@playwright/test";

test("placeholder page loads with app name", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /emoji wizz/i }),
  ).toBeVisible();
});

test("placeholder page shows tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/create custom emojis/i)).toBeVisible();
});
```

## Verification

| Proof Artifact                                 | Status |
| ---------------------------------------------- | ------ |
| `vitest.config.ts` exists                      | ✅     |
| `playwright.config.ts` exists                  | ✅     |
| `task test` — 2 unit tests pass                | ✅     |
| `task test:e2e` — 2 e2e tests pass (Chromium)  | ✅     |
| Playwright browser binary (Chromium) installed | ✅     |
