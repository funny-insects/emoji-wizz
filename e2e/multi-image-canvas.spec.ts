import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "test-emoji.png");
const fixture2Path = path.join(__dirname, "fixtures", "test-emoji-transparent.png");

test("Mode toggle switches between Single Image and Multi-Image modes", async ({
  page,
}) => {
  await page.goto("/");
  // Default is Single Image
  await expect(page.getByRole("button", { name: "Single Image" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Multi-Image" })).toBeVisible();

  // Switch to Multi-Image
  await page.getByRole("button", { name: "Multi-Image" }).click();
  // Layer panel should appear
  await expect(page.locator(".layer-panel")).toBeVisible();
});

test("Multi-Image mode: file picker adds images and shows them in layer panel", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Multi-Image" }).click();

  // Add first image via file input
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  // Layer panel should now show 1 item
  await expect(page.locator(".layer-row")).toHaveCount(1);

  // Add second image
  await page.locator('input[type="file"]').setInputFiles(fixture2Path);
  await expect(page.locator(".layer-row")).toHaveCount(2);
});

test("Multi-Image mode: Download button enabled after adding image", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Multi-Image" }).click();

  const downloadBtn = page.getByRole("button", { name: "Download" });
  await expect(downloadBtn).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await expect(downloadBtn).toBeEnabled();
});

test("Multi-Image mode: Download triggers a file download", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^emoji-\d{4}-\d{2}-\d{2}\.png$/);
});

test("Multi-Image mode: clicking a layer row selects the image", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  // Click the layer row
  await page.locator(".layer-row").first().click();
  // The row should have the active class
  await expect(page.locator(".layer-row--active")).toHaveCount(1);
});

test("Switching back to Single Image mode shows the single image canvas", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await expect(page.locator(".layer-panel")).toBeVisible();

  await page.getByRole("button", { name: "Single Image" }).click();
  await expect(page.locator(".layer-panel")).not.toBeVisible();
});
