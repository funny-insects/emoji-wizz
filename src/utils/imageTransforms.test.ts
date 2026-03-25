import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  rotateCanvas90,
  flipCanvas,
  cropCanvas,
  reframeCanvas,
} from "./imageTransforms";

/* ------------------------------------------------------------------ */
/*  Helpers – lightweight mocks for HTMLCanvasElement + context        */
/* ------------------------------------------------------------------ */

function makeMockCtx() {
  return {
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function makeMockCanvas(w: number, h: number) {
  const ctx = makeMockCtx();
  const canvas = {
    width: w,
    height: h,
    getContext: vi.fn().mockReturnValue(ctx),
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx };
}

let createdCanvases: {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}[];

beforeEach(() => {
  createdCanvases = [];
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    if (tag === "canvas") {
      const pair = makeMockCanvas(0, 0);
      createdCanvases.push(pair);
      return pair.canvas;
    }
    return document.createElement.call(document, tag);
  }) as typeof document.createElement);
});

/* ------------------------------------------------------------------ */
/*  rotateCanvas90                                                     */
/* ------------------------------------------------------------------ */

describe("rotateCanvas90", () => {
  it("CW: swaps width/height on a non-square canvas", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    const result = rotateCanvas90(src, "cw");
    expect(result.width).toBe(2); // was height
    expect(result.height).toBe(4); // was width
  });

  it("CW: translates and rotates context correctly then draws source", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    rotateCanvas90(src, "cw");
    const ctx = createdCanvases[0]!.ctx;
    expect(ctx.translate).toHaveBeenCalledWith(2, 0); // result.width, 0
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(ctx.drawImage).toHaveBeenCalledWith(src, 0, 0);
  });

  it("CCW: swaps width/height correctly", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    const result = rotateCanvas90(src, "ccw");
    expect(result.width).toBe(2);
    expect(result.height).toBe(4);
  });

  it("CCW: translates and rotates context correctly", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    rotateCanvas90(src, "ccw");
    const ctx = createdCanvases[0]!.ctx;
    expect(ctx.translate).toHaveBeenCalledWith(0, 4); // 0, result.height
    expect(ctx.rotate).toHaveBeenCalledWith(-Math.PI / 2);
    expect(ctx.drawImage).toHaveBeenCalledWith(src, 0, 0);
  });

  it("returns a new canvas (non-destructive)", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    const result = rotateCanvas90(src, "cw");
    expect(result).not.toBe(src);
  });
});

/* ------------------------------------------------------------------ */
/*  flipCanvas                                                         */
/* ------------------------------------------------------------------ */

describe("flipCanvas", () => {
  it("horizontal: keeps same dimensions", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    const result = flipCanvas(src, "horizontal");
    expect(result.width).toBe(4);
    expect(result.height).toBe(2);
  });

  it("horizontal: uses scale(-1,1) and translates by width", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    flipCanvas(src, "horizontal");
    const ctx = createdCanvases[0]!.ctx;
    expect(ctx.translate).toHaveBeenCalledWith(4, 0);
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    expect(ctx.drawImage).toHaveBeenCalledWith(src, 0, 0);
  });

  it("vertical: uses scale(1,-1) and translates by height", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    flipCanvas(src, "vertical");
    const ctx = createdCanvases[0]!.ctx;
    expect(ctx.translate).toHaveBeenCalledWith(0, 2);
    expect(ctx.scale).toHaveBeenCalledWith(1, -1);
    expect(ctx.drawImage).toHaveBeenCalledWith(src, 0, 0);
  });

  it("returns a new canvas (non-destructive)", () => {
    const { canvas: src } = makeMockCanvas(4, 2);
    const result = flipCanvas(src, "horizontal");
    expect(result).not.toBe(src);
  });
});

/* ------------------------------------------------------------------ */
/*  cropCanvas                                                         */
/* ------------------------------------------------------------------ */

describe("cropCanvas", () => {
  it("creates a canvas of the correct crop size", () => {
    const { canvas: src } = makeMockCanvas(10, 10);
    const result = cropCanvas(src, { x: 2, y: 3, size: 5 });
    expect(result.width).toBe(5);
    expect(result.height).toBe(5);
  });

  it("calls drawImage with correct source and destination args", () => {
    const { canvas: src } = makeMockCanvas(10, 10);
    cropCanvas(src, { x: 2, y: 3, size: 5 });
    const ctx = createdCanvases[0]!.ctx;
    expect(ctx.drawImage).toHaveBeenCalledWith(src, 2, 3, 5, 5, 0, 0, 5, 5);
  });

  it("returns a new canvas (non-destructive)", () => {
    const { canvas: src } = makeMockCanvas(10, 10);
    const result = cropCanvas(src, { x: 0, y: 0, size: 5 });
    expect(result).not.toBe(src);
  });
});

/* ------------------------------------------------------------------ */
/*  reframeCanvas                                                      */
/* ------------------------------------------------------------------ */

describe("reframeCanvas", () => {
  it("creates a canvas with the target dimensions", () => {
    const { canvas: src } = makeMockCanvas(200, 100);
    const result = reframeCanvas(src, 512, 512);
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
  });

  it("draws the source scaled and centered (landscape → square)", () => {
    const { canvas: src } = makeMockCanvas(200, 100);
    reframeCanvas(src, 512, 512);
    const ctx = createdCanvases[0]!.ctx;
    // computeContainRect(200,100,512,512) → scale=2.56, w=512, h=256, x=0, y=128
    expect(ctx.drawImage).toHaveBeenCalledWith(src, 0, 128, 512, 256);
  });

  it("returns a new canvas (non-destructive)", () => {
    const { canvas: src } = makeMockCanvas(200, 100);
    const result = reframeCanvas(src, 512, 512);
    expect(result).not.toBe(src);
  });
});
