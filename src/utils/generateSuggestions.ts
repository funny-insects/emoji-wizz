import { ContentBounds } from "./detectContentBounds";
import { PlatformPreset } from "./presets";

export const MIN_FILL_RATIO = 0.6;

export function generateSuggestions(
  bounds: ContentBounds,
  preset: PlatformPreset,
): string[] {
  const results: string[] = [];

  if (
    bounds.x > 0 ||
    bounds.y > 0 ||
    bounds.width < preset.width ||
    bounds.height < preset.height
  ) {
    results.push("Trim transparent padding");
  }

  const safeW = preset.width - 2 * preset.safeZonePadding;
  const safeH = preset.height - 2 * preset.safeZonePadding;
  const safeZoneArea = safeW * safeH;
  const contentArea = bounds.width * bounds.height;

  if (contentArea / safeZoneArea < MIN_FILL_RATIO) {
    const pct = Math.round((safeZoneArea / contentArea - 1) * 100);
    results.push(`Increase content size by ~${pct}%`);
  }

  return results;
}
