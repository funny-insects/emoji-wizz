import { describe, expect, it } from "vitest";
import { describeFit, fitToSizeLimit } from "./fitToSizeLimit";
import type { EncodeFn, FitInput, FitResult } from "./fitToSizeLimit";
import type { RgbaFrame } from "./gifEncode";

function makeFrames(
  count: number,
  delayMs: number,
  width = 128,
  height = 128,
): RgbaFrame[] {
  const data = new Uint8ClampedArray(width * height * 4);
  return Array.from({ length: count }, () => ({ data, delayMs }));
}

function input(
  frames: RgbaFrame[],
  limitBytes: number,
  width = 128,
  height = 128,
): FitInput {
  return {
    frames,
    width,
    height,
    transparent: false,
    loopCount: 0,
    limitBytes,
  };
}

function mockEncoder() {
  const calls: string[] = [];
  const sizes: number[] = [];
  const encode: EncodeFn = (frames, width, height, opts) => {
    calls.push(
      `${opts.maxColors}|${frames.length}|${width}x${height}|${frames.reduce((s, f) => s + f.delayMs, 0)}`,
    );
    const size = Math.round(
      (opts.maxColors * frames.length * width * height) / 1024,
    );
    sizes.push(size);
    return new Uint8Array(size);
  };
  return { encode, calls, sizes };
}

