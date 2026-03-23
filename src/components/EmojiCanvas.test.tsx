import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/react";
import Konva from "konva";
import { EmojiCanvas } from "./EmojiCanvas";
import { PLATFORM_PRESETS } from "../utils/presets";

const slackPreset = PLATFORM_PRESETS.find((p) => p.id === "slack")!;
const noop = () => {};

afterEach(() => {
  Konva.stages.forEach((s) => s.destroy());
});

describe("EmojiCanvas", () => {
  // 3.1 — verify Konva stage renders a canvas with correct dimensions
  it("renders a canvas inside .konvajs-content with correct dimensions for the Slack preset", () => {
    const { container } = render(
      <EmojiCanvas
        preset={slackPreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const wrapper = container.querySelector(".konvajs-content");
    expect(wrapper).not.toBeNull();
    const canvas = wrapper!.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas!.width).toBe(128);
    expect(canvas!.height).toBe(128);
  });

  // 3.2 / 4.9 — verify three-layer structure: background, image, overlays
  it("renders three layers in order: background, image, and overlays", () => {
    render(
      <EmojiCanvas
        preset={slackPreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const stage = Konva.stages[0];
    expect(stage.getLayers().length).toBe(3);
  });

  // 3.3a — verify checkerboard tile count
  it("renders 256 checkerboard Rect tiles for the 128×128 Slack preset", () => {
    render(
      <EmojiCanvas
        preset={slackPreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const stage = Konva.stages[0];
    const bgLayer = stage.getLayers()[0];
    // 128/8 = 16 tiles per side → 16×16 = 256 tiles
    // Checker tiles have a solid fill; the safe-zone rect uses fill="transparent"
    const checkerRects = bgLayer
      .find<Konva.Rect>("Rect")
      .filter((r) => r.fill() !== "transparent");
    expect(checkerRects.length).toBe(256);
  });

  // 3.3b — verify safe-zone rect props
  it("renders the safe-zone Rect with correct stroke, dash, and position", () => {
    render(
      <EmojiCanvas
        preset={slackPreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const stage = Konva.stages[0];
    const bgLayer = stage.getLayers()[0];
    const safeZones = bgLayer
      .find<Konva.Rect>("Rect")
      .filter((r) => r.fill() === "transparent");
    const safeZone = safeZones[0] as Konva.Rect;
    expect(safeZone).toBeDefined();
    expect(safeZone.stroke()).toBe("rgba(0, 120, 255, 0.5)");
    expect(safeZone.strokeWidth()).toBe(1);
    expect(safeZone.dash()).toEqual([4, 4]);
    expect(safeZone.x()).toBe(slackPreset.safeZonePadding);
    expect(safeZone.y()).toBe(slackPreset.safeZonePadding);
  });
});
