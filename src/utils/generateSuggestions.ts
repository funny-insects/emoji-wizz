import { ContentBounds } from "./detectContentBounds";
import { PlatformPreset } from "./presets";

export const MIN_FILL_RATIO = 0.6;

export function generateSuggestions(
  bounds: ContentBounds,
  preset: PlatformPreset,
  canvasSize: number = 512,
): string[] {
  const results: string[] = [];

  if (
    bounds.x > 0 ||
    bounds.y > 0 ||
    bounds.width < canvasSize ||
    bounds.height < canvasSize
  ) {
    results.push("Trim transparent padding");
  }

  const scaledPadding = preset.safeZonePadding * (canvasSize / preset.width);
  const safeW = canvasSize - 2 * scaledPadding;
  const safeH = canvasSize - 2 * scaledPadding;
  const safeZoneArea = safeW * safeH;
  const contentArea = bounds.width * bounds.height;

  if (contentArea / safeZoneArea < MIN_FILL_RATIO) {
    const pct = Math.round((safeZoneArea / contentArea - 1) * 100);
    results.push(`Increase content size by ~${pct}%`);
  }

  return results;
}
