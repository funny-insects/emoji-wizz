import { test, expect, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const animatedGif = path.join(__dirname, "fixtures", "test-animated.gif");
const staticPng = path.join(__dirname, "fixtures", "test-emoji.png");

// test-animated.gif is 32×32, centred on the 512 stage at (240, 240).
// At local (8, 8): frame 0 is red, frame 1 blue, frame 2 green, frames 3–4 transparent.
const SAMPLE = { x: 248, y: 248 };

async function addImage(page: Page, file: string) {
  await page
    .locator('label:has-text("Add image") input[type="file"]')
    .setInputFiles(file);
}

async function imageLayerPixel(page: Page, x: number, y: number) {
  return page.evaluate(
    ([px, py]) => {
      const el = document.querySelectorAll(".konvajs-content canvas")[1] as
        | HTMLCanvasElement
        | undefined;
      const d = el?.getContext("2d")?.getImageData(px, py, 1, 1).data;
      return d ? [d[0]!, d[1]!, d[2]!, d[3]!] : [0, 0, 0, 0];
    },
    [x, y] as [number, number],
  );
}

async function expectPixel(
  page: Page,
  x: number,
  y: number,
  rgba: [number, number, number, number],
) {
  await expect
    .poll(() => imageLayerPixel(page, x, y), { timeout: 3000 })
    .toEqual(rgba);
}

const RED: [number, number, number, number] = [255, 0, 0, 255];
const BLUE: [number, number, number, number] = [0, 0, 255, 255];

async function pauseAndScrub(page: Page, frame: number) {
  const pause = page.getByRole("button", { name: "Pause animation" });
  if (await pause.isVisible()) await pause.click();
  await page.getByRole("slider", { name: "Frame" }).fill(String(frame));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("uploading an animated GIF shows a GIF badge, frame count and playback control", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await addImage(page, animatedGif);

  const row = page.locator(".layer-row");
  await expect(row).toHaveCount(1);
  await expect(row.locator(".layer-badge")).toHaveText("GIF");
  await expect(row.locator(".layer-frame-count")).toHaveText("5 frames");
  await expect(
    page.getByRole("button", { name: "Pause animation" }),
  ).toBeVisible();
  await expect(page.getByRole("slider", { name: "Frame" })).toHaveCount(0);
});

test("the GIF animates on the canvas and the scrubber shows a chosen frame", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await addImage(page, animatedGif);

  await page.waitForFunction(
    ([x, y]) => {
      const el = document.querySelectorAll(".konvajs-content canvas")[1] as
        | HTMLCanvasElement
        | undefined;
      const d = el?.getContext("2d")?.getImageData(x, y, 1, 1).data;
      if (!d) return false;
      const w = window as unknown as { __seen?: Set<string> };
      w.__seen ??= new Set();
      w.__seen.add(Array.from(d).join(","));
      return w.__seen.size >= 3;
    },
    [SAMPLE.x, SAMPLE.y] as [number, number],
    { polling: 16, timeout: 5000 },
  );

  await pauseAndScrub(page, 0);
  await expect(page.getByText("Frame 1 / 5")).toBeVisible();
  await expectPixel(page, SAMPLE.x, SAMPLE.y, RED);

  await pauseAndScrub(page, 1);
  await expect(page.getByText("Frame 2 / 5")).toBeVisible();
  await expectPixel(page, SAMPLE.x, SAMPLE.y, BLUE);

  await page.getByRole("button", { name: "Play animation" }).click();
  await expect(page.getByRole("slider", { name: "Frame" })).toHaveCount(0);
});

test("uploading an animated GIF in Single Image mode switches to Multi-Image", async ({
  page,
}) => {
  await page
    .locator('label:has-text("Choose image") input[type="file"]')
    .setInputFiles(animatedGif);

  await expect(page.locator(".layer-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Multi-Image" })).toHaveClass(
    /mode-btn--active/,
  );
  await expect(page.locator(".layer-row .layer-badge")).toHaveText("GIF");
  await expect(page.locator(".layer-row .layer-frame-count")).toHaveText(
    "5 frames",
  );
});

test("a second animated GIF is rejected with a message; static images still add", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await addImage(page, animatedGif);
  await expect(page.locator(".layer-row")).toHaveCount(1);

  await addImage(page, animatedGif);
  await expect(page.getByRole("alert")).toHaveText(
    "Only one animated GIF per composition is supported.",
  );
  await expect(page.locator(".layer-row")).toHaveCount(1);

  await addImage(page, staticPng);
  await expect(page.locator(".layer-row")).toHaveCount(2);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("dragging the GIF moves it and it keeps every frame", async ({ page }) => {
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await addImage(page, animatedGif);
  await expect(page.locator(".layer-row")).toHaveCount(1);

  const box = await page.locator(".konvajs-content").first().boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 256, box!.y + 256);
  await page.mouse.down();
  await page.mouse.move(box!.x + 306, box!.y + 306, { steps: 10 });
  await page.mouse.up();

  const moved = { x: SAMPLE.x + 50, y: SAMPLE.y + 50 };
  await pauseAndScrub(page, 0);
  await expectPixel(page, moved.x, moved.y, RED);
  await pauseAndScrub(page, 1);
  await expectPixel(page, moved.x, moved.y, BLUE);
  await expectPixel(page, SAMPLE.x, SAMPLE.y, [0, 0, 0, 0]);

  await page.keyboard.press("ControlOrMeta+z");
  await expect(page.locator(".layer-row .layer-frame-count")).toHaveText(
    "5 frames",
  );
  await pauseAndScrub(page, 1);
  await expectPixel(page, SAMPLE.x, SAMPLE.y, BLUE);
});
