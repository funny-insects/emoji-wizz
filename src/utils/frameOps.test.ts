import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnimationFrame } from "./canvasImageTypes";
import {
  clampCropRegion,
  cropFrames,
  cropRectToSourceRegion,
  mapFrames,
  removeBackgroundFrames,
  transformFrames,
} from "./frameOps";
import * as transforms from "./imageTransforms";
import * as bg from "./removeBackground";

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function makeFrames(): AnimationFrame[] {
  return [
    { canvas: makeCanvas(40, 30), delayMs: 50 },
    { canvas: makeCanvas(40, 30), delayMs: 80 },
    { canvas: makeCanvas(40, 30), delayMs: 120 },
  ];
}

function expectFresh(
  input: readonly AnimationFrame[],
  output: readonly AnimationFrame[],
) {
  expect(output).not.toBe(input);
  expect(output).toHaveLength(input.length);
  output.forEach((f, i) => {
    expect(f).not.toBe(input[i]);
    expect(f.canvas).not.toBe(input[i]!.canvas);
    expect(f.delayMs).toBe(input[i]!.delayMs);
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("mapFrames", () => {
  it("passes each canvas and index once and preserves delays", () => {
    const frames = makeFrames();
    const snapshot = [...frames];
    const fn = vi.fn(() => makeCanvas(1, 1));
    const out = mapFrames(frames, fn);
    expect(fn).toHaveBeenCalledTimes(3);
    frames.forEach((f, i) =>
      expect(fn).toHaveBeenNthCalledWith(i + 1, f.canvas, i),
    );
    expectFresh(frames, out);
    expect(frames).toEqual(snapshot);
    frames.forEach((f, i) => expect(f).toBe(snapshot[i]));
  });

  it("returns an empty array for no frames", () => {
    expect(mapFrames([], vi.fn())).toEqual([]);
  });
});

describe("clampCropRegion", () => {
  it("returns the region unchanged when fully inside", () => {
    expect(clampCropRegion({ x: 5, y: 6, size: 10 }, 40, 30)).toEqual({
      x: 5,
      y: 6,
      size: 10,
    });
  });

  it("clips past the left edge", () => {
    expect(clampCropRegion({ x: -4, y: 2, size: 10 }, 40, 30)).toEqual({
      x: 0,
      y: 2,
      size: 6,
    });
  });

  it("clips past the top edge", () => {
    expect(clampCropRegion({ x: 2, y: -3, size: 10 }, 40, 30)).toEqual({
      x: 2,
      y: 0,
      size: 7,
    });
  });

  it("clips past the right edge", () => {
    expect(clampCropRegion({ x: 35, y: 2, size: 10 }, 40, 30)).toEqual({
      x: 35,
      y: 2,
      size: 5,
    });
  });

  it("clips past the bottom edge", () => {
    expect(clampCropRegion({ x: 2, y: 25, size: 10 }, 40, 30)).toEqual({
      x: 2,
      y: 25,
      size: 5,
    });
  });

  it("uses the smaller clipped extent to stay square", () => {
    expect(clampCropRegion({ x: -4, y: 25, size: 10 }, 40, 30)).toEqual({
      x: 0,
      y: 25,
      size: 5,
    });
  });

  it("returns null when fully outside on any side", () => {
    expect(clampCropRegion({ x: -20, y: 0, size: 10 }, 40, 30)).toBeNull();
    expect(clampCropRegion({ x: 0, y: -20, size: 10 }, 40, 30)).toBeNull();
    expect(clampCropRegion({ x: 40, y: 0, size: 10 }, 40, 30)).toBeNull();
    expect(clampCropRegion({ x: 0, y: 30, size: 10 }, 40, 30)).toBeNull();
  });

  it("floors the size at 1", () => {
    expect(clampCropRegion({ x: 39.6, y: 0, size: 10 }, 40, 30)).toEqual({
      x: 39.6,
      y: 0,
      size: 1,
    });
  });
});

describe("cropRectToSourceRegion", () => {
  const item = {
    x: 100,
    y: 50,
    scaleX: 1,
    scaleY: 1,
    canvasWidth: 200,
    canvasHeight: 200,
  };

  it("maps a rect inside the image", () => {
    expect(cropRectToSourceRegion({ x: 120, y: 70, size: 50 }, item)).toEqual({
      x: 20,
      y: 20,
      size: 50,
    });
  });

  it("clips a rect hanging off the left", () => {
    expect(cropRectToSourceRegion({ x: 90, y: 70, size: 50 }, item)).toEqual({
      x: 0,
      y: 20,
      size: 40,
    });
  });

  it("clips a rect hanging off the top", () => {
    expect(cropRectToSourceRegion({ x: 120, y: 30, size: 50 }, item)).toEqual({
      x: 20,
      y: 0,
      size: 30,
    });
  });

  it("clips a rect hanging off the right", () => {
    expect(cropRectToSourceRegion({ x: 250, y: 70, size: 100 }, item)).toEqual({
      x: 150,
      y: 20,
      size: 50,
    });
  });

  it("clips a rect hanging off the bottom", () => {
    expect(cropRectToSourceRegion({ x: 120, y: 200, size: 100 }, item)).toEqual(
      { x: 20, y: 150, size: 50 },
    );
  });

  it("returns null when the rect misses the image", () => {
    expect(cropRectToSourceRegion({ x: 0, y: 0, size: 50 }, item)).toBeNull();
    expect(
      cropRectToSourceRegion({ x: 300, y: 70, size: 50 }, item),
    ).toBeNull();
    expect(
      cropRectToSourceRegion({ x: 120, y: 260, size: 50 }, item),
    ).toBeNull();
  });

  it("divides by the item scale", () => {
    const scaled = {
      x: 100,
      y: 50,
      scaleX: 2,
      scaleY: 2,
      canvasWidth: 100,
      canvasHeight: 100,
    };
    expect(cropRectToSourceRegion({ x: 120, y: 70, size: 60 }, scaled)).toEqual(
      { x: 10, y: 10, size: 30 },
    );
  });
});

describe("cropFrames", () => {
  it("crops every frame with the same region and sets output dims", () => {
    const frames = makeFrames();
    const spy = vi.spyOn(transforms, "cropCanvas");
    const region = { x: 4, y: 5, size: 12 };
    const out = cropFrames(frames, region);
    expect(spy).toHaveBeenCalledTimes(3);
    frames.forEach((f, i) =>
      expect(spy).toHaveBeenNthCalledWith(i + 1, f.canvas, region),
    );
    expectFresh(frames, out);
    out.forEach((f) => {
      expect(f.canvas.width).toBe(12);
      expect(f.canvas.height).toBe(12);
    });
    frames.forEach((f) => {
      expect(f.canvas.width).toBe(40);
      expect(f.canvas.height).toBe(30);
    });
  });
});

describe("transformFrames", () => {
  it.each([
    ["rotateCW", "rotateCanvas90", "cw"],
    ["rotateCCW", "rotateCanvas90", "ccw"],
    ["flipH", "flipCanvas", "horizontal"],
    ["flipV", "flipCanvas", "vertical"],
  ] as const)("%s applies %s then reframes", (type, fnName, arg) => {
    const frames = makeFrames();
    const op = vi.spyOn(transforms, fnName);
    const reframe = vi.spyOn(transforms, "reframeCanvas");
    const out = transformFrames(frames, type, 64, 48);
    expect(op).toHaveBeenCalledTimes(3);
    frames.forEach((f, i) =>
      expect(op).toHaveBeenNthCalledWith(i + 1, f.canvas, arg),
    );
    expect(reframe).toHaveBeenCalledTimes(3);
    reframe.mock.calls.forEach((call, i) => {
      expect(call[0]).toBe(op.mock.results[i]!.value);
      expect(call[1]).toBe(64);
      expect(call[2]).toBe(48);
    });
    expectFresh(frames, out);
    out.forEach((f) => {
      expect(f.canvas.width).toBe(64);
      expect(f.canvas.height).toBe(48);
    });
  });
});

describe("removeBackgroundFrames", () => {
  it("calls removeBackground once per frame with the tolerance", () => {
    const frames = makeFrames();
    const imageData = new ImageData(new Uint8ClampedArray(4), 1, 1);
    const getImageData = vi.fn(() => imageData);
    const putImageData = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getImageData,
      putImageData,
    } as unknown as CanvasRenderingContext2D);
    const processed = new ImageData(new Uint8ClampedArray(4), 1, 1);
    const spy = vi.spyOn(bg, "removeBackground").mockReturnValue(processed);

    const out = removeBackgroundFrames(frames, 42);

    expect(spy).toHaveBeenCalledTimes(3);
    spy.mock.calls.forEach((call) => {
      expect(call[0]).toBe(imageData);
      expect(call[1]).toBe(42);
    });
    expect(getImageData).toHaveBeenCalledTimes(3);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 40, 30);
    expect(putImageData).toHaveBeenCalledTimes(3);
    expect(putImageData).toHaveBeenCalledWith(processed, 0, 0);
    expectFresh(frames, out);
    out.forEach((f) => {
      expect(f.canvas.width).toBe(40);
      expect(f.canvas.height).toBe(30);
    });
  });
});
