// Usage: node scripts/generate-gif-fixtures.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import gifenc from "gifenc";

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "e2e",
  "fixtures",
);

const { GIFEncoder, quantize, applyPalette } = gifenc;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDisposalFixture() {
  const size = 32;
  const half = size / 2;
  const T = 0;
  const RED = 1;
  const GREEN = 2;
  const BLUE = 3;
  const WHITE = 4;
  const YELLOW = 5;
  const palette = [
    [0, 0, 0],
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 255],
    [255, 255, 0],
  ];

  const frame = (pick) => {
    const index = new Uint8Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) index[y * size + x] = pick(x, y);
    }
    return index;
  };

  const frames = [
    { index: frame(() => RED), delay: 100, dispose: 1, transparent: false },
    {
      index: frame((x, y) => (y < half ? BLUE : T)),
      delay: 200,
      dispose: 3,
      transparent: true,
    },
    {
      index: frame((x) => (x < half ? GREEN : T)),
      delay: 300,
      dispose: 2,
      transparent: true,
    },
    {
      index: frame((x, y) =>
        x >= 12 && x < 20 && y >= 12 && y < 20 ? WHITE : T,
      ),
      delay: 400,
      dispose: 1,
      transparent: true,
    },
    {
      index: frame((x, y) => (x >= half && y >= half ? YELLOW : T)),
      delay: 500,
      dispose: 1,
      transparent: true,
    },
  ];

  const gif = GIFEncoder();
  for (const f of frames) {
    gif.writeFrame(f.index, size, size, {
      palette,
      delay: f.delay,
      repeat: 0,
      dispose: f.dispose,
      transparent: f.transparent,
      transparentIndex: T,
    });
  }
  gif.finish();
  return { bytes: gif.bytes(), frameCount: frames.length };
}

function generateLargeFixture() {
  const size = 120;
  const frameCount = 30;
  const random = mulberry32(0x5eed);
  const gif = GIFEncoder();
  for (let f = 0; f < frameCount; f++) {
    const rgba = new Uint8Array(size * size * 4);
    const phase = (f / frameCount) * Math.PI * 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const noise = () => (random() - 0.5) * 32;
        rgba[i] = 128 + 127 * Math.sin(x / 9 + phase) + noise();
        rgba[i + 1] = 128 + 127 * Math.sin(y / 11 - phase) + noise();
        rgba[i + 2] = 128 + 127 * Math.sin((x + y) / 13 + 2 * phase) + noise();
        rgba[i + 3] = 255;
      }
    }
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, size, size, { palette, delay: 40, repeat: 0 });
  }
  gif.finish();
  return { bytes: gif.bytes(), frameCount };
}

for (const [name, generate] of [
  ["test-animated.gif", generateDisposalFixture],
  ["test-large-animated.gif", generateLargeFixture],
]) {
  const { bytes, frameCount } = generate();
  writeFileSync(join(FIXTURES_DIR, name), bytes);
  console.log(`${name}: ${bytes.length} bytes, ${frameCount} frames`);
}
