import { describe, expect, it } from "vitest";
import { decompressFrames, parseGIF } from "gifuct-js";
import type { ParsedGif } from "gifuct-js";
import {
  decimateFrames,
  encodeGif,
  fps,
  resizeRgba,
  totalDurationMs,
  trimFrames,
} from "./gifEncode";
import type { RgbaFrame } from "./gifEncode";

function solidFrame(
  w: number,
  h: number,
  rgba: [number, number, number, number],
  delayMs = 100,
): RgbaFrame {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set(rgba, i * 4);
  return { data, delayMs };
}

function gradientFrame(w: number, h: number, delayMs = 100): RgbaFrame {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      data[p] = (x * 255) / (w - 1);
      data[p + 1] = (y * 255) / (h - 1);
      data[p + 2] = ((x + y) * 255) / (w + h - 2);
      data[p + 3] = 255;
    }
  }
  return { data, delayMs };
}

function frameOfDelay(delayMs: number): RgbaFrame {
  return { data: new Uint8ClampedArray(4), delayMs };
}

function decode(bytes: Uint8Array) {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const parsed = parseGIF(buffer);
  return { parsed, frames: decompressFrames(parsed, true) };
}

function loopCountOf(parsed: ParsedGif): number | null {
  for (const block of parsed.frames) {
    if ("application" in block && block.application.id === "NETSCAPE2.0") {
      const b = block.application.blocks;
      return (b[1] ?? 0) | ((b[2] ?? 0) << 8);
    }
  }
  return null;
}

const opts = { maxColors: 256, transparent: false, loopCount: 0 };

describe("encodeGif", () => {
  it("writes a GIF89a header", () => {
    const bytes = encodeGif([solidFrame(4, 4, [255, 0, 0, 255])], 4, 4, opts);
    expect(new TextDecoder().decode(bytes.slice(0, 6))).toBe("GIF89a");
  });

  it("round-trips frame count, dimensions and delays", () => {
    const frames = [
      solidFrame(6, 5, [255, 0, 0, 255], 100),
      solidFrame(6, 5, [0, 255, 0, 255], 40),
      solidFrame(6, 5, [0, 0, 255, 255], 5),
    ];
    const { parsed, frames: out } = decode(encodeGif(frames, 6, 5, opts));
    expect(parsed.lsd.width).toBe(6);
    expect(parsed.lsd.height).toBe(5);
    expect(out).toHaveLength(3);
    expect(out.map((f) => f.delay)).toEqual([100, 40, 20]);
    expect(out[1]!.dims).toMatchObject({ width: 6, height: 5 });
  });

  it("rounds delays to centiseconds", () => {
    const { frames: out } = decode(
      encodeGif([solidFrame(2, 2, [0, 0, 0, 255], 67)], 2, 2, opts),
    );
    expect(out[0]!.delay).toBe(70);
  });

  it("writes an infinite loop when loopCount is 0", () => {
    const { parsed } = decode(
      encodeGif([solidFrame(2, 2, [0, 0, 0, 255])], 2, 2, opts),
    );
    expect(loopCountOf(parsed)).toBe(0);
  });

  it("writes a finite loop count", () => {
    const { parsed } = decode(
      encodeGif([solidFrame(2, 2, [0, 0, 0, 255])], 2, 2, {
        ...opts,
        loopCount: 3,
      }),
    );
    expect(loopCountOf(parsed)).toBe(3);
  });

  it("preserves transparency and opaque colors", () => {
    const frame = solidFrame(4, 4, [200, 30, 90, 255]);
    frame.data.set([10, 20, 30, 0], 0);
    frame.data.set([10, 20, 30, 60], 4);
    const { frames: out } = decode(
      encodeGif([frame, frame], 4, 4, { ...opts, transparent: true }),
    );
    for (const f of out) {
      expect(f.patch[3]).toBe(0);
      expect(f.patch[7]).toBe(0);
      expect(f.patch[4 * 5 + 3]).toBe(255);
      expect(Math.abs(f.patch[4 * 5]! - 200)).toBeLessThanOrEqual(8);
      expect(Math.abs(f.patch[4 * 5 + 1]! - 30)).toBeLessThanOrEqual(8);
      expect(Math.abs(f.patch[4 * 5 + 2]! - 90)).toBeLessThanOrEqual(8);
      expect(f.disposalType).toBe(2);
    }
  });

  it("writes fully opaque frames without a transparent index", () => {
    const { parsed } = decode(
      encodeGif([solidFrame(2, 2, [1, 2, 3, 255])], 2, 2, {
        ...opts,
        transparent: true,
      }),
    );
    const gce = parsed.frames.find((f) => "gce" in f);
    expect(gce && "gce" in gce && gce.gce.extras.transparentColorGiven).toBe(
      false,
    );
  });

  it("encodes a fully transparent frame", () => {
    const { frames: out } = decode(
      encodeGif([solidFrame(3, 3, [50, 50, 50, 0])], 3, 3, {
        ...opts,
        transparent: true,
      }),
    );
    expect(Array.from(out[0]!.patch).filter((_, i) => i % 4 === 3)).toEqual(
      Array(9).fill(0),
    );
  });

  it("respects maxColors", () => {
    for (const maxColors of [32, 64]) {
      const { frames: out } = decode(
        encodeGif([gradientFrame(32, 32)], 32, 32, { ...opts, maxColors }),
      );
      expect(new Set(out[0]!.pixels).size).toBeLessThanOrEqual(maxColors);
    }
    const { frames: out } = decode(
      encodeGif([gradientFrame(32, 32)], 32, 32, {
        ...opts,
        maxColors: 32,
        transparent: true,
      }),
    );
    expect(new Set(out[0]!.pixels).size).toBeLessThanOrEqual(32);
  });

  it("accepts frame data that is a view into a larger buffer", () => {
    const backing = new Uint8ClampedArray(8 + 16);
    const view = new Uint8ClampedArray(backing.buffer, 8, 16);
    view.fill(255);
    const { frames: out } = decode(
      encodeGif([{ data: view, delayMs: 100 }], 2, 2, opts),
    );
    expect(Array.from(out[0]!.patch.slice(0, 4))).toEqual([255, 255, 255, 255]);
  });

  it("rejects frames of the wrong size", () => {
    expect(() =>
      encodeGif([solidFrame(2, 2, [0, 0, 0, 255])], 3, 3, opts),
    ).toThrow();
  });
});

