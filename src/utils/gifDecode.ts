import { decompressFrame, parseGIF } from "gifuct-js";
import type { ParsedFrame, ParsedGif } from "gifuct-js";
import type { RgbaFrame } from "./gifEncode";
import type { AnimationFrame } from "./canvasImageTypes";

export const GIF_MAX_BYTES = 20 * 1024 * 1024;
export const GIF_MAX_FRAMES = 300;
export const GIF_MAX_SCREEN = 2048;
export const GIF_MAX_TOTAL_PIXELS = 256 * 1024 * 1024;

const UNREADABLE = "This file is not a readable GIF.";

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

/** Yields the shared screen buffer after each frame is drawn; consume it before advancing. */
function* compositeScreens(
  parsed: Iterable<ParsedFrame>,
  width: number,
  height: number,
): Generator<{ screen: Uint8ClampedArray; delayMs: number }> {
  const screen = new Uint8ClampedArray(width * height * 4);

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

    yield { screen, delayMs: normalizeDelay(frame.delay ?? 0) };

    if (previous) {
      screen.set(previous);
    } else if (frame.disposalType === DISPOSE_RESTORE_BACKGROUND) {
      for (let y = y0; y < y1; y++) {
        screen.fill(0, (y * width + x0) * 4, (y * width + x1) * 4);
      }
    }
  }
}

export function compositeFrames(
  parsed: ParsedFrame[],
  width: number,
  height: number,
): RgbaFrame[] {
  const result: RgbaFrame[] = [];
  for (const { screen, delayMs } of compositeScreens(parsed, width, height)) {
    result.push({ data: screen.slice(), delayMs });
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

export function gifTooLargeMessage(bytes: number): string {
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `GIF is ${mb} MB; the limit is 20 MB.`;
}

type ImageBlock = Extract<ParsedGif["frames"][number], { image: unknown }>;

interface ValidatedGif {
  width: number;
  height: number;
  gct: ParsedGif["gct"];
  images: ImageBlock[];
  loopCount: number;
}

/** Enforces every cap using only headers and descriptors, before any pixel is decompressed. */
function parseAndValidate(buffer: ArrayBuffer): ValidatedGif {
  if (buffer.byteLength > GIF_MAX_BYTES) {
    throw new GifImportError(gifTooLargeMessage(buffer.byteLength));
  }

  const bytes = new Uint8Array(buffer);
  const signature = String.fromCharCode(...bytes.subarray(0, 3));
  if (bytes.length < 13 || signature !== "GIF") {
    throw new GifImportError(UNREADABLE);
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
    throw new GifImportError(UNREADABLE);
  }

  let parsed: ParsedGif;
  try {
    parsed = parseGIF(buffer);
  } catch {
    throw new GifImportError(UNREADABLE);
  }

  const images = parsed.frames.filter((f): f is ImageBlock => "image" in f);
  if (images.length > GIF_MAX_FRAMES) {
    throw new GifImportError(
      `GIF has ${images.length} frames; the limit is ${GIF_MAX_FRAMES}.`,
    );
  }
  if (images.length === 0) {
    throw new GifImportError("This GIF has no frames.");
  }

  let totalPixels = 0;
  for (const { image } of images) {
    const { left, top, width: fw, height: fh } = image.descriptor;
    if (left + fw > width || top + fh > height) {
      throw new GifImportError(
        `This GIF has a ${fw}×${fh} px frame outside its ${width}×${height} px canvas.`,
      );
    }
    totalPixels += width * height;
  }
  if (totalPixels > GIF_MAX_TOTAL_PIXELS) {
    throw new GifImportError(
      "This GIF has too many pixels to import; try fewer frames or a smaller size.",
    );
  }

  return {
    width,
    height,
    gct: parsed.gct,
    images,
    loopCount: readLoopCount(parsed),
  };
}

function* decompressImages(gif: ValidatedGif): Generator<ParsedFrame> {
  for (const block of gif.images) {
    let frame: ParsedFrame;
    try {
      frame = decompressFrame(block, gif.gct, true);
    } catch {
      throw new GifImportError(UNREADABLE);
    }
    yield frame;
  }
}

export function decodeGif(buffer: ArrayBuffer): DecodedGif {
  const gif = parseAndValidate(buffer);
  const frames: RgbaFrame[] = [];
  for (const { screen, delayMs } of compositeScreens(
    decompressImages(gif),
    gif.width,
    gif.height,
  )) {
    frames.push({ data: screen.slice(), delayMs });
  }
  return {
    width: gif.width,
    height: gif.height,
    frames,
    loopCount: gif.loopCount,
  };
}

export interface DecodedGifCanvases {
  frames: AnimationFrame[];
  loopCount: number;
}

/** Decodes, composites and downscales one frame at a time, keeping only the ≤ maxSize canvases. */
export function decodeGifToCanvases(
  buffer: ArrayBuffer,
  maxSize: number,
): DecodedGifCanvases {
  const gif = parseAndValidate(buffer);
  const toCanvas = screenToCanvas(gif.width, gif.height, maxSize);
  const frames: AnimationFrame[] = [];
  for (const { screen, delayMs } of compositeScreens(
    decompressImages(gif),
    gif.width,
    gif.height,
  )) {
    frames.push({ canvas: toCanvas(screen), delayMs });
  }
  return { frames, loopCount: gif.loopCount };
}

export function isGifFile(file: { type: string; name?: string }): boolean {
  return (
    file.type === "image/gif" ||
    (file.name ?? "").toLowerCase().endsWith(".gif")
  );
}

function screenToCanvas(
  width: number,
  height: number,
  maxSize: number,
): (data: Uint8ClampedArray) => HTMLCanvasElement {
  const scale = Math.min(1, maxSize / Math.max(width, height, 1));
  const outWidth = Math.max(1, Math.round(width * scale));
  const outHeight = Math.max(1, Math.round(height * scale));
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceCtx = source.getContext("2d");

  return (data) => {
    const canvas = document.createElement("canvas");
    if (scale === 1) {
      canvas.width = width;
      canvas.height = height;
      canvas
        .getContext("2d")
        ?.putImageData(new ImageData(data, width, height), 0, 0);
      return canvas;
    }
    sourceCtx?.putImageData(new ImageData(data, width, height), 0, 0);
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, outWidth, outHeight);
    }
    return canvas;
  };
}

export function rgbaFramesToCanvases(
  decoded: DecodedGif,
  maxSize: number,
): AnimationFrame[] {
  const toCanvas = screenToCanvas(decoded.width, decoded.height, maxSize);
  return decoded.frames.map((frame) => ({
    canvas: toCanvas(frame.data),
    delayMs: frame.delayMs,
  }));
}
