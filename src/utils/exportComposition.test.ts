import { describe, it, expect, vi, beforeEach } from "vitest";
import type Konva from "konva";
import * as gifEncode from "./gifEncode";
import {
  ExportError,
  STATIC_EXPORT_NOTE,
  exportComposition,
  routeExport,
} from "./exportComposition";
import type { AnimationControls, AnimationFrame } from "./canvasImageTypes";
import type { PlatformPreset } from "./presets";

vi.mock("./gifEncode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./gifEncode")>();
  return { ...actual, encodeGif: vi.fn(actual.encodeGif) };
});

const SIZE = 128;
const preset: PlatformPreset = {
  id: "slack",
  label: "Slack — 128×128",
  width: SIZE,
  height: SIZE,
  safeZonePadding: 12,
  maxFileSizeKb: 128,
};

class FakeNode {
  private shown = true;
  visible(value?: boolean) {
    if (value !== undefined) this.shown = value;
    return this.shown;
  }
}

function solidRgba(r: number, g: number, b: number, a = 255) {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let i = 0; i < data.length; i += 4) data.set([r, g, b, a], i);
  return data;
}

function makeFakeCanvas(data: Uint8ClampedArray, webpSupported = true) {
  return {
    width: SIZE,
    height: SIZE,
    getContext: () => ({ getImageData: () => ({ data }) }),
    toDataURL: (type: string) =>
      type === "image/webp" && webpSupported
        ? "data:image/webp;base64,UklGRg=="
        : "data:image/png;base64,iVBORw==",
    toBlob: (cb: (b: Blob | null) => void, type: string) =>
      cb(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type })),
  } as unknown as HTMLCanvasElement;
}

function makeFakeStage(
  options: { render?: () => Uint8ClampedArray; webp?: boolean } = {},
) {
  const uiNodes = [new FakeNode(), new FakeNode()];
  const bgLayer = new FakeNode();
  const visibilityAtRender: { ui: boolean[]; bg: boolean }[] = [];
  const render = options.render ?? (() => solidRgba(255, 0, 0));
  const stage = {
    find: vi.fn(() => uiNodes),
    getLayers: () => [bgLayer],
    toCanvas: vi.fn(() => {
      visibilityAtRender.push({
        ui: uiNodes.map((n) => n.visible()),
        bg: bgLayer.visible(),
      });
      return makeFakeCanvas(render(), options.webp ?? true);
    }),
  };
  return {
    stage: stage as unknown as Konva.Stage,
    raw: stage,
    uiNodes,
    bgLayer,
    visibilityAtRender,
  };
}

function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

const ascii = (bytes: Uint8Array, n: number) =>
  String.fromCharCode(...bytes.subarray(0, n));

beforeEach(() => {
  vi.mocked(gifEncode.encodeGif).mockClear();
});

describe("routeExport", () => {
  it.each([
    ["gif", true, "gif-animated"],
    ["gif", false, "gif-static"],
    ["png", true, "png"],
    ["png", false, "png"],
    ["webp", true, "webp"],
    ["webp", false, "webp"],
  ] as const)("%s (animated=%s) → %s", (format, animated, route) => {
    expect(routeExport(format, animated)).toBe(route);
  });
});

