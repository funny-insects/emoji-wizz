import { describe, it, expect } from "vitest";
import { generateSuggestions } from "./generateSuggestions";
import { PLATFORM_PRESETS } from "./presets";

const slackPreset = PLATFORM_PRESETS.find((p) => p.id === "slack")!;

describe("generateSuggestions", () => {
  it("bounds smaller than canvas → includes 'Trim transparent padding'", () => {
    const bounds = { x: 10, y: 10, width: 108, height: 108 };
    const result = generateSuggestions(bounds, slackPreset);
    expect(result).toContain("Trim transparent padding");
  });

  it("small content area → includes 'Increase content size by ~N%'", () => {
    const bounds = { x: 0, y: 0, width: 20, height: 20 };
    const result = generateSuggestions(bounds, slackPreset);
    expect(result.some((s) => /Increase content size by ~\d+%/.test(s))).toBe(
      true,
    );
  });

  it("content fills safe zone well and covers canvas → no suggestions", () => {
    // safeW = safeH = 128 - 2*12 = 104; need contentArea >= 0.6 * 104*104 = 6489.6
    // Use bounds that equal the canvas size and content >= safe zone
    const safeW = slackPreset.width - 2 * slackPreset.safeZonePadding;
    const safeH = slackPreset.height - 2 * slackPreset.safeZonePadding;
    const bounds = {
      x: 0,
      y: 0,
      width: slackPreset.width,
      height: slackPreset.height,
    };
    // Verify content area > 60% of safe zone area
    expect(bounds.width * bounds.height).toBeGreaterThan(safeW * safeH * 0.6);
    const result = generateSuggestions(bounds, slackPreset);
    expect(result).toHaveLength(0);
  });
});
