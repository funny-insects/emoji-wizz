import { describe, it, expect, vi, beforeEach } from "vitest";
import { drawCheckerboard, drawSafeZone } from "./canvasDrawing";

function makeMockCtx() {
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    setLineDash: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("drawCheckerboard", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = makeMockCtx();
  });

  it("calls fillRect to fill the canvas with tiles", () => {
    drawCheckerboard(ctx, 16, 16);
    // 16×16 canvas with 8×8 tiles = 4 tiles total
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      4,
    );
  });

  it("each fillRect call covers an 8×8 tile", () => {
    drawCheckerboard(ctx, 128, 128);
    const calls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
    for (const [, , w, h] of calls) {
      expect(w).toBe(8);
      expect(h).toBe(8);
    }
  });
});

describe("drawSafeZone", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = makeMockCtx();
  });

  it("calls strokeRect once", () => {
    drawSafeZone(ctx, 128, 128, 12);
    expect((ctx.strokeRect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      1,
    );
  });

  it("strokeRect is inset by the padding value", () => {
    const padding = 12;
    drawSafeZone(ctx, 128, 128, padding);
    const [x, y, w, h] = (ctx.strokeRect as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(x).toBe(padding);
    expect(y).toBe(padding);
    expect(w).toBe(128 - padding * 2);
    expect(h).toBe(128 - padding * 2);
  });

  it("calls setLineDash to produce a dashed line", () => {
    drawSafeZone(ctx, 128, 128, 12);
    expect(
      (ctx.setLineDash as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(0);
  });
});
