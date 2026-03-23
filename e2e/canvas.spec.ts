import { test, expect } from "@playwright/test";

test("canvas renders with Slack preset dimensions", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  expect(await canvas.getAttribute("width")).toBe("128");
  expect(await canvas.getAttribute("height")).toBe("128");
});

test("canvas renders non-empty pixel data (checkerboard is drawing)", async ({
  page,
}) => {
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  await page.waitForFunction(() => {
    const el = document.querySelector("canvas") as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    return data.some((v) => v !== 0);
  });
});