describe("fitToSizeLimit", () => {
  it("does a single encode when full quality fits", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(10, 100), 40960),
      mock.encode,
    );
    expect(result.fits).toBe(true);
    expect(result.encodes).toBe(1);
    expect(mock.calls).toHaveLength(1);
    expect(result.settings).toEqual({
      colors: 256,
      decimation: 0,
      width: 128,
      height: 128,
      trimMs: null,
    });
    expect(result.originalBytes).toBe(40960);
  });

  it("chooses 128 colors when it fits, not 64", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(10, 100), 20480),
      mock.encode,
    );
    expect(result.fits).toBe(true);
    expect(result.settings.colors).toBe(128);
    expect(result.bytes.length).toBe(20480);
    expect(result.encodes).toBe(3);
  });

  it("stops after the palette when that suffices", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(40, 25), 15000 * 4),
      mock.encode,
    );
    expect(result.settings).toMatchObject({
      colors: 64,
      decimation: 0,
      width: 128,
      trimMs: null,
    });
    expect(mock.calls.every((c) => c.includes("|40|128x128|"))).toBe(true);
  });

  it("decimates only after the palette is exhausted", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(input(makeFrames(40, 25), 6000), mock.encode);
    expect(result.settings).toMatchObject({
      colors: 32,
      decimation: 2,
      width: 128,
    });
    expect(result.fps).toBe(10);
    expect(result.durationMs).toBe(1000);
  });

  it("picks the least decimation that fits", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(40, 25), 10240),
      mock.encode,
    );
    expect(result.settings).toMatchObject({ colors: 32, decimation: 1 });
    expect(result.fps).toBe(20);
  });

  it("does not decimate below 8 fps", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(12, 1000 / 12), 3000),
      mock.encode,
    );
    expect(result.settings.decimation).toBe(0);
    expect(mock.calls.every((c) => c.includes("|12|"))).toBe(true);
    expect(result.settings.width).toBeLessThan(128);
  });

  it("skips decimation when the source is already below 8 fps", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(input(makeFrames(5, 200), 1000), mock.encode);
    expect(result.settings.decimation).toBe(0);
    expect(mock.calls.every((c) => c.includes("|5|"))).toBe(true);
  });

  it("shrinks dimensions only after palette and decimation are exhausted", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(10, 100), 3000),
      mock.encode,
    );
    expect(result.settings).toEqual({
      colors: 32,
      decimation: 0,
      width: 96,
      height: 96,
      trimMs: null,
    });
    const firstResize = mock.calls.findIndex((c) => !c.includes("128x128"));
    expect(
      mock.calls.slice(0, firstResize).some((c) => c.startsWith("32|")),
    ).toBe(true);
    expect(
      mock.calls.slice(firstResize).every((c) => c.startsWith("32|")),
    ).toBe(true);
  });

  it("keeps the aspect ratio when resizing", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(10, 100, 128, 64), 700, 128, 64),
      mock.encode,
    );
    expect(result.settings).toMatchObject({ width: 64, height: 32 });
  });

  it("trims duration last and reports it", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(50, 100), 3000),
      mock.encode,
    );
    expect(result.fits).toBe(true);
    expect(result.settings).toMatchObject({
      colors: 32,
      width: 64,
      trimMs: 2000,
    });
    expect(result.durationMs).toBe(2000);
    expect(result.originalDurationMs).toBe(5000);
    expect(describeFit(result)).toContain("trimmed to 2.0 s of 5.0 s");
  });

  it("only applies trim levels shorter than the animation", () => {
    const mock = mockEncoder();
    fitToSizeLimit(input(makeFrames(25, 100), 1), mock.encode);
    expect(mock.calls.some((c) => c.endsWith("|2500"))).toBe(true);
    expect(mock.calls.every((c) => !c.endsWith("|3000"))).toBe(true);
  });

  it("falls back to the smallest result when nothing fits", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(input(makeFrames(50, 100), 100), mock.encode);
    expect(result.fits).toBe(false);
    expect(result.bytes.length).toBe(Math.min(...mock.sizes));
    expect(result.settings).toMatchObject({
      colors: 32,
      width: 64,
      trimMs: 1500,
    });
  });

  it("never encodes the same configuration twice", () => {
    for (const limit of [100, 3000, 6000, 20480]) {
      const mock = mockEncoder();
      fitToSizeLimit(input(makeFrames(50, 100), limit), mock.encode);
      expect(new Set(mock.calls).size).toBe(mock.calls.length);
    }
  });

  it("needs at most 8 encodes in a typical case", () => {
    const mock = mockEncoder();
    const result = fitToSizeLimit(
      input(makeFrames(24, 1000 / 24), 4000),
      mock.encode,
    );
    expect(result.fits).toBe(true);
    expect(result.encodes).toBe(mock.calls.length);
    expect(result.encodes).toBeLessThanOrEqual(8);
  });

  it("reports progress before each encode", () => {
    const mock = mockEncoder();
    const progress: { step: number; total: number }[] = [];
    const result = fitToSizeLimit(
      input(makeFrames(50, 100), 100),
      mock.encode,
      (p) => progress.push(p),
    );
    expect(progress.map((p) => p.step)).toEqual(
      Array.from({ length: result.encodes }, (_, i) => i + 1),
    );
    expect(progress.every((p) => p.total >= p.step)).toBe(true);
  });

  it("fits real GIFs from noise frames", () => {
    const size = 32;
    let seed = 1;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed & 0xff;
    };
    const frames = Array.from({ length: 4 }, () => {
      const data = new Uint8ClampedArray(size * size * 4);
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 4 === 3 ? 255 : random();
      }
      return { data, delayMs: 100 };
    });
    const full = fitToSizeLimit(input(frames, Infinity, size, size));
    const limit = Math.round(full.originalBytes * 0.6);
    const result = fitToSizeLimit(input(frames, limit, size, size));
    expect(result.fits).toBe(true);
    expect(result.bytes.length).toBeLessThanOrEqual(limit);
    expect(new TextDecoder().decode(result.bytes.slice(0, 6))).toBe("GIF89a");
  });
});

describe("describeFit", () => {
  const base: FitResult = {
    bytes: new Uint8Array(118 * 1024),
    settings: {
      colors: 64,
      decimation: 1,
      width: 128,
      height: 128,
      trimMs: null,
    },
    fits: true,
    originalBytes: 412 * 1024,
    encodes: 5,
    fps: 12,
    durationMs: 4600,
    originalDurationMs: 4600,
  };

  it("summarises size, colors, fps and dimensions", () => {
    expect(describeFit(base)).toBe(
      "118 KB — 64 colors, 12 fps, 128 px (was 412 KB)",
    );
  });

  it("shows both dimensions for non-square output", () => {
    expect(
      describeFit({ ...base, settings: { ...base.settings, height: 64 } }),
    ).toContain("128×64 px");
  });

  it("mentions trimming", () => {
    expect(
      describeFit({
        ...base,
        settings: { ...base.settings, trimMs: 2000 },
        durationMs: 2000,
      }),
    ).toBe(
      "118 KB — 64 colors, 12 fps, 128 px (was 412 KB), trimmed to 2.0 s of 4.6 s",
    );
  });
});
