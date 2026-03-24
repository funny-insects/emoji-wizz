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

test("brush tool: drag draws black stroke on image layer and undo removes it", async ({
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

  // Select brush tool
  await page.getByRole("button", { name: "Brush" }).click();

  const stageBox = await page.locator(".konvajs-content").first().boundingBox();
  expect(stageBox).not.toBeNull();

  // Use a point near the center where the emoji is rendered
  const cx = stageBox!.x + 64;
  const cy = stageBox!.y + 64;

  // Record pixel before drawing
  const before = await getImageLayerPixel(page, 64, 64);

  // Draw a brush stroke across the center
  await page.mouse.move(cx - 20, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy);
  await page.mouse.move(cx + 20, cy);
  await page.mouse.up();

  // Wait for Konva to re-render
  await page.waitForTimeout(100);

  // After drawing: the stroke should be visible — pixel should now be black (#000000)
  const after = await getImageLayerPixel(page, 64, 64);
  expect(after.r).toBe(0);
  expect(after.g).toBe(0);
  expect(after.b).toBe(0);
  expect(after.a).toBeGreaterThan(0);
  // Sanity: pixel was not already black before drawing
  expect(before.r + before.g + before.b).toBeGreaterThan(0);

  // Undo with Cmd+Z
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);

  // After undo: pixel should be restored to original value
  const restored = await getImageLayerPixel(page, 64, 64);
  expect(restored.r).toBe(before.r);
  expect(restored.g).toBe(before.g);
  expect(restored.b).toBe(before.b);
  expect(restored.a).toBe(before.a);
});

test("brush tool: crosshair cursor visible when brush is active with image loaded", async ({
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

  await page.getByRole("button", { name: "Brush" }).click();

  // The canvas container should have crosshair cursor when brush is active
  const cursorStyle = await page.evaluate(() => {
    const container = document.querySelector(".konvajs-content")?.parentElement;
    if (!container) return "";
    return window.getComputedStyle(container).cursor;
  });
  expect(cursorStyle).toBe("crosshair");
});
