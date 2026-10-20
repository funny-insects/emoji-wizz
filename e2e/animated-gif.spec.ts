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

async function dragOnStage(
  page: Page,
  from: [number, number],
  to: [number, number],
) {
  const box = (await page.locator(".konvajs-content").first().boundingBox())!;
  await page.mouse.move(box.x + from[0], box.y + from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + to[0], box.y + to[1], { steps: 10 });
  await page.mouse.up();
}

function pixelAt(
  frame: { patch: Uint8ClampedArray },
  x: number,
  y: number,
): number[] {
  const i = (y * 128 + x) * 4;
  return Array.from(frame.patch.subarray(i, i + 4));
}

function expectColor(actual: number[], rgba: number[]) {
  actual.forEach((v, c) => expect(Math.abs(v - rgba[c]!)).toBeLessThan(40));
}

test.describe("GIF crop", () => {
  test("cropping a GIF crops every frame to the chosen square", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Multi-Image" }).click();
    await addImage(page, animatedGif);
    await page.locator(".layer-row").click();
    await page.locator(".konvajs-content").first().scrollIntoViewIfNeeded();

    // The 32 px GIF sits at 240..272; the crop rect starts at 80% (26 px at 243).
    // Move it onto the GIF's top-left corner: source 0..26.
    await page.getByRole("button", { name: "Crop" }).click();
    await dragOnStage(page, [256, 256], [253, 253]);
    await expect(
      page.getByRole("button", { name: "Pause animation" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirm Crop" }).click();
    await expect(page.locator(".layer-row .layer-frame-count")).toHaveText(
      "5 frames",
    );

    const { frames } = decodeFullFrames(await downloadBytes(page));
    expect(frames).toHaveLength(5);
    // Output pixel 62 is source 8..12; source x/y 16 splits the fixture's halves.
    expectColor(pixelAt(frames[0]!, 62, 62), [255, 0, 0, 255]);
    expectColor(pixelAt(frames[1]!, 62, 62), [0, 0, 255, 255]);
    expectColor(pixelAt(frames[2]!, 62, 62), [0, 255, 0, 255]);
    // Output pixel 67 is source 28..32: red in the uncropped frame 0, gone after the crop.
    for (const f of frames) {
      expect(pixelAt(f, 67, 62)[3]).toBe(0);
      expect(pixelAt(f, 62, 67)[3]).toBe(0);
    }
  });

  test("cropping at an offset keeps the content under the crop rect", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Multi-Image" }).click();
    await addImage(page, animatedGif);
    await page.locator(".layer-row").click();
    await page.locator(".konvajs-content").first().scrollIntoViewIfNeeded();

    // Move the 26 px crop rect from 243 to 249: source 9..32 survives (clipped to 23 px).
    await page.getByRole("button", { name: "Crop" }).click();
    await dragOnStage(page, [256, 256], [262, 262]);
    await page.getByRole("button", { name: "Confirm Crop" }).click();
    await expect(page.locator(".layer-row .layer-frame-count")).toHaveText(
      "5 frames",
    );

    const { frames } = decodeFullFrames(await downloadBytes(page));
    expect(frames).toHaveLength(5);
    // Output pixel n covers stage 4n..4n+4, i.e. source 4n-240..4n-236.
    for (const f of frames) {
      expect(pixelAt(f, 60, 64)[3]).toBe(0);
      expect(pixelAt(f, 64, 60)[3]).toBe(0);
    }
    expectColor(pixelAt(frames[1]!, 66, 66), [255, 0, 0, 255]);
    // Frame 3's white square is source 12..20; a misapplied offset would shift it right.
    expectColor(pixelAt(frames[3]!, 64, 64), [255, 255, 255, 255]);
    expectColor(pixelAt(frames[4]!, 66, 66), [255, 255, 0, 255]);
  });
});

test.describe("other tools on an animated GIF", () => {
  test("drawing tools are disabled while the GIF is selected", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Multi-Image" }).click();
    await addImage(page, animatedGif);
    await page.getByRole("button", { name: "Brush" }).click();
    await expect(page.getByRole("button", { name: "Brush" })).toHaveClass(
      /toolbar-btn--active/,
    );

    await page.locator(".layer-row").click();
    await expect(page.getByRole("button", { name: "Pointer" })).toHaveClass(
      /toolbar-btn--active/,
    );
    for (const name of ["Brush", "Eraser", "Text"]) {
      const button = page.getByRole("button", { name });
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute(
        "title",
        "Not available for animated GIFs",
      );
    }
  });

  test("flipping the GIF horizontally mirrors every frame", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Multi-Image" }).click();
    await addImage(page, animatedGif);
    await page.locator(".layer-row").click();
    await page.getByRole("button", { name: "Flip Horizontal" }).click();

    const { frames } = decodeFullFrames(await downloadBytes(page));
    expect(frames).toHaveLength(5);
    // The GIF covers output 60..68; frame 2 is green on its left half before flipping.
    expectColor(pixelAt(frames[2]!, 61, 63), [255, 0, 0, 255]);
    expectColor(pixelAt(frames[2]!, 66, 63), [0, 255, 0, 255]);
    // Frame 4's yellow quadrant moves from bottom-right to bottom-left.
    expectColor(pixelAt(frames[4]!, 61, 66), [255, 255, 0, 255]);
    expect(pixelAt(frames[4]!, 66, 66)[3]).toBe(0);
  });
});
