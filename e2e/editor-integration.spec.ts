import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Transparent fixture: 32×32 RGBA PNG, top half (rows 0-15) opaque orange
// (255, 165, 0, 255), bottom half (rows 16-31) fully transparent.
// When rendered in a 128×128 Konva stage, the image is scaled 4×:
//   canvas y 0–63  → opaque orange
//   canvas y 64–127 → transparent (alpha = 0)
const TRANSPARENT_FIXTURE = path.join(
  __dirname,
  "fixtures",
  "test-emoji-transparent.png",
);

// Pixel from image layer canvas (Konva canvas index 1)
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

// Wait until the image layer has non-zero pixels
async function waitForImageLoaded(
  page: Parameters<typeof test>[1]["page"],
): Promise<void> {
  await page.waitForFunction(() => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[1] as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    return ctx
      .getImageData(0, 0, el.width, el.height)
      .data.some((v) => v !== 0);
  });
}

// ─── Task 5.2 ────────────────────────────────────────────────────────────────
test("transparency preservation: transparent areas remain alpha=0 after eraser, brush, and text edits and full undo", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(TRANSPARENT_FIXTURE);
  await waitForImageLoaded(page);

  // Confirm initial state: opaque in top half, transparent in bottom half
  const initOpaque = await getImageLayerPixel(page, 64, 40);
  expect(initOpaque.a).toBeGreaterThan(0);

  const initTransparent = await getImageLayerPixel(page, 64, 96);
  expect(initTransparent.a).toBe(0);

  const stageBox = await page.locator(".konvajs-content").first().boundingBox();
  expect(stageBox).not.toBeNull();
  const sx = stageBox!.x;
  const sy = stageBox!.y;

  // 1. Eraser stroke in the opaque area (canvas y ≈ 40, well inside top half)
  await page.getByRole("button", { name: "Eraser" }).click();
  await page.mouse.move(sx + 30, sy + 40);
  await page.mouse.down();
  await page.mouse.move(sx + 50, sy + 40);
  await page.mouse.up();
  await page.waitForTimeout(100);

  // 2. Brush stroke in the opaque area
  await page.getByRole("button", { name: "Brush" }).click();
  await page.mouse.move(sx + 55, sy + 45);
  await page.mouse.down();
  await page.mouse.move(sx + 75, sy + 45);
  await page.mouse.up();
  await page.waitForTimeout(100);

  // 3. Text in the opaque area
  await page.getByRole("button", { name: "Text" }).click();
  await page.mouse.click(sx + 20, sy + 20);
  const textInput = page.locator("input:not([type='file'])");
  await expect(textInput).toBeVisible();
  await textInput.fill("Hi");
  await textInput.press("Enter");
  await page.waitForTimeout(100);

  // After all edits: transparent area (bottom half) must still be alpha=0
  const afterEdits = await getImageLayerPixel(page, 64, 96);
  expect(afterEdits.a).toBe(0);

  // Also verify another transparent point
  const afterEdits2 = await getImageLayerPixel(page, 20, 100);
  expect(afterEdits2.a).toBe(0);

  // Undo all three actions (text → brush → eraser)
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);

  // After full undo: transparent area remains transparent
  const afterUndo = await getImageLayerPixel(page, 64, 96);
  expect(afterUndo.a).toBe(0);

  // Opaque area is restored
  const afterUndoOpaque = await getImageLayerPixel(page, 64, 40);
  expect(afterUndoOpaque.a).toBeGreaterThan(0);
});

// ─── Task 5.3 ────────────────────────────────────────────────────────────────
test("tool switching: switching from brush to eraser discards in-progress stroke", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(TRANSPARENT_FIXTURE);
  await waitForImageLoaded(page);

  const stageBox = await page.locator(".konvajs-content").first().boundingBox();
  expect(stageBox).not.toBeNull();
  const sx = stageBox!.x;
  const sy = stageBox!.y;

  // Start a brush stroke (mousedown + move, no mouseup)
  await page.getByRole("button", { name: "Brush" }).click();
  await page.mouse.move(sx + 20, sy + 30);
  await page.mouse.down();
  await page.mouse.move(sx + 40, sy + 30);
  await page.mouse.move(sx + 60, sy + 30);

  // Verify overlays layer has content (in-progress line)
  const hasStroke = await page.evaluate(() => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[2] as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    return ctx
      .getImageData(0, 0, el.width, el.height)
      .data.some((v) => v !== 0);
  });
  expect(hasStroke).toBe(true);

  // Switch tool to eraser — in-progress stroke should be discarded
  await page.getByRole("button", { name: "Eraser" }).click();
  await page.mouse.up();

  // Move mouse far off-canvas to avoid eraser cursor rendering on overlay
  await page.mouse.move(0, 0);
  await page.waitForTimeout(50);

  // Overlays layer should now be empty (no brush line, no eraser cursor since off-canvas)
  const overlayEmpty = await page.evaluate(() => {
    const canvases = document.querySelectorAll(".konvajs-content canvas");
    const el = canvases[2] as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return true;
    return !ctx
      .getImageData(0, 0, el.width, el.height)
      .data.some((v) => v !== 0);
  });
  expect(overlayEmpty).toBe(true);
});

