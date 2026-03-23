import { describe, it, expect } from "vitest";
import { computeContainRect } from "./imageScaling";

describe("computeContainRect", () => {
  it("square image into same-size canvas fills exactly", () => {
    const rect = computeContainRect(128, 128, 128, 128);
    expect(rect).toEqual({ x: 0, y: 0, width: 128, height: 128 });
  });

  it("landscape image is letterboxed — full width, centered vertically", () => {
    const rect = computeContainRect(256, 128, 128, 128);
    expect(rect.width).toBe(128);
    expect(rect.height).toBe(64);
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(32);
  });

  it("portrait image is pillarboxed — full height, centered horizontally", () => {
    const rect = computeContainRect(128, 256, 128, 128);
    expect(rect.width).toBe(64);
    expect(rect.height).toBe(128);
    expect(rect.x).toBe(32);
    expect(rect.y).toBe(0);
  });

  it("small image is scaled up to fit canvas", () => {
    const rect = computeContainRect(32, 32, 128, 128);
    expect(rect).toEqual({ x: 0, y: 0, width: 128, height: 128 });
  });
});
