import { describe, it, expect } from "vitest";
import { detectContentBounds } from "./detectContentBounds";

function makeImageData(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return new ImageData(data, width, height);
}

describe("detectContentBounds", () => {
  it("fully opaque 4×4 image returns full bounds", () => {
    const img = makeImageData(4, 4, () => [255, 0, 0, 255]);
    expect(detectContentBounds(img)).toEqual({
      x: 0,
      y: 0,
      width: 4,
      height: 4,
    });
  });

  it("4×4 image with 1px transparent padding returns center 2×2 bounds", () => {
    const img = makeImageData(4, 4, (x, y) => {
      if (x >= 1 && x <= 2 && y >= 1 && y <= 2) return [255, 0, 0, 255];
      return [0, 0, 0, 0];
    });
    expect(detectContentBounds(img)).toEqual({
      x: 1,
      y: 1,
      width: 2,
      height: 2,
    });
  });

  it("fully transparent 4×4 image returns null", () => {
    const img = makeImageData(4, 4, () => [0, 0, 0, 0]);
    expect(detectContentBounds(img)).toBeNull();
  });
});