test("tool switching: switching from text tool discards open text input", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(TRANSPARENT_FIXTURE);
  await waitForImageLoaded(page);

  // Open text input by clicking on canvas with text tool
  await page.getByRole("button", { name: "Text" }).click();

  const stageBox = await page.locator(".konvajs-content").first().boundingBox();
  expect(stageBox).not.toBeNull();
  const sx = stageBox!.x;
  const sy = stageBox!.y;

  await page.mouse.click(sx + 50, sy + 30);

  const textInput = page.locator("input:not([type='file'])");
  await expect(textInput).toBeVisible();

  // Record pixel before any text is placed
  const before = await getImageLayerPixel(page, 50, 30);

  // Switch to eraser tool while input is open — input should be discarded
  await page.getByRole("button", { name: "Eraser" }).click();
  await page.waitForTimeout(50);

  // Text input should be gone
  await expect(textInput).not.toBeVisible();

  // No text should have been drawn (pixel unchanged — no push happened)
  // The canvas should not have changed since input was discarded (empty on switch)
  const after = await getImageLayerPixel(page, 50, 30);
  expect(after.r).toBe(before.r);
  expect(after.g).toBe(before.g);
  expect(after.b).toBe(before.b);
  expect(after.a).toBe(before.a);
});

// ─── Task 5.4 ────────────────────────────────────────────────────────────────
test("undo/redo across tool boundaries: stepping back through eraser, brush, and text", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(TRANSPARENT_FIXTURE);
  await waitForImageLoaded(page);

  const stageBox = await page.locator(".konvajs-content").first().boundingBox();
  expect(stageBox).not.toBeNull();
  const sx = stageBox!.x;
  const sy = stageBox!.y;

  // Undo button disabled at baseline (only initial snapshot in stack)
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  // Record baseline pixel at a point we'll erase
  const erasePx = await getImageLayerPixel(page, 64, 40);
  expect(erasePx.a).toBeGreaterThan(0); // opaque orange

  // Action 1: Erase at (64, 40)
  await page.getByRole("button", { name: "Eraser" }).click();
  await page.mouse.move(sx + 64, sy + 40);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(100);

  // Pixel should be erased
  const afterErase = await getImageLayerPixel(page, 64, 40);
  expect(afterErase.a).toBe(0);

  // Action 2: Brush stroke at a different location (80, 45)
  await page.getByRole("button", { name: "Brush" }).click();
  await page.mouse.move(sx + 70, sy + 45);
  await page.mouse.down();
  await page.mouse.move(sx + 90, sy + 45);
  await page.mouse.up();
  await page.waitForTimeout(100);

  const afterBrush = await getImageLayerPixel(page, 80, 45);
  expect(afterBrush.r).toBe(0);
  expect(afterBrush.g).toBe(0);
  expect(afterBrush.b).toBe(0);
  expect(afterBrush.a).toBeGreaterThan(0);

  // Action 3: Text in the opaque area
  await page.getByRole("button", { name: "Text" }).click();
  await page.mouse.click(sx + 10, sy + 10);
  const textInput = page.locator("input:not([type='file'])");
  await expect(textInput).toBeVisible();
  await textInput.fill("Z");
  await textInput.press("Enter");
  await page.waitForTimeout(100);

  // Undo enabled (3 actions pushed, stack depth = 4)
  await expect(page.getByRole("button", { name: "Undo" })).not.toBeDisabled();

  // Undo 1: removes text action → brush state restored
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);
  // Brush pixel should still be black (text undo doesn't restore brush)
  const afterUndo1Brush = await getImageLayerPixel(page, 80, 45);
  expect(afterUndo1Brush.r).toBe(0);
  expect(afterUndo1Brush.a).toBeGreaterThan(0);

  // Undo 2: removes brush action → eraser state restored
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);
  // Erased pixel should still be transparent
  const afterUndo2Erase = await getImageLayerPixel(page, 64, 40);
  expect(afterUndo2Erase.a).toBe(0);
  // Brush pixel should be restored (no longer black)
  const afterUndo2Brush = await getImageLayerPixel(page, 80, 45);
  expect(afterUndo2Brush.r).toBe(erasePx.r); // restored to original orange
  expect(afterUndo2Brush.a).toBeGreaterThan(0);

  // Undo 3: removes eraser action → initial state restored
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(200);
  const afterUndo3 = await getImageLayerPixel(page, 64, 40);
  expect(afterUndo3.r).toBe(erasePx.r);
  expect(afterUndo3.g).toBe(erasePx.g);
  expect(afterUndo3.b).toBe(erasePx.b);
  expect(afterUndo3.a).toBe(erasePx.a);

  // Undo button disabled again (back to initial snapshot)
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  // Redo all three actions
  await page.keyboard.press("Meta+Shift+z");
  await page.waitForTimeout(200);
  await page.keyboard.press("Meta+Shift+z");
  await page.waitForTimeout(200);
  await page.keyboard.press("Meta+Shift+z");
  await page.waitForTimeout(200);

  // After redo ×3: erased pixel transparent again
  const afterRedo = await getImageLayerPixel(page, 64, 40);
  expect(afterRedo.a).toBe(0);

  // Redo button disabled (redone all)
  await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();
});
