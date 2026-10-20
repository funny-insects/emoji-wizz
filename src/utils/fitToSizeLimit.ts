import {
  decimateFrames,
  encodeGif,
  fps as framesPerSecond,
  resizeRgba,
  totalDurationMs,
  trimFrames,
} from "./gifEncode";
import type { GifEncodeOptions, RgbaFrame } from "./gifEncode";

export interface FitSettings {
  colors: number;
  /** Number of times the frame list was halved: 0, 1 or 2. */
  decimation: number;
  width: number;
  height: number;
  trimMs: number | null;
}

export interface FitInput {
  /** Frames already rendered at width × height. */
  frames: RgbaFrame[];
  width: number;
  height: number;
  transparent: boolean;
  loopCount: number;
  limitBytes: number;
}

export interface FitResult {
  bytes: Uint8Array;
  settings: FitSettings;
  fits: boolean;
  originalBytes: number;
  encodes: number;
  fps: number;
  durationMs: number;
  originalDurationMs: number;
}

export type EncodeFn = (
  frames: RgbaFrame[],
  width: number,
  height: number,
  opts: GifEncodeOptions,
) => Uint8Array;

export interface FitProgress {
  step: number;
  total: number;
}

export const PALETTE_LEVELS = [256, 128, 64, 32];
export const MAX_DECIMATION = 2;
export const MIN_FPS = 8;
export const SCALE_LEVELS = [1, 0.875, 0.75, 0.625, 0.5];
export const TRIM_LEVELS_MS = [3000, 2000, 1500];
const ESTIMATED_ENCODES = 8;

interface Config {
  colors: number;
  decimation: number;
  scale: number;
  trimMs: number | null;
}

interface Attempt {
  bytes: Uint8Array;
  settings: FitSettings;
  frames: RgbaFrame[];
}

/** Index of the least lossy level that fits, or -1; assumes size shrinks monotonically with the index. */
function searchLeastLossy(
  count: number,
  fits: (index: number) => boolean,
): number {
  let lo = 0;
  let hi = count - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) {
      found = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return found;
}

export function fitToSizeLimit(
  input: FitInput,
  encode: EncodeFn = encodeGif,
  onProgress?: (p: FitProgress) => void,
): FitResult {
  const { frames, width, height, transparent, loopCount, limitBytes } = input;
  const originalDurationMs = totalDurationMs(frames);
  const decimated: RgbaFrame[][] = [frames];
  for (let d = 1; d <= MAX_DECIMATION; d++) {
    decimated.push(decimateFrames(decimated[d - 1]!));
  }

  const cache = new Map<string, Attempt>();
  let encodes = 0;
  let smallest: Attempt | null = null;

  const attempt = (config: Config): Attempt => {
    const key = `${config.colors}|${config.decimation}|${config.scale}|${config.trimMs}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const tw = Math.max(1, Math.round(width * config.scale));
    const th = Math.max(1, Math.round(height * config.scale));
    let selected = decimated[config.decimation]!;
    if (config.trimMs !== null) selected = trimFrames(selected, config.trimMs);
    const sized =
      tw === width && th === height
        ? selected
        : selected.map((f) => ({
            data: resizeRgba(f.data, width, height, tw, th),
            delayMs: f.delayMs,
          }));

    onProgress?.({
      step: encodes + 1,
      total: Math.max(ESTIMATED_ENCODES, encodes + 1),
    });
    const bytes = encode(sized, tw, th, {
      maxColors: config.colors,
      transparent,
      loopCount,
    });
    encodes++;

    const result: Attempt = {
      bytes,
      frames: sized,
      settings: {
        colors: config.colors,
        decimation: config.decimation,
        width: tw,
        height: th,
        trimMs: config.trimMs,
      },
    };
    cache.set(key, result);
    if (!smallest || bytes.length < smallest.bytes.length) smallest = result;
    return result;
  };

  const fitsLimit = (config: Config) =>
    attempt(config).bytes.length <= limitBytes;

  const finish = (chosen: Attempt, fits: boolean): FitResult => ({
    bytes: chosen.bytes,
    settings: chosen.settings,
    fits,
    originalBytes: original.bytes.length,
    encodes,
    fps: framesPerSecond(chosen.frames),
    durationMs: totalDurationMs(chosen.frames),
    originalDurationMs,
  });

  let current: Config = {
    colors: PALETTE_LEVELS[0]!,
    decimation: 0,
    scale: SCALE_LEVELS[0]!,
    trimMs: null,
  };
  const original = attempt(current);
  if (original.bytes.length <= limitBytes) return finish(original, true);

  const sourceFps = framesPerSecond(frames);
  const decimationLevels: number[] = [];
  if (sourceFps >= MIN_FPS) {
    for (let d = 1; d <= MAX_DECIMATION; d++) {
      const level = decimated[d]!;
      if (level.length === decimated[d - 1]!.length) break;
      if (framesPerSecond(level) < MIN_FPS) break;
      decimationLevels.push(d);
    }
  }

  const durationAfterDecimation = () =>
    totalDurationMs(decimated[current.decimation]!);

  const dimensions: (() => Config[])[] = [
    () => PALETTE_LEVELS.slice(1).map((colors) => ({ ...current, colors })),
    () => decimationLevels.map((decimation) => ({ ...current, decimation })),
    () => SCALE_LEVELS.slice(1).map((scale) => ({ ...current, scale })),
    () =>
      TRIM_LEVELS_MS.filter((ms) => ms < durationAfterDecimation()).map(
        (trimMs) => ({ ...current, trimMs }),
      ),
  ];

  for (const levelsOf of dimensions) {
    const levels = levelsOf();
    if (levels.length === 0) continue;
    const found = searchLeastLossy(levels.length, (i) => fitsLimit(levels[i]!));
    if (found >= 0) return finish(attempt(levels[found]!), true);
    current = levels[levels.length - 1]!;
  }

  return finish(smallest ?? original, false);
}

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

export function describeFit(result: FitResult): string {
  const { width, height, colors, trimMs } = result.settings;
  const size = width === height ? `${width} px` : `${width}×${height} px`;
  let text = `${formatKb(result.bytes.length)} — ${colors} colors, ${Math.round(result.fps)} fps, ${size} (was ${formatKb(result.originalBytes)})`;
  if (trimMs !== null) {
    text += `, trimmed to ${(result.durationMs / 1000).toFixed(1)} s of ${(result.originalDurationMs / 1000).toFixed(1)} s`;
  }
  return text;
}
