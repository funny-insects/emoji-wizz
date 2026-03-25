import type { ContentBounds } from "./detectContentBounds";

const DARK_BG = { r: 26, g: 26, b: 26 };
const LIGHT_BG = { r: 255, g: 255, b: 255 };
const DISTANCE_THRESHOLD = 55;
const PROPORTION_THRESHOLD = 0.25;

function rgbDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function detectContrastIssues(
  imageData: ImageData,
  bounds: ContentBounds,
): string[] {
  const { data, width } = imageData;
  const { x: bx, y: by, width: bw, height: bh } = bounds;

  let tooCloseDark = 0;
  let tooCloseLight = 0;
  let nonTransparentCount = 0;

  const visited = new Set<number>();

  function sample(px: number, py: number) {
    const key = py * width + px;
    if (visited.has(key)) return;
    visited.add(key);

    const i = key * 4;
    const a = data[i + 3]!;
    if (a === 0) return;

    nonTransparentCount++;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    if (
      rgbDistance(r, g, b, DARK_BG.r, DARK_BG.g, DARK_BG.b) < DISTANCE_THRESHOLD
    ) {
      tooCloseDark++;
    }
    if (
      rgbDistance(r, g, b, LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b) <
      DISTANCE_THRESHOLD
    ) {
      tooCloseLight++;
    }
  }

  // Top and bottom edges
  for (let x = bx; x < bx + bw; x++) {
    sample(x, by);
    sample(x, by + bh - 1);
  }

  // Left and right edges (excluding corners already sampled)
  for (let y = by + 1; y < by + bh - 1; y++) {
    sample(bx, y);
    sample(bx + bw - 1, y);
  }

  const results: string[] = [];

  if (nonTransparentCount > 0) {
    if (tooCloseDark / nonTransparentCount > PROPORTION_THRESHOLD) {
      results.push("Your emoji may be hard to see on dark backgrounds");
    }
    if (tooCloseLight / nonTransparentCount > PROPORTION_THRESHOLD) {
      results.push("Your emoji may be hard to see on light backgrounds");
    }
  }

  return results;
}