describe("exportComposition", () => {
  it("static GIF export encodes a real GIF, not PNG bytes", async () => {
    const { stage } = makeFakeStage();
    const result = await exportComposition({
      stage,
      preset,
      format: "gif",
      bgColor: null,
    });
    expect(gifEncode.encodeGif).toHaveBeenCalledTimes(1);
    const [frames, w, h, opts] = vi.mocked(gifEncode.encodeGif).mock.calls[0]!;
    expect(frames).toHaveLength(1);
    expect([w, h]).toEqual([SIZE, SIZE]);
    expect(opts).toMatchObject({ maxColors: 256, transparent: true });

    expect(result.blob.type).toBe("image/gif");
    const bytes = await blobBytes(result.blob);
    expect(ascii(bytes, 6)).toBe("GIF89a");
    expect(bytes[0]).not.toBe(0x89);
    expect(result.filename).toMatch(/\.gif$/);
    expect(result.note).toBeUndefined();
  });

  it("hides UI nodes and the background while rendering, then restores them", async () => {
    const { stage, raw, uiNodes, bgLayer, visibilityAtRender } =
      makeFakeStage();
    await exportComposition({ stage, preset, format: "png", bgColor: null });
    expect(raw.find).toHaveBeenCalledWith(".ui");
    expect(visibilityAtRender).toEqual([{ ui: [false, false], bg: false }]);
    expect(uiNodes.map((n) => n.visible())).toEqual([true, true]);
    expect(bgLayer.visible()).toBe(true);
  });

  it("keeps the background and an opaque palette when a colour is set", async () => {
    const { stage, visibilityAtRender } = makeFakeStage();
    await exportComposition({ stage, preset, format: "gif", bgColor: "#fff" });
    expect(visibilityAtRender[0]!.bg).toBe(true);
    expect(vi.mocked(gifEncode.encodeGif).mock.calls[0]![3]).toMatchObject({
      transparent: false,
    });
  });

  it("PNG export returns the canvas PNG blob", async () => {
    const { stage } = makeFakeStage();
    const result = await exportComposition({
      stage,
      preset,
      format: "png",
      bgColor: null,
    });
    expect(result.blob.type).toBe("image/png");
    expect(gifEncode.encodeGif).not.toHaveBeenCalled();
  });

  it("WebP export fails clearly when the browser falls back to PNG", async () => {
    const { stage } = makeFakeStage({ webp: false });
    await expect(
      exportComposition({ stage, preset, format: "webp", bgColor: null }),
    ).rejects.toBeInstanceOf(ExportError);
  });

  it("WebP export returns a WebP blob", async () => {
    const { stage } = makeFakeStage();
    const result = await exportComposition({
      stage,
      preset,
      format: "webp",
      bgColor: null,
    });
    expect(result.blob.type).toBe("image/webp");
  });

  describe("animated", () => {
    const colours = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ] as const;
    const sourceFrames: AnimationFrame[] = [100, 200, 300].map((delayMs) => ({
      canvas: document.createElement("canvas"),
      delayMs,
    }));

    function setup() {
      let shown = 1;
      const controls: AnimationControls = {
        showFrame: vi.fn((i: number) => {
          shown = i;
        }),
        currentFrame: () => 1,
      };
      const fake = makeFakeStage({
        render: () => {
          const [r, g, b] = colours[shown]!;
          return solidRgba(r, g, b);
        },
      });
      return { ...fake, controls, shownFrame: () => shown };
    }

    it("renders every source frame with its delay and restores the shown frame", async () => {
      const { stage, controls, shownFrame } = setup();
      const result = await exportComposition({
        stage,
        preset,
        format: "gif",
        bgColor: null,
        animation: { frames: sourceFrames, loopCount: 3, controls },
      });
      expect(vi.mocked(controls.showFrame).mock.calls.map((c) => c[0])).toEqual(
        [0, 1, 2, 1],
      );
      expect(shownFrame()).toBe(1);
      const [frames, , , opts] = vi.mocked(gifEncode.encodeGif).mock.calls[0]!;
      expect(frames.map((f) => f.delayMs)).toEqual([100, 200, 300]);
      expect(frames.map((f) => Array.from(f.data.subarray(0, 3)))).toEqual(
        colours.map((c) => [...c]),
      );
      expect(opts).toMatchObject({ loopCount: 3, transparent: true });
      expect(ascii(await blobBytes(result.blob), 6)).toBe("GIF89a");
      expect(result.note).toBeUndefined();
    });

    it("uses an injected encoder for the animated route", async () => {
      const { stage, controls } = setup();
      const encodeAnimated = vi.fn(() => new Uint8Array([71, 73, 70]));
      const result = await exportComposition({
        stage,
        preset,
        format: "gif",
        bgColor: "#000",
        animation: { frames: sourceFrames, loopCount: 0, controls },
        encodeAnimated,
      });
      expect(encodeAnimated).toHaveBeenCalledWith(
        expect.objectContaining({
          width: SIZE,
          height: SIZE,
          transparent: false,
          loopCount: 0,
        }),
      );
      expect(result.blob.size).toBe(3);
    });

    it("PNG of an animated composition exports one frame with a note", async () => {
      const { stage, controls } = setup();
      const result = await exportComposition({
        stage,
        preset,
        format: "png",
        bgColor: null,
        animation: { frames: sourceFrames, loopCount: 0, controls },
      });
      expect(controls.showFrame).not.toHaveBeenCalled();
      expect(result.blob.type).toBe("image/png");
      expect(result.note).toBe(STATIC_EXPORT_NOTE);
    });
  });
});
