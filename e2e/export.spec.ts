import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "test-emoji.png");

test("Download button is disabled before image upload", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Download" });
  await expect(button).toBeDisabled();
});

test("Download button is enabled after image upload", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  const button = page.getByRole("button", { name: "Download" });
  await expect(button).toBeEnabled();
});

test("clicking Download PNG triggers a file download with correct filename", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^emoji-\d{4}-\d{2}-\d{2}\.png$/,
  );
});

test("clicking Download WebP triggers a file download with .webp extension", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.locator("select").last().selectOption("webp");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.webp$/);
});

test("no size warning is shown after a normal download", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  await downloadPromise;
  const warning = page.locator(".export-warning");
  const count = await warning.count();
  if (count > 0) {
    await expect(warning).toHaveText("");
  }
});