describe("resizeRgba", () => {
  it("averages 2×2 blocks when halving", () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 100, 100, 255, 200, 200, 200, 255, 100, 100, 100, 255,
    ]);
    expect(Array.from(resizeRgba(data, 2, 2, 1, 1))).toEqual([
      100, 100, 100, 255,
    ]);
  });

  it("weights color by alpha so transparent pixels don't darken edges", () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0,
    ]);
    expect(Array.from(resizeRgba(data, 2, 2, 1, 1))).toEqual([255, 0, 0, 128]);
  });

  it("keeps fully transparent areas at zero", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    expect(resizeRgba(data, 4, 4, 2, 2).every((v) => v === 0)).toBe(true);
  });

  it("handles fractional ratios with partial coverage", () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 90, 90, 90, 255, 180, 180, 180, 255,
    ]);
    expect(Array.from(resizeRgba(data, 3, 1, 2, 1))).toEqual([
      30, 30, 30, 255, 150, 150, 150, 255,
    ]);
  });

  it("returns a copy at the same size", () => {
    const data = new Uint8ClampedArray([1, 2, 3, 4]);
    const out = resizeRgba(data, 1, 1, 1, 1);
    expect(Array.from(out)).toEqual([1, 2, 3, 4]);
    expect(out).not.toBe(data);
  });

  it("replicates pixels when upscaling", () => {
    const data = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]);
    expect(Array.from(resizeRgba(data, 2, 1, 4, 1))).toEqual([
      10, 20, 30, 255, 10, 20, 30, 255, 40, 50, 60, 255, 40, 50, 60, 255,
    ]);
  });
});

describe("frame timing helpers", () => {
  it("decimateFrames keeps even frames and preserves total duration", () => {
    const frames = [10, 20, 30, 40, 50].map(frameOfDelay);
    const out = decimateFrames(frames);
    expect(out.map((f) => f.delayMs)).toEqual([30, 70, 50]);
    expect(out[1]!.data).toBe(frames[2]!.data);
    expect(totalDurationMs(out)).toBe(totalDurationMs(frames));
  });

  it("trimFrames keeps frames starting before the cutoff", () => {
    const frames = [500, 500, 500, 500, 500].map(frameOfDelay);
    expect(trimFrames(frames, 1500)).toHaveLength(3);
    expect(trimFrames(frames, 1501)).toHaveLength(4);
    expect(trimFrames(frames, 10000)).toHaveLength(5);
  });

  it("trimFrames always keeps the first frame", () => {
    expect(trimFrames([frameOfDelay(5000)], 1000)).toHaveLength(1);
    expect(trimFrames([frameOfDelay(100)], 0)).toHaveLength(1);
  });

  it("fps is frames per second of total duration", () => {
    expect(fps([100, 100, 100, 100].map(frameOfDelay))).toBe(10);
    expect(fps([frameOfDelay(0)])).toBe(0);
  });
});
