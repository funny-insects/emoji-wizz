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

interface IndexedFrame {
  index: Uint8Array;
  palette: Palette;
  transparentIndex: number | null;
}

// gifenc reads pixels via `new Uint32Array(data.buffer)`, so the buffer must start at offset 0 and hold exactly this frame.
function exactBuffer(data: Uint8ClampedArray): Uint8ClampedArray {
  if (data.byteOffset === 0 && data.buffer.byteLength === data.byteLength) {
    return data;
  }
  return new Uint8ClampedArray(data);
}

function indexOpaque(data: Uint8ClampedArray, maxColors: number): IndexedFrame {
  const rgba = exactBuffer(data);
  const palette = quantize(rgba, maxColors);
  return {
    index: applyPalette(rgba, palette),
    palette,
    transparentIndex: null,
  };
}

function indexTransparent(
  data: Uint8ClampedArray,
  pixelCount: number,
  maxColors: number,
): IndexedFrame {
  let opaqueCount = 0;
  for (let i = 0; i < pixelCount; i++) {
    if ((data[i * 4 + 3] ?? 0) >= ALPHA_THRESHOLD) opaqueCount++;
  }
  if (opaqueCount === pixelCount) return indexOpaque(data, maxColors);
  if (opaqueCount === 0) {
    return {
      index: new Uint8Array(pixelCount),
      palette: [[0, 0, 0]],
      transparentIndex: 0,
    };
  }

  const opaque = new Uint8ClampedArray(opaqueCount * 4);
  for (let i = 0, o = 0; i < pixelCount; i++) {
    const p = i * 4;
    if ((data[p + 3] ?? 0) < ALPHA_THRESHOLD) continue;
    opaque[o] = data[p] ?? 0;
    opaque[o + 1] = data[p + 1] ?? 0;
    opaque[o + 2] = data[p + 2] ?? 0;
    opaque[o + 3] = 255;
    o += 4;
  }
  const palette = quantize(opaque, maxColors - 1);
  const index = applyPalette(exactBuffer(data), palette);
  const transparentIndex = palette.length;
  for (let i = 0; i < pixelCount; i++) {
    if ((data[i * 4 + 3] ?? 0) < ALPHA_THRESHOLD) index[i] = transparentIndex;
  }
  palette.push([0, 0, 0]);
  return { index, palette, transparentIndex };
}

export function encodeGif(
  frames: RgbaFrame[],
  width: number,
  height: number,
  opts: GifEncodeOptions,
): Uint8Array {
  if (frames.length === 0) throw new Error("encodeGif: no frames");
  const pixelCount = width * height;
  const maxColors = Math.max(2, Math.min(256, Math.floor(opts.maxColors)));
  const gif = GIFEncoder();

  frames.forEach((frame, i) => {
    if (frame.data.length !== pixelCount * 4) {
      throw new Error(
        `encodeGif: frame ${i} has ${frame.data.length} bytes, expected ${pixelCount * 4}`,
      );
    }
    const { index, palette, transparentIndex } = opts.transparent
      ? indexTransparent(frame.data, pixelCount, maxColors)
      : indexOpaque(frame.data, maxColors);
    const delayCs = Math.max(MIN_DELAY_CS, Math.round(frame.delayMs / 10));
    gif.writeFrame(index, width, height, {
      palette,
      delay: delayCs * 10,
      repeat: opts.loopCount,
      transparent: transparentIndex !== null,
      transparentIndex: transparentIndex ?? 0,
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
