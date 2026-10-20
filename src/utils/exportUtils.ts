import type { PlatformPreset } from "./presets";

export type ExportFormat = "png" | "gif" | "webp";

export function buildFilename(
  format: ExportFormat,
  platformId?: string,
): string {
  const date = new Date().toISOString().slice(0, 10);
  if (platformId) {
    return `emoji-${platformId}-${date}.${format}`;
  }
  return `emoji-${date}.${format}`;
}

export function downscaleCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  if (
    sourceCanvas.width === targetWidth &&
    sourceCanvas.height === targetHeight
  ) {
    return sourceCanvas;
  }

  // For 4x reduction (e.g. 512→128), use two-step downscaling for quality
  if (sourceCanvas.width >= targetWidth * 4) {
    const midWidth = Math.round(sourceCanvas.width / 2);
    const midHeight = Math.round(sourceCanvas.height / 2);
    const mid = document.createElement("canvas");
    mid.width = midWidth;
    mid.height = midHeight;
    const midCtx = mid.getContext("2d")!;
    midCtx.imageSmoothingEnabled = true;
    midCtx.imageSmoothingQuality = "high";
    midCtx.drawImage(sourceCanvas, 0, 0, midWidth, midHeight);

    const result = document.createElement("canvas");
    result.width = targetWidth;
    result.height = targetHeight;
    const ctx = result.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(mid, 0, 0, targetWidth, targetHeight);
    return result;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  return canvas;
}

export function checkFileSizeWarning(
  blobSizeBytes: number,
  preset: PlatformPreset,
): string | null {
  const limitBytes = preset.maxFileSizeKb * 1024;
  if (blobSizeBytes > limitBytes) {
    const sizeKb = Math.round(blobSizeBytes / 1024);
    return `Warning: file is ${sizeKb} KB, exceeds ${preset.label}'s ${preset.maxFileSizeKb} KB limit`;
  }
  return null;
}
