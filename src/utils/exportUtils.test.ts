import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildExportCanvas,
  buildFilename,
  checkFileSizeWarning,
  downscaleCanvas,
} from "./exportUtils";
import type { PlatformPreset } from "./presets";

const slackPreset: PlatformPreset = {
  id: "slack",
  label: "Slack — 128×128",
  width: 128,
  height: 128,
  safeZonePadding: 12,
  maxFileSizeKb: 128,
};

function makeMockCanvas(ctx: CanvasRenderingContext2D) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(ctx),
  } as unknown as HTMLCanvasElement;
}

function makeMockCtx() {
  return {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("buildExportCanvas", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = makeMockCtx();
    const mockCanvas = makeMockCanvas(ctx);
    vi.spyOn(document, "createElement").mockReturnValue(
      mockCanvas as unknown as HTMLElement,
    );
  });

  it("creates a canvas with dimensions matching the preset", () => {
    const image = { naturalWidth: 200, naturalHeight: 200 } as HTMLImageElement;
    const canvas = buildExportCanvas(image, slackPreset);
    expect(canvas.width).toBe(slackPreset.width);
    expect(canvas.height).toBe(slackPreset.height);
  });

  it("calls drawImage on the context", () => {
    const image = { naturalWidth: 200, naturalHeight: 200 } as HTMLImageElement;
    buildExportCanvas(image, slackPreset);
    expect((ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      1,
    );
  });
});

describe("buildFilename", () => {
  it("returns a string matching /^emoji-\\d{4}-\\d{2}-\\d{2}\\.png$/ for png", () => {
    expect(buildFilename("png")).toMatch(/^emoji-\d{4}-\d{2}-\d{2}\.png$/);
  });

  it("returns a string ending in .gif for gif", () => {
    expect(buildFilename("gif")).toMatch(/\.gif$/);
  });

  it("returns a string ending in .webp for webp", () => {
    expect(buildFilename("webp")).toMatch(/\.webp$/);
  });

  it("includes platform id in filename when provided", () => {
    expect(buildFilename("png", "slack")).toMatch(
      /^emoji-slack-\d{4}-\d{2}-\d{2}\.png$/,
    );
  });

  it("includes platform id for discord", () => {
    expect(buildFilename("webp", "discord")).toMatch(
      /^emoji-discord-\d{4}-\d{2}-\d{2}\.webp$/,
    );
  });
});

describe("downscaleCanvas", () => {
  function makeMockCtx() {
    return {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low" as ImageSmoothingQuality,
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }

  function makeMockCanvas(width = 0, height = 0) {
    const ctx = makeMockCtx();
    const canvas = {
      width,
      height,
      getContext: vi.fn().mockReturnValue(ctx),
    } as unknown as HTMLCanvasElement;
    return { canvas, ctx };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the same canvas when dimensions already match (passthrough)", () => {
    const { canvas: source } = makeMockCanvas(512, 512);
    const result = downscaleCanvas(source, 512, 512);
    expect(result).toBe(source);
  });

  it("returns a canvas with correct target dimensions for a simple downscale", () => {
    const { canvas: source } = makeMockCanvas(256, 256);
    const { canvas: target } = makeMockCanvas();
    vi.spyOn(document, "createElement").mockReturnValueOnce(
      target as unknown as HTMLElement,
    );
    const result = downscaleCanvas(source, 128, 128);
    expect(result.width).toBe(128);
    expect(result.height).toBe(128);
  });

  it("uses two-step downscaling for 4x reduction (512→128), creating two intermediate canvases", () => {
    const { canvas: source } = makeMockCanvas(512, 512);
    const { canvas: mid } = makeMockCanvas();
    const { canvas: final } = makeMockCanvas();
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValueOnce(mid as unknown as HTMLElement)
      .mockReturnValueOnce(final as unknown as HTMLElement);

    downscaleCanvas(source, 128, 128);

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(mid.width).toBe(256);
    expect(mid.height).toBe(256);
    expect(final.width).toBe(128);
    expect(final.height).toBe(128);
  });
});

describe("checkFileSizeWarning", () => {
  it("returns null when blob size is within the preset limit", () => {
    const withinLimit = slackPreset.maxFileSizeKb * 1024;
    expect(checkFileSizeWarning(withinLimit, slackPreset)).toBeNull();
  });

  it("returns null when blob size equals the limit exactly", () => {
    const atLimit = slackPreset.maxFileSizeKb * 1024;
    expect(checkFileSizeWarning(atLimit, slackPreset)).toBeNull();
  });

  it("returns a non-null string containing the preset label and both sizes when limit is exceeded", () => {
    const overLimit = slackPreset.maxFileSizeKb * 1024 + 1;
    const result = checkFileSizeWarning(overLimit, slackPreset);
    expect(result).not.toBeNull();
    expect(result).toContain(slackPreset.label);
    expect(result).toContain(`${slackPreset.maxFileSizeKb}`);
  });
});
