import { describe, it, expect } from "vitest";
import { PLATFORM_PRESETS, type PlatformPreset } from "./presets";

describe("PLATFORM_PRESETS", () => {
  it("has at least one entry", () => {
    expect(PLATFORM_PRESETS.length).toBeGreaterThanOrEqual(1);
  });

  it("slack preset has correct dimensions and safe zone", () => {
    const slack = PLATFORM_PRESETS.find((p) => p.id === "slack");
    expect(slack).toBeDefined();
    expect(slack?.width).toBe(128);
    expect(slack?.height).toBe(128);
    expect(slack?.safeZonePadding).toBe(12);
  });

  it("every entry has all required fields defined", () => {
    const requiredFields: (keyof PlatformPreset)[] = [
      "id",
      "label",
      "width",
      "height",
      "safeZonePadding",
    ];
    for (const preset of PLATFORM_PRESETS) {
      for (const field of requiredFields) {
        expect(preset[field]).toBeDefined();
      }
    }
  });
});
