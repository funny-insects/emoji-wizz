import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper: pixel RGBA at a given (x, y) on the image layer canvas (index 1)
async function getImageLayerPixel(
  page: Parameters<typeof test>[1]["page"],
  x: number,
  y: number,
): Promise<{ r: number; g: number; b: number; a: number }> {
  return page.evaluate(
    ([px, py]: [number, number]) => {
      const canvases = document.querySelectorAll(".konvajs-content canvas");
      const el = canvases[1] as HTMLCanvasElement;
      const ctx = el.getContext("2d");
      if (!ctx) return { r: 0, g: 0, b: 0, a: 0 };
      const d = ctx.getImageData(px, py, 1, 1).data;
      return { r: d[0]!, g: d[1]!, b: d[2]!, a: d[3]! };
    },
    [x, y] as [number, number],
  );
}

test("eraser tool: drag erases pixels to transparent (alpha=0) and undo restores them", async ({
  page,
}) => {
  await page.goto("/");

  // Upload test fixture
  const fixturePath = path.join(__dirname, "fixtures", "test-emoji.png");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  // Wait for image to appear on the image layer
  await page.waitForFunction(() => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[1] as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    return data.some((v) => v !== 0);
  });

  // Eraser is the default active tool — click to confirm
  await page.getByRole("button", { name: "Eraser" }).click();

  // Get the stage bounding box to calculate absolute mouse coordinates
  const stageBox = await page.locator(".konvajs-content").first().boundingBox();
  expect(stageBox).not.toBeNull();

  // Erase the center of the canvas (should be within the emoji image)
  const cx = stageBox!.x + 64;
  const cy = stageBox!.y + 64;

  // Record pixel at center before erasing
  const before = await getImageLayerPixel(page, 64, 64);

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 20, cy);
  await page.mouse.move(cx + 40, cy);
  await page.mouse.up();

  // Wait a tick for Konva to re-render
  await page.waitForTimeout(100);

  // After erasing: the pixel at center of the image layer should be transparent
  const after = await getImageLayerPixel(page, 64, 64);
  expect(after.a).toBe(0);
  // Sanity: the pixel was not already transparent before erasing
  expect(before.a).toBeGreaterThan(0);

  // Undo with Cmd+Z
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);

  // After undo: the image layer pixel at center should be restored
  const restored = await getImageLayerPixel(page, 64, 64);
  expect(restored.a).toBeGreaterThan(0);
});

test("eraser cursor (circle) shows when eraser tool is active and mouse is over canvas", async ({
  page,
}) => {
  await page.goto("/");

  const fixturePath = path.join(__dirname, "fixtures", "test-emoji.png");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  await page.waitForFunction(() => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[1] as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    return ctx
      .getImageData(0, 0, el.width, el.height)
      .data.some((v) => v !== 0);
  });

  await page.getByRole("button", { name: "Eraser" }).click();

  const stageBox = await page.locator(".konvajs-content").first().boundingBox();
  expect(stageBox).not.toBeNull();

  // Move mouse to center of canvas — cursor circle should appear in overlays layer
  await page.mouse.move(stageBox!.x + 64, stageBox!.y + 64);
  await page.waitForTimeout(50);

  // Verify overlay layer (index 2) has non-empty pixels (cursor circle)
  const hasOverlayContent = await page.evaluate(() => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[2] as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    return data.some((v) => v !== 0);
  });
  expect(hasOverlayContent).toBe(true);
});
