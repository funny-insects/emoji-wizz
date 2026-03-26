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
