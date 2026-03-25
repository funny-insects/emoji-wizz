import { computeContainRect } from "./imageScaling";

/**
 * Rotate a canvas 90 degrees clockwise or counter-clockwise.
 * Returns a new canvas with swapped width/height.
 */
export function rotateCanvas90(
  canvas: HTMLCanvasElement,
  direction: "cw" | "ccw",
): HTMLCanvasElement {
  const result = document.createElement("canvas");
  result.width = canvas.height;
  result.height = canvas.width;
  const ctx = result.getContext("2d")!;
  if (direction === "cw") {
    ctx.translate(result.width, 0);
    ctx.rotate(Math.PI / 2);
  } else {
    ctx.translate(0, result.height);
    ctx.rotate(-Math.PI / 2);
  }
  ctx.drawImage(canvas, 0, 0);
  return result;
}

/**
 * Flip a canvas along the horizontal or vertical axis.
 * Returns a new canvas with same dimensions.
 */
export function flipCanvas(
  canvas: HTMLCanvasElement,
  axis: "horizontal" | "vertical",
): HTMLCanvasElement {
  const result = document.createElement("canvas");
  result.width = canvas.width;
  result.height = canvas.height;
  const ctx = result.getContext("2d")!;
  if (axis === "horizontal") {
    ctx.translate(result.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, result.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(canvas, 0, 0);
  return result;
}

/**
 * Crop a square region from a canvas.
 * Returns a new canvas of size × size.
 */
export function cropCanvas(
  canvas: HTMLCanvasElement,
  region: { x: number; y: number; size: number },
): HTMLCanvasElement {
  const result = document.createElement("canvas");
  result.width = region.size;
  result.height = region.size;
  const ctx = result.getContext("2d")!;
  ctx.drawImage(
    canvas,
    region.x,
    region.y,
    region.size,
    region.size,
    0,
    0,
    region.size,
    region.size,
  );
  return result;
}

/**
 * Scale and center canvas content onto a new canvas of the given dimensions,
 * preserving aspect ratio (contain fit).
 */
export function reframeCanvas(
  canvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const result = document.createElement("canvas");
  result.width = targetWidth;
  result.height = targetHeight;
  const ctx = result.getContext("2d")!;
  const rect = computeContainRect(
    canvas.width,
    canvas.height,
    targetWidth,
    targetHeight,
  );
  ctx.drawImage(canvas, rect.x, rect.y, rect.width, rect.height);
  return result;
}
