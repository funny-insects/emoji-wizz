import { describe, it, expect } from "vitest";
import { PLATFORM_PRESETS, type PlatformPreset } from "./presets";

describe("PLATFORM_PRESETS", () => {
  it("has at least one entry", () => {
    expect(PLATFORM_PRESETS.length).toBeGreaterThanOrEqual(1);
  });

  it("slack preset has correct dimensions, safe zone, and maxFileSizeKb", () => {
    const slack = PLATFORM_PRESETS.find((p) => p.id === "slack");
    expect(slack).toBeDefined();
    expect(slack?.width).toBe(128);
    expect(slack?.height).toBe(128);
    expect(slack?.safeZonePadding).toBe(12);
    expect(slack?.maxFileSizeKb).toBe(128);
  });

  it("discord preset has correct dimensions, safe zone, and maxFileSizeKb", () => {
    const discord = PLATFORM_PRESETS.find((p) => p.id === "discord");
    expect(discord).toBeDefined();
    expect(discord?.width).toBe(128);
    expect(discord?.height).toBe(128);
    expect(discord?.safeZonePadding).toBe(10);
    expect(discord?.maxFileSizeKb).toBe(256);
  });

  it("apple preset has correct dimensions, safe zone, and maxFileSizeKb", () => {
    const apple = PLATFORM_PRESETS.find((p) => p.id === "apple");
    expect(apple).toBeDefined();
    expect(apple?.width).toBe(512);
    expect(apple?.height).toBe(512);
    expect(apple?.safeZonePadding).toBe(40);
    expect(apple?.maxFileSizeKb).toBe(500);
  });

  it("every entry has all required fields defined", () => {
    const requiredFields: (keyof PlatformPreset)[] = [
      "id",
      "label",
      "width",
      "height",
      "safeZonePadding",
      "maxFileSizeKb",
    ];
    for (const preset of PLATFORM_PRESETS) {
      for (const field of requiredFields) {
        expect(preset[field]).toBeDefined();
      }
    }
  });
});
