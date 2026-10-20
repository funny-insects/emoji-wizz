import type { AnimationFrame } from "./canvasImageTypes";
import {
  cropCanvas,
  flipCanvas,
  reframeCanvas,
  rotateCanvas90,
} from "./imageTransforms";
import { removeBackground } from "./removeBackground";

export interface CropRegion {
  x: number;
  y: number;
  size: number;
}

export type FrameTransform = "rotateCW" | "rotateCCW" | "flipH" | "flipV";

export function mapFrames(
  frames: readonly AnimationFrame[],
  fn: (canvas: HTMLCanvasElement, index: number) => HTMLCanvasElement,
): AnimationFrame[] {
  return frames.map((frame, index) => ({
    canvas: fn(frame.canvas, index),
    delayMs: frame.delayMs,
  }));
}

export function clampCropRegion(
  region: CropRegion,
  width: number,
  height: number,
): CropRegion | null {
  const x0 = Math.max(0, region.x);
  const y0 = Math.max(0, region.y);
  const x1 = Math.min(width, region.x + region.size);
  const y1 = Math.min(height, region.y + region.size);
  if (x1 <= x0 || y1 <= y0) return null;
  const size = Math.max(1, Math.round(Math.min(x1 - x0, y1 - y0)));
  return { x: x0, y: y0, size };
}

export function cropRectToSourceRegion(
  cropRect: CropRegion,
  item: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    canvasWidth: number;
    canvasHeight: number;
  },
): CropRegion | null {
  return clampCropRegion(
    {
      x: Math.round((cropRect.x - item.x) / item.scaleX),
      y: Math.round((cropRect.y - item.y) / item.scaleY),
      size: cropRect.size / item.scaleX,
    },
    item.canvasWidth,
    item.canvasHeight,
  );
}

export function cropFrames(
  frames: readonly AnimationFrame[],
  region: CropRegion,
): AnimationFrame[] {
  return mapFrames(frames, (canvas) => cropCanvas(canvas, region));
}

export function transformFrames(
  frames: readonly AnimationFrame[],
  type: FrameTransform,
  targetW: number,
  targetH: number,
): AnimationFrame[] {
  return mapFrames(frames, (canvas) => {
    let result: HTMLCanvasElement;
    switch (type) {
      case "rotateCW":
        result = rotateCanvas90(canvas, "cw");
        break;
      case "rotateCCW":
        result = rotateCanvas90(canvas, "ccw");
        break;
      case "flipH":
        result = flipCanvas(canvas, "horizontal");
        break;
      case "flipV":
        result = flipCanvas(canvas, "vertical");
        break;
    }
    return reframeCanvas(result, targetW, targetH);
  });
}

export function removeBackgroundFrames(
  frames: readonly AnimationFrame[],
  tolerance: number,
): AnimationFrame[] {
  return mapFrames(frames, (canvas) => {
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = removeBackground(imageData, tolerance);
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext("2d")!.putImageData(result, 0, 0);
    return out;
  });
}
