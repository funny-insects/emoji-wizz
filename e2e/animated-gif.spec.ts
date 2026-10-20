import { test, expect, type Page } from "@playwright/test";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { decompressFrames, parseGIF } from "gifuct-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const animatedGif = path.join(__dirname, "fixtures", "test-animated.gif");
const staticPng = path.join(__dirname, "fixtures", "test-emoji.png");
const largeGif = path.join(__dirname, "fixtures", "test-large-animated.gif");

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

async function downloadBytes(page: Page): Promise<Buffer> {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  return readFile(await download.path());
}

function decodeFullFrames(bytes: Buffer) {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);
  for (const f of frames) {
    expect(f.dims).toMatchObject({
      top: 0,
      left: 0,
      width: gif.lsd.width,
      height: gif.lsd.height,
    });
  }
  return { lsd: gif.lsd, frames };
}

function countDifferingPixels(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  width: number,
  box: { x0: number; y0: number; x1: number; y1: number },
) {
  let count = 0;
  for (let y = box.y0; y < box.y1; y++) {
    for (let x = box.x0; x < box.x1; x++) {
      const i = (y * width + x) * 4;
      if ([0, 1, 2, 3].some((c) => Math.abs(a[i + c]! - b[i + c]!) > 24)) {
        count++;
      }
    }
  }
  return count;
}

test.describe("animated GIF export", () => {
  test("downloads a 128×128 animated GIF with every source frame", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Multi-Image" }).click();
    await addImage(page, animatedGif);
    await expect(page.getByRole("combobox", { name: "Format" })).toHaveValue(
      "gif",
    );

    const bytes = await downloadBytes(page);
    expect(bytes.subarray(0, 6).toString("latin1")).toBe("GIF89a");
    const { lsd, frames } = decodeFullFrames(bytes);
    expect(lsd.width).toBe(128);
    expect(lsd.height).toBe(128);
    expect(frames).toHaveLength(5);
    expect(frames.map((f) => f.delay)).toEqual([100, 200, 300, 400, 500]);
    const gifBox = { x0: 60, y0: 60, x1: 68, y1: 68 };
    expect(
      countDifferingPixels(frames[0]!.patch, frames[1]!.patch, 128, gifBox),
    ).toBeGreaterThan(0);
  });

  test("a sticker appears on the first and last exported frames", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Multi-Image" }).click();
    await addImage(page, animatedGif);
    const without = decodeFullFrames(await downloadBytes(page)).frames;

    await page.getByRole("button", { name: "Burger" }).click();
    const withSticker = decodeFullFrames(await downloadBytes(page)).frames;
    expect(withSticker).toHaveLength(without.length);

    // The sticker is placed at 224..288 on the 512 stage, i.e. 56..72 at 128.
    const stickerBox = { x0: 56, y0: 56, x1: 72, y1: 72 };
    for (const i of [0, without.length - 1]) {
      const changed = countDifferingPixels(
        without[i]!.patch,
        withSticker[i]!.patch,
        128,
        stickerBox,
      );
      expect(changed).toBeGreaterThan(40);
    }
  });

  test("a static image exported as GIF is a real GIF", async ({ page }) => {
    await page
      .locator('label:has-text("Choose image") input[type="file"]')
      .setInputFiles(staticPng);
    await page.getByRole("combobox", { name: "Format" }).selectOption("gif");

    const bytes = await downloadBytes(page);
    expect(bytes.subarray(0, 6).toString("latin1")).toBe("GIF89a");
    const { lsd, frames } = decodeFullFrames(bytes);
    expect([lsd.width, lsd.height]).toEqual([128, 128]);
    expect(frames).toHaveLength(1);
  });
});

// test-large-animated.gif is 120×120, centred at 196..316; scale it to fill the stage.
async function addLargeGifFillingStage(page: Page) {
  await page.getByRole("button", { name: "Multi-Image" }).click();
  await addImage(page, largeGif);
  await expect(page.locator(".layer-row")).toHaveCount(1);
  await page.locator(".layer-row").click();

  const box = (await page.locator(".konvajs-content").first().boundingBox())!;
  const drag = async (from: number, to: number) => {
    await page.mouse.move(box.x + from, box.y + from);
    await page.mouse.down();
    await page.mouse.move(box.x + to, box.y + to, { steps: 10 });
    await page.mouse.up();
  };
  await drag(316, 508);
  await drag(196, 4);
}

test.describe("auto-fit to size limit", () => {
  test("auto-fit brings a large GIF under Slack's 128 KB limit", async ({
    page,
  }) => {
    await addLargeGifFillingStage(page);
    await expect(
      page.getByRole("checkbox", { name: "Auto-fit to size limit" }),
    ).toBeChecked();

    const started = Date.now();
    const bytes = await downloadBytes(page);
    const elapsedMs = Date.now() - started;

    expect(bytes.length).toBeLessThan(131072);
    expect(bytes.subarray(0, 6).toString("latin1")).toBe("GIF89a");
    const { lsd, frames } = decodeFullFrames(bytes);
    expect(frames.length).toBeGreaterThan(1);
    expect(lsd.width).toBeLessThanOrEqual(128);
    expect(lsd.height).toBeLessThanOrEqual(128);

    const result = page.locator(".export-result");
    await expect(result).toContainText("was");
    await expect(page.locator(".export-warning")).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
    test.info().annotations.push({
      type: "auto-fit",
      description: `${elapsedMs} ms, ${bytes.length} bytes, ${frames.length} frames, ${lsd.width}px: ${await result.textContent()}`,
    });
  });

  test("without auto-fit the full-quality GIF exceeds the limit and warns", async ({
    page,
  }) => {
    await addLargeGifFillingStage(page);
    await page
      .getByRole("checkbox", { name: "Auto-fit to size limit" })
      .uncheck();

    const bytes = await downloadBytes(page);
    expect(bytes.length).toBeGreaterThan(131072);
    expect(bytes.subarray(0, 6).toString("latin1")).toBe("GIF89a");
    await expect(page.locator(".export-warning")).toContainText(
      "exceeds Slack",
    );
    await expect(page.locator(".export-result")).toHaveCount(0);
  });
});
