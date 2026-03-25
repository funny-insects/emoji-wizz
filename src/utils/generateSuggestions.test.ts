import { describe, it, expect } from "vitest";
import { generateSuggestions } from "./generateSuggestions";
import { PLATFORM_PRESETS } from "./presets";

const slackPreset = PLATFORM_PRESETS.find((p) => p.id === "slack")!;
const applePreset = PLATFORM_PRESETS.find((p) => p.id === "apple")!;

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
    // At native preset resolution (canvasSize = 128):
    // safeW = safeH = 128 - 2*12 = 104; need contentArea >= 0.6 * 104*104 = 6489.6
    const canvasSize = slackPreset.width;
    const scaledPadding = slackPreset.safeZonePadding; // 12 * (128/128) = 12
    const safeW = canvasSize - 2 * scaledPadding;
    const safeH = canvasSize - 2 * scaledPadding;
    const bounds = { x: 0, y: 0, width: canvasSize, height: canvasSize };
    // Verify content area > 60% of safe zone area
    expect(bounds.width * bounds.height).toBeGreaterThan(safeW * safeH * 0.6);
    const result = generateSuggestions(bounds, slackPreset, canvasSize);
    expect(result).toHaveLength(0);
  });

  describe("canvasSize scaling", () => {
    it("Slack preset with 512x512 canvas uses scaled safe zone padding (48px instead of 12px)", () => {
      // scaledPadding = 12 * (512 / 128) = 48
      // safeW = safeH = 512 - 2*48 = 416
      // safeZoneArea = 416*416 = 173056
      // small content triggers size suggestion
      const bounds = { x: 0, y: 0, width: 512, height: 512 };
      // Content fills canvas so no trim suggestion; area = 512*512 = 262144 > 0.6*173056 → no size suggestion
      const result = generateSuggestions(bounds, slackPreset, 512);
      expect(result).toHaveLength(0);
    });

    it("Slack preset with 512x512 canvas: small content triggers scaled size suggestion", () => {
      // scaledPadding = 48, safeZoneArea = 416*416 = 173056
      // content 50x50 = 2500, ratio = 2500/173056 ≈ 0.014 < 0.6 → suggest increase
      const bounds = { x: 0, y: 0, width: 50, height: 50 };
      const result = generateSuggestions(bounds, slackPreset, 512);
      expect(result.some((s) => /Increase content size by ~\d+%/.test(s))).toBe(
        true,
      );
    });

    it("Apple preset with 512x512 canvas uses original padding (40px)", () => {
      // Apple preset.width = 512, canvasSize = 512 → scaledPadding = 40 * (512/512) = 40
      // safeW = safeH = 512 - 2*40 = 432; safeZoneArea = 432*432 = 186624
      // bounds covering full canvas → no trim; area = 512*512 = 262144 > 0.6*186624 → no size suggestion
      const bounds = { x: 0, y: 0, width: 512, height: 512 };
      const result = generateSuggestions(bounds, applePreset, 512);
      expect(result).toHaveLength(0);
    });
  });
});
