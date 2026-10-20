import { describe, expect, it } from "vitest";
import { GIFEncoder } from "gifenc";
import type { ParsedFrame } from "gifuct-js";
import {
  GIF_MAX_BYTES,
  GifImportError,
  compositeFrames,
  decodeGif,
  isGifFile,
  normalizeDelay,
  rgbaFramesToCanvases,
} from "./gifDecode";
import type { DecodedGif } from "./gifDecode";
import fixtureDataUrl from "../../e2e/fixtures/test-animated.gif?inline";

type Rgba = [number, number, number, number];

const T: Rgba = [0, 0, 0, 0];
const RED: Rgba = [255, 0, 0, 255];
const GREEN: Rgba = [0, 255, 0, 255];
const BLUE: Rgba = [0, 0, 255, 255];
const WHITE: Rgba = [255, 255, 255, 255];
const YELLOW: Rgba = [255, 255, 0, 255];

function at<T>(items: T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`No item at index ${index}`);
  return item;
}

function buffer(
  width: number,
  height: number,
  pick: (x: number, y: number) => Rgba,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data.set(pick(x, y), (y * width + x) * 4);
  }
  return data;
}

function parsedFrame(opts: {
  left?: number;
  top?: number;
  width: number;
  height: number;
  disposal?: number;
  delay?: number;
  pick: (x: number, y: number) => Rgba;
}): ParsedFrame {
  return {
    dims: {
      left: opts.left ?? 0,
      top: opts.top ?? 0,
      width: opts.width,
      height: opts.height,
    },
    colorTable: [],
    delay: opts.delay ?? 100,
    disposalType: opts.disposal ?? 1,
    patch: buffer(opts.width, opts.height, opts.pick),
    pixels: [],
    transparentIndex: 0,
  };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function encode(
  frameCount: number,
  opts: { delay?: number; repeat?: number } = {},
): ArrayBuffer {
  const gif = GIFEncoder();
  for (let i = 0; i < frameCount; i++) {
    gif.writeFrame(new Uint8Array([i % 2]), 1, 1, {
      palette: [
        [0, 0, 0],
        [255, 255, 255],
      ],
      delay: opts.delay ?? 100,
      repeat: opts.repeat ?? 0,
    });
  }
  gif.finish();
  return toArrayBuffer(gif.bytes());
}

function expectImportError(fn: () => unknown, message: RegExp) {
  expect(fn).toThrow(GifImportError);
  expect(fn).toThrow(message);
}

describe("normalizeDelay", () => {
  it("maps 0–10 ms to 100 ms", () => {
    expect(normalizeDelay(0)).toBe(100);
    expect(normalizeDelay(10)).toBe(100);
  });

  it("keeps delays above 10 ms", () => {
    expect(normalizeDelay(20)).toBe(20);
    expect(normalizeDelay(40)).toBe(40);
    expect(normalizeDelay(1000)).toBe(1000);
  });
});

describe("compositeFrames", () => {
  const W = 4;
  const H = 4;
  const fullRed = parsedFrame({ width: W, height: H, pick: () => RED });

  it("draws a partial patch at its offset and skips transparent pixels", () => {
    const patch = parsedFrame({
      left: 1,
      top: 1,
      width: 2,
      height: 2,
      pick: (x, y) => (x === 1 && y === 1 ? T : BLUE),
    });

    const second = at(compositeFrames([fullRed, patch], W, H), 1);

    expect(second.data).toEqual(
      buffer(W, H, (x, y) =>
        x >= 1 && x <= 2 && y >= 1 && y <= 2 && !(x === 2 && y === 2)
          ? BLUE
          : RED,
      ),
    );
  });

  it("disposal 1 leaves the frame in place for the next frame", () => {
    const patch = parsedFrame({
      left: 2,
      top: 0,
      width: 2,
      height: 1,
      pick: () => GREEN,
    });

    const frames = compositeFrames([fullRed, patch, patch], W, H);

    expect(at(frames, 2).data).toEqual(
      buffer(W, H, (x, y) => (x >= 2 && y === 0 ? GREEN : RED)),
    );
  });

  it("disposal 2 clears only the frame's rect to transparent", () => {
    const cleared = parsedFrame({
      left: 1,
      top: 1,
      width: 2,
      height: 2,
      disposal: 2,
      pick: () => BLUE,
    });
    const empty = parsedFrame({ width: 1, height: 1, pick: () => T });

    const frames = compositeFrames([fullRed, cleared, empty], W, H);

    expect(at(frames, 1).data).toEqual(
      buffer(W, H, (x, y) =>
        x >= 1 && x <= 2 && y >= 1 && y <= 2 ? BLUE : RED,
      ),
    );
    expect(at(frames, 2).data).toEqual(
      buffer(W, H, (x, y) => (x >= 1 && x <= 2 && y >= 1 && y <= 2 ? T : RED)),
    );
  });

  it("disposal 3 restores the state before the frame was drawn", () => {
    const restored = parsedFrame({
      width: W,
      height: 2,
      disposal: 3,
      pick: () => BLUE,
    });
    const corner = parsedFrame({
      left: 3,
      top: 3,
      width: 1,
      height: 1,
      pick: () => WHITE,
    });

    const frames = compositeFrames([fullRed, restored, corner], W, H);

    expect(at(frames, 1).data).toEqual(
      buffer(W, H, (_x, y) => (y < 2 ? BLUE : RED)),
    );
    expect(at(frames, 2).data).toEqual(
      buffer(W, H, (x, y) => (x === 3 && y === 3 ? WHITE : RED)),
    );
  });

  it("disposal 3 on the first frame restores to transparent", () => {
    const restored = parsedFrame({
      width: W,
      height: H,
      disposal: 3,
      pick: () => RED,
    });
    const empty = parsedFrame({ width: 1, height: 1, pick: () => T });

    const frames = compositeFrames([restored, empty], W, H);

    expect(at(frames, 1).data).toEqual(new Uint8ClampedArray(W * H * 4));
  });

  it("clips patches that extend past the logical screen", () => {
    const overflow = parsedFrame({
      left: 3,
      top: 3,
      width: 3,
      height: 3,
      pick: () => GREEN,
    });

    const frame = at(compositeFrames([overflow], W, H), 0);

    expect(frame.data).toEqual(
      buffer(W, H, (x, y) => (x === 3 && y === 3 ? GREEN : T)),
    );
  });

  it("returns independent copies and normalized delays", () => {
    const frames = compositeFrames(
      [
        { ...fullRed, delay: 0 },
        { ...fullRed, delay: 70 },
      ],
      W,
      H,
    );

    at(frames, 0).data.fill(0);

    expect(at(frames, 1).data).toEqual(buffer(W, H, () => RED));
    expect(frames.map((f) => f.delayMs)).toEqual([100, 70]);
  });
});

describe("decodeGif", () => {
  const fixture = Uint8Array.from(
    atob(fixtureDataUrl.slice(fixtureDataUrl.indexOf(",") + 1)),
    (c) => c.charCodeAt(0),
  );
  const S = 32;

  it("decodes the disposal fixture's frames, delays and loop count", () => {
    const decoded = decodeGif(toArrayBuffer(fixture));

    expect(decoded.width).toBe(S);
    expect(decoded.height).toBe(S);
    expect(decoded.loopCount).toBe(0);
    expect(decoded.frames.map((f) => f.delayMs)).toEqual([
      100, 200, 300, 400, 500,
    ]);
  });

  it("composites each disposal method into the expected pixels", () => {
    const { frames } = decodeGif(toArrayBuffer(fixture));
    const inSquare = (x: number, y: number) =>
      x >= 12 && x < 20 && y >= 12 && y < 20;

    // Frame 0 (disposal 1): solid red.
    expect(at(frames, 0).data).toEqual(buffer(S, S, () => RED));
    // Frame 1 (disposal 3): blue top half over the kept red frame.
    expect(at(frames, 1).data).toEqual(
      buffer(S, S, (_x, y) => (y < 16 ? BLUE : RED)),
    );
    // Frame 2 (disposal 2): frame 1 was restored, so the top right is red, not blue.
    expect(at(frames, 2).data).toEqual(
      buffer(S, S, (x) => (x < 16 ? GREEN : RED)),
    );
    // Frame 3 (disposal 1): frame 2 was cleared, so only the white square remains.
    expect(at(frames, 3).data).toEqual(
      buffer(S, S, (x, y) => (inSquare(x, y) ? WHITE : T)),
    );
    // Frame 4: frame 3 was kept, yellow quadrant drawn over it.
    expect(at(frames, 4).data).toEqual(
      buffer(S, S, (x, y) =>
        x >= 16 && y >= 16 ? YELLOW : inSquare(x, y) ? WHITE : T,
      ),
    );
  });

  it("reads a finite NETSCAPE loop count", () => {
    expect(decodeGif(encode(2, { repeat: 3 })).loopCount).toBe(3);
  });

  it("defaults the loop count to 0 when there is no NETSCAPE block", () => {
    expect(decodeGif(encode(2, { repeat: -1 })).loopCount).toBe(0);
  });

  it("normalizes a 10 ms delay to 100 ms", () => {
    expect(at(decodeGif(encode(2, { delay: 10 })).frames, 0).delayMs).toBe(100);
  });

  it("rejects files over 20 MB", () => {
    expectImportError(
      () => decodeGif(new ArrayBuffer(GIF_MAX_BYTES + 1)),
      /limit is 20 MB/,
    );
  });

  it("rejects a logical screen larger than 2048×2048", () => {
    const header = new Uint8Array([
      ...Array.from("GIF89a", (c) => c.charCodeAt(0)),
      0x00,
      0x10,
      0x00,
      0x10,
      0x00,
      0x00,
      0x00,
      0x3b,
    ]);

    expectImportError(
      () => decodeGif(toArrayBuffer(header)),
      /4096×4096 px; the limit is 2048×2048/,
    );
  });

  it("rejects more than 300 frames", () => {
    expectImportError(
      () => decodeGif(encode(301)),
      /^GIF has 301 frames; the limit is 300\.$/,
    );
  });

  it("accepts exactly 300 frames", () => {
    expect(decodeGif(encode(300)).frames).toHaveLength(300);
  });

  it("rejects data that is not a GIF", () => {
    const png = new Uint8Array(32).fill(0x89);

    expectImportError(() => decodeGif(toArrayBuffer(png)), /not a readable/);
  });
});

describe("isGifFile", () => {
  it("detects GIFs by MIME type or extension", () => {
    expect(isGifFile({ type: "image/gif" })).toBe(true);
    expect(isGifFile({ type: "", name: "party.GIF" })).toBe(true);
    expect(isGifFile({ type: "image/png", name: "a.png" })).toBe(false);
    expect(isGifFile({ type: "image/webp" })).toBe(false);
  });
});

describe("rgbaFramesToCanvases", () => {
  function decoded(width: number, height: number, count: number): DecodedGif {
    return {
      width,
      height,
      loopCount: 0,
      frames: Array.from({ length: count }, (_, i) => ({
        data: new Uint8ClampedArray(width * height * 4),
        delayMs: (i + 1) * 50,
      })),
    };
  }

  it("downscales to fit within maxSize preserving aspect ratio", () => {
    const frames = rgbaFramesToCanvases(decoded(600, 300, 2), 256);

    expect(frames).toHaveLength(2);
    expect(frames.map((f) => [f.canvas.width, f.canvas.height])).toEqual([
      [256, 128],
      [256, 128],
    ]);
    expect(frames.map((f) => f.delayMs)).toEqual([50, 100]);
  });

  it("never upscales", () => {
    const frame = at(rgbaFramesToCanvases(decoded(32, 20, 1), 256), 0);

    expect([frame.canvas.width, frame.canvas.height]).toEqual([32, 20]);
  });

  it("keeps at least 1 px on each side", () => {
    const frame = at(rgbaFramesToCanvases(decoded(1000, 1, 1), 256), 0);

    expect([frame.canvas.width, frame.canvas.height]).toEqual([256, 1]);
  });
});
