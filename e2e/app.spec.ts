import { test, expect } from "@playwright/test";

test("placeholder page loads with app name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /emoji wizz/i })).toBeVisible();
});

test("placeholder page shows tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/create custom emojis/i)).toBeVisible();
});
