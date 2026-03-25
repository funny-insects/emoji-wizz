import { describe, it, expect } from "vitest";
import { removeBackground } from "./removeBackground";

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

describe("removeBackground", () => {
  it("zeroes border-connected white pixels and preserves red center", () => {
    // 10x10: white border, 6x6 red center (x=2..7, y=2..7)
    const img = makeImageData(10, 10, (x, y) => {
      if (x >= 2 && x <= 7 && y >= 2 && y <= 7) return [255, 0, 0, 255];
      return [255, 255, 255, 255];
    });

    const result = removeBackground(img, 10);
    const { data, width, height } = result;

    // Every border pixel should have alpha === 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isBorder =
          x === 0 || x === width - 1 || y === 0 || y === height - 1;
        const alpha = data[(y * width + x) * 4 + 3];
        if (isBorder) {
          expect(alpha).toBe(0);
        }
      }
    }

    // Every center pixel should have alpha === 255
    for (let y = 2; y <= 7; y++) {
      for (let x = 2; x <= 7; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        expect(alpha).toBe(255);
      }
    }
  });

  it("does not mutate the input imageData", () => {
    const img = makeImageData(4, 4, () => [255, 255, 255, 255]);
    const originalData = new Uint8ClampedArray(img.data);
    removeBackground(img, 10);
    expect(img.data).toEqual(originalData);
  });

  it("applying twice leaves no border pixels with alpha > 0", () => {
    const img = makeImageData(10, 10, (x, y) => {
      if (x >= 2 && x <= 7 && y >= 2 && y <= 7) return [255, 0, 0, 255];
      return [255, 255, 255, 255];
    });

    const first = removeBackground(img, 10);
    const second = removeBackground(first, 10);
    const { data, width, height } = second;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isBorder =
          x === 0 || x === width - 1 || y === 0 || y === height - 1;
        if (isBorder) {
          const alpha = data[(y * width + x) * 4 + 3];
          expect(alpha).toBe(0);
        }
      }
    }
  });
});
