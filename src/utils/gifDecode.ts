import { decompressFrames, parseGIF } from "gifuct-js";
import type { ParsedFrame, ParsedGif } from "gifuct-js";
import type { RgbaFrame } from "./gifEncode";

export const GIF_MAX_BYTES = 20 * 1024 * 1024;
export const GIF_MAX_FRAMES = 300;
export const GIF_MAX_SCREEN = 2048;

export class GifImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GifImportError";
  }
}

export type { RgbaFrame };

export interface DecodedGif {
  width: number;
  height: number;
  frames: RgbaFrame[];
  loopCount: number;
}

const DISPOSE_RESTORE_BACKGROUND = 2;
const DISPOSE_RESTORE_PREVIOUS = 3;

export function normalizeDelay(ms: number): number {
  return ms <= 10 ? 100 : ms;
}

export function compositeFrames(
  parsed: ParsedFrame[],
  width: number,
  height: number,
): RgbaFrame[] {
  const screen = new Uint8ClampedArray(width * height * 4);
  const result: RgbaFrame[] = [];

  for (const frame of parsed) {
    const { left, top, width: fw, height: fh } = frame.dims;
    const x0 = Math.max(0, left);
    const y0 = Math.max(0, top);
    const x1 = Math.min(width, left + fw);
    const y1 = Math.min(height, top + fh);
    const previous =
      frame.disposalType === DISPOSE_RESTORE_PREVIOUS
        ? screen.slice()
        : undefined;

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const src = ((y - top) * fw + (x - left)) * 4;
        if (frame.patch[src + 3] === 0) continue;
        screen.set(frame.patch.subarray(src, src + 4), (y * width + x) * 4);
      }
    }

    result.push({
      data: screen.slice(),
      delayMs: normalizeDelay(frame.delay ?? 0),
    });

    if (previous) {
      screen.set(previous);
    } else if (frame.disposalType === DISPOSE_RESTORE_BACKGROUND) {
      for (let y = y0; y < y1; y++) {
        screen.fill(0, (y * width + x0) * 4, (y * width + x1) * 4);
      }
    }
  }

  return result;
}

function readLoopCount(parsed: ParsedGif): number {
  for (const block of parsed.frames) {
    if (!("application" in block)) continue;
    const { id, blocks } = block.application;
    const [subBlockId, low = 0, high = 0] = blocks;
    if (id === "NETSCAPE2.0" && subBlockId === 1) return low | (high << 8);
  }
  return 0;
}

export function decodeGif(buffer: ArrayBuffer): DecodedGif {
  if (buffer.byteLength > GIF_MAX_BYTES) {
    const mb = (buffer.byteLength / (1024 * 1024)).toFixed(1);
    throw new GifImportError(`GIF is ${mb} MB; the limit is 20 MB.`);
  }

  const bytes = new Uint8Array(buffer);
  const signature = String.fromCharCode(...bytes.subarray(0, 3));
  if (bytes.length < 13 || signature !== "GIF") {
    throw new GifImportError("This file is not a readable GIF.");
  }
  const view = new DataView(buffer);
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  if (width > GIF_MAX_SCREEN || height > GIF_MAX_SCREEN) {
    throw new GifImportError(
      `GIF is ${width}×${height} px; the limit is ${GIF_MAX_SCREEN}×${GIF_MAX_SCREEN}.`,
    );
  }
  if (width === 0 || height === 0) {
    throw new GifImportError("This file is not a readable GIF.");
  }

  let parsed: ParsedGif;
  try {
    parsed = parseGIF(buffer);
  } catch {
    throw new GifImportError("This file is not a readable GIF.");
  }

  const frameCount = parsed.frames.filter((f) => "image" in f).length;
  if (frameCount > GIF_MAX_FRAMES) {
    throw new GifImportError(
      `GIF has ${frameCount} frames; the limit is ${GIF_MAX_FRAMES}.`,
    );
  }
  if (frameCount === 0) {
    throw new GifImportError("This GIF has no frames.");
  }

  let frames: RgbaFrame[];
  try {
    frames = compositeFrames(decompressFrames(parsed, true), width, height);
  } catch {
    throw new GifImportError("This file is not a readable GIF.");
  }

  return { width, height, frames, loopCount: readLoopCount(parsed) };
}

export function isGifFile(file: { type: string; name?: string }): boolean {
  return (
    file.type === "image/gif" ||
    (file.name ?? "").toLowerCase().endsWith(".gif")
  );
}

export function rgbaFramesToCanvases(
  decoded: DecodedGif,
  maxSize: number,
): { canvas: HTMLCanvasElement; delayMs: number }[] {
  const { width, height } = decoded;
  const scale = Math.min(1, maxSize / Math.max(width, height, 1));
  const outWidth = Math.max(1, Math.round(width * scale));
  const outHeight = Math.max(1, Math.round(height * scale));

  return decoded.frames.map((frame) => {
    const source = document.createElement("canvas");
    source.width = width;
    source.height = height;
    source
      .getContext("2d")
      ?.putImageData(new ImageData(frame.data, width, height), 0, 0);
    if (scale === 1) return { canvas: source, delayMs: frame.delayMs };

    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, outWidth, outHeight);
    }
    return { canvas, delayMs: frame.delayMs };
  });
}
