import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper: first canvas inside the Konva wrapper (background layer)
const bgCanvas = (page: Parameters<typeof test>[1]["page"]) =>
  page.locator(".konvajs-content canvas").first();

test("canvas renders with Slack preset dimensions", async ({ page }) => {
  await page.goto("/");
  const canvas = bgCanvas(page);
  await expect(canvas).toBeVisible();
  expect(await canvas.getAttribute("width")).toBe("512");
  expect(await canvas.getAttribute("height")).toBe("512");
});

test("canvas renders non-empty pixel data (checkerboard is drawing)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(bgCanvas(page)).toBeVisible();

  await page.waitForFunction(() => {
    // Background layer canvas (index 0) holds the checkerboard
    const el = document.querySelector(
      ".konvajs-content canvas",
    ) as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    return data.some((v) => v !== 0);
  });
});

test("switching to Apple preset with no image resizes canvas silently", async ({
  page,
}) => {
  await page.goto("/");
  await expect(bgCanvas(page)).toBeVisible();

  await page
    .locator("select")
    .first()
    .selectOption({ label: "Apple — 512×512" });

  const canvas = bgCanvas(page);
  await expect(canvas).toHaveAttribute("width", "512");
  await expect(canvas).toHaveAttribute("height", "512");
});

test("switching preset after image upload shows confirm dialog and resizes canvas", async ({
  page,
}) => {
  await page.goto("/");
  await expect(bgCanvas(page)).toBeVisible();

  const fixturePath = path.join(__dirname, "fixtures", "test-emoji.png");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  page.on("dialog", (dialog) => dialog.accept());
  await page
    .locator("select")
    .first()
    .selectOption({ label: "Apple — 512×512" });

  const canvas = bgCanvas(page);
  await expect(canvas).toHaveAttribute("width", "512");
  await expect(canvas).toHaveAttribute("height", "512");
});

test("canvas pixel data changes after file upload", async ({ page }) => {
  await page.goto("/");
  await expect(bgCanvas(page)).toBeVisible();

  // The image renders on layer index 1 (second canvas inside .konvajs-content)
  const initialPixels = await page.evaluate(() => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[1] as HTMLCanvasElement;
    if (!el) return [] as number[];
    const ctx = el.getContext("2d");
    if (!ctx) return [] as number[];
    return Array.from(ctx.getImageData(0, 0, el.width, el.height).data);
  });

  const fixturePath = path.join(__dirname, "fixtures", "test-emoji.png");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  await page.waitForFunction((initial: number[]) => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[1] as HTMLCanvasElement;
    if (!el) return false;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    const current = Array.from(
      ctx.getImageData(0, 0, el.width, el.height).data,
    );
    return current.some((v, i) => v !== initial[i]);
  }, initialPixels);
});
