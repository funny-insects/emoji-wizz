import { describe, it, expect } from "vitest";
import { detectContrastIssues } from "./detectContrastIssues";
import type { ContentBounds } from "./detectContentBounds";

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

describe("detectContrastIssues", () => {
  const fullBounds: ContentBounds = { x: 0, y: 0, width: 4, height: 4 };

  it("nearly white emoji warns about light backgrounds", () => {
    const img = makeImageData(4, 4, () => [250, 250, 250, 255]);
    const issues = detectContrastIssues(img, fullBounds);
    expect(issues).toContain(
      "Your emoji may be hard to see on light backgrounds",
    );
    expect(issues).not.toContain(
      "Your emoji may be hard to see on dark backgrounds",
    );
  });

  it("nearly black emoji warns about dark backgrounds", () => {
    const img = makeImageData(4, 4, () => [20, 20, 20, 255]);
    const issues = detectContrastIssues(img, fullBounds);
    expect(issues).toContain(
      "Your emoji may be hard to see on dark backgrounds",
    );
    expect(issues).not.toContain(
      "Your emoji may be hard to see on light backgrounds",
    );
  });

  it("bright colored emoji triggers no warnings", () => {
    const img = makeImageData(4, 4, () => [200, 50, 50, 255]);
    const issues = detectContrastIssues(img, fullBounds);
    expect(issues).toHaveLength(0);
  });

  it("fully transparent image returns no warnings", () => {
    const img = makeImageData(4, 4, () => [0, 0, 0, 0]);
    const issues = detectContrastIssues(img, fullBounds);
    expect(issues).toHaveLength(0);
  });
});
