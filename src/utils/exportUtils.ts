import Konva from "konva";
import { computeContainRect } from "./imageScaling";
import type { PlatformPreset } from "./presets";

export type ExportFormat = "png" | "gif" | "webp";

export function buildExportCanvas(
  image: HTMLImageElement,
  preset: PlatformPreset,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, preset.width, preset.height);
  const { x, y, width, height } = computeContainRect(
    image.naturalWidth,
    image.naturalHeight,
    preset.width,
    preset.height,
  );
  ctx.drawImage(image, x, y, width, height);
  return canvas;
}

export function buildFilename(format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  return `emoji-${date}.${format}`;
}

export async function exportStageAsBlob(
  stage: Konva.Stage,
): Promise<Blob | null> {
  const bgLayer = stage.getLayers()[0];
  if (bgLayer) bgLayer.visible(false);
  const dataUrl = stage.toDataURL({ pixelRatio: 1 });
  if (bgLayer) bgLayer.visible(true);
  const blob = await fetch(dataUrl).then((r) => r.blob());
  return blob;
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
