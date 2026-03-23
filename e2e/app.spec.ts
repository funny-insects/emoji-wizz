import { test, expect } from "@playwright/test";

test("app renders a canvas element", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
});

test("app renders a preset selector dropdown", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("select")).toBeVisible();
});
