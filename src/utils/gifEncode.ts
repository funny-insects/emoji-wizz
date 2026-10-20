import { GIFEncoder, applyPalette, quantize } from "gifenc";
import type { Palette } from "gifenc";

export interface RgbaFrame {
  data: Uint8ClampedArray;
  delayMs: number;
}

export interface GifEncodeOptions {
  maxColors: number;
  transparent: boolean;
  /** 0 = loop forever, n = repeat n times. */
  loopCount: number;
}

const ALPHA_THRESHOLD = 128;
const MIN_DELAY_CS = 2;
const DISPOSE_RESTORE_BACKGROUND = 2;

const PIXEL_FORMAT = "rgb444";
const MAX_PALETTE_SAMPLES = 1 << 20;

// gifenc reads pixels via `new Uint32Array(data.buffer)`, so the buffer must start at offset 0 and hold exactly this frame.
function exactBuffer(data: Uint8ClampedArray): Uint8ClampedArray {
  if (data.byteOffset === 0 && data.buffer.byteLength === data.byteLength) {
    return data;
  }
  return new Uint8ClampedArray(data);
}

function isOpaque(data: Uint8ClampedArray, pixel: number): boolean {
  return (data[pixel * 4 + 3] ?? 0) >= ALPHA_THRESHOLD;
}

/** Opaque pixels of every frame, evenly subsampled to at most MAX_PALETTE_SAMPLES. */
function paletteSamples(
  frames: RgbaFrame[],
  pixelCount: number,
  skipTransparent: boolean,
): Uint8ClampedArray {
  let total = 0;
  for (const { data } of frames) {
    for (let i = 0; i < pixelCount; i++) {
      if (!skipTransparent || isOpaque(data, i)) total++;
    }
  }
  const stride = Math.max(1, Math.ceil(total / MAX_PALETTE_SAMPLES));
  const samples = new Uint8ClampedArray(Math.ceil(total / stride) * 4);
  let seen = 0;
  let o = 0;
  for (const { data } of frames) {
    for (let i = 0; i < pixelCount; i++) {
      if (skipTransparent && !isOpaque(data, i)) continue;
      if (seen++ % stride !== 0) continue;
      const p = i * 4;
      samples[o] = data[p] ?? 0;
      samples[o + 1] = data[p + 1] ?? 0;
      samples[o + 2] = data[p + 2] ?? 0;
      samples[o + 3] = 255;
      o += 4;
    }
  }
  return samples.subarray(0, o);
}

interface SharedPalette {
  palette: Palette;
  transparentIndex: number | null;
}

function buildPalette(
  frames: RgbaFrame[],
  pixelCount: number,
  maxColors: number,
  transparent: boolean,
): SharedPalette {
  const hasTransparentPixel =
    transparent &&
    frames.some(({ data }) => {
      for (let i = 0; i < pixelCount; i++) if (!isOpaque(data, i)) return true;
      return false;
    });
  const samples = paletteSamples(frames, pixelCount, hasTransparentPixel);
  if (samples.length === 0)
    return { palette: [[0, 0, 0]], transparentIndex: 0 };
  const palette = quantize(
    exactBuffer(samples),
    hasTransparentPixel ? maxColors - 1 : maxColors,
    { format: PIXEL_FORMAT },
  );
  if (!hasTransparentPixel) return { palette, transparentIndex: null };
  const transparentIndex = palette.length;
  palette.push([0, 0, 0]);
  return { palette, transparentIndex };
}

function indexFrame(
  data: Uint8ClampedArray,
  pixelCount: number,
  { palette, transparentIndex }: SharedPalette,
): Uint8Array {
  if (palette.length === 1 && transparentIndex === 0) {
    return new Uint8Array(pixelCount);
  }
  const index = applyPalette(exactBuffer(data), palette, PIXEL_FORMAT);
  if (transparentIndex !== null) {
    for (let i = 0; i < pixelCount; i++) {
      if (!isOpaque(data, i)) index[i] = transparentIndex;
    }
  }
  return index;
}

