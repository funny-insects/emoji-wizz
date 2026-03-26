import { test, expect } from "@playwright/test";

test("app loads successfully", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/emoji wizz/i);
});

test("canvas element renders", async ({ page }) => {
  await page.goto("/");
  //await expect(page.locator(".konvajs-content canvas").first()).toBeVisible();
  await expect(page.locator(".fjkdsljfsd").first()).toBeVisible();
});

test("preset selector is functional", async ({ page }) => {
  await page.goto("/");
  const select = page.locator("select").first();
  await expect(select).toBeVisible();
  const options = select.locator("option");
  await expect(options).not.toHaveCount(0);
});