/** All frames share one global palette quantized from every frame's pixels. */
export function encodeGif(
  frames: RgbaFrame[],
  width: number,
  height: number,
  opts: GifEncodeOptions,
): Uint8Array {
  if (frames.length === 0) throw new Error("encodeGif: no frames");
  const pixelCount = width * height;
  frames.forEach((frame, i) => {
    if (frame.data.length !== pixelCount * 4) {
      throw new Error(
        `encodeGif: frame ${i} has ${frame.data.length} bytes, expected ${pixelCount * 4}`,
      );
    }
  });
  const maxColors = Math.max(2, Math.min(256, Math.floor(opts.maxColors)));
  const shared = buildPalette(frames, pixelCount, maxColors, opts.transparent);
  const gif = GIFEncoder();

  frames.forEach((frame, i) => {
    const delayCs = Math.max(MIN_DELAY_CS, Math.round(frame.delayMs / 10));
    gif.writeFrame(indexFrame(frame.data, pixelCount, shared), width, height, {
      ...(i === 0 ? { palette: shared.palette } : {}),
      delay: delayCs * 10,
      repeat: opts.loopCount,
      transparent: shared.transparentIndex !== null,
      transparentIndex: shared.transparentIndex ?? 0,
      dispose: opts.transparent ? DISPOSE_RESTORE_BACKGROUND : -1,
    });
  });

  gif.finish();
  return gif.bytes();
}

function axisSpans(src: number, dst: number) {
  const scale = src / dst;
  const spans: { start: number; weights: number[] }[] = [];
  for (let d = 0; d < dst; d++) {
    const lo = d * scale;
    const hi = lo + scale;
    const start = Math.floor(lo);
    const end = Math.min(src, Math.ceil(hi));
    const weights: number[] = [];
    for (let s = start; s < end; s++) {
      weights.push(Math.min(hi, s + 1) - Math.max(lo, s));
    }
    spans.push({ start, weights });
  }
  return spans;
}

/** Box-filter resize with alpha-weighted color averaging. */
export function resizeRgba(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tw: number,
  th: number,
): Uint8ClampedArray {
  if (tw === w && th === h) return new Uint8ClampedArray(data);
  const out = new Uint8ClampedArray(tw * th * 4);
  const xSpans = axisSpans(w, tw);
  const ySpans = axisSpans(h, th);

  for (let ty = 0; ty < th; ty++) {
    const ys = ySpans[ty]!;
    for (let tx = 0; tx < tw; tx++) {
      const xs = xSpans[tx]!;
      let wSum = 0;
      let aSum = 0;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      for (let j = 0; j < ys.weights.length; j++) {
        const rowOffset = (ys.start + j) * w;
        const wy = ys.weights[j]!;
        for (let i = 0; i < xs.weights.length; i++) {
          const weight = wy * xs.weights[i]!;
          const p = (rowOffset + xs.start + i) * 4;
          const a = (data[p + 3] ?? 0) * weight;
          wSum += weight;
          aSum += a;
          rSum += (data[p] ?? 0) * a;
          gSum += (data[p + 1] ?? 0) * a;
          bSum += (data[p + 2] ?? 0) * a;
        }
      }
      const o = (ty * tw + tx) * 4;
      if (aSum > 0) {
        out[o] = Math.round(rSum / aSum);
        out[o + 1] = Math.round(gSum / aSum);
        out[o + 2] = Math.round(bSum / aSum);
        out[o + 3] = Math.round(aSum / wSum);
      }
    }
  }
  return out;
}

/** Keeps every other frame, folding each dropped frame's delay into the kept one before it. */
export function decimateFrames(frames: RgbaFrame[]): RgbaFrame[] {
  const out: RgbaFrame[] = [];
  for (let i = 0; i < frames.length; i += 2) {
    const kept = frames[i]!;
    const dropped = frames[i + 1];
    out.push({
      data: kept.data,
      delayMs: kept.delayMs + (dropped?.delayMs ?? 0),
    });
  }
  return out;
}

/** Keeps frames that start before maxMs; always keeps the first frame. */
export function trimFrames(frames: RgbaFrame[], maxMs: number): RgbaFrame[] {
  const out: RgbaFrame[] = [];
  let start = 0;
  for (const frame of frames) {
    if (out.length > 0 && start >= maxMs) break;
    out.push(frame);
    start += frame.delayMs;
  }
  return out;
}

export function totalDurationMs(frames: RgbaFrame[]): number {
  return frames.reduce((sum, f) => sum + f.delayMs, 0);
}

export function fps(frames: RgbaFrame[]): number {
  const ms = totalDurationMs(frames);
  return ms > 0 ? (frames.length * 1000) / ms : 0;
}
