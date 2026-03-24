import { describe, it, expect, afterEach, vi } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import Konva from "konva";
import { EmojiCanvas } from "./EmojiCanvas";
import { PLATFORM_PRESETS } from "../utils/presets";

const slackPreset = PLATFORM_PRESETS.find((p) => p.id === "slack")!;
const noop = () => {};

function makeMockImage(w = 128, h = 128): HTMLImageElement {
  const img = new Image() as HTMLImageElement;
  Object.defineProperty(img, "naturalWidth", { value: w, configurable: true });
  Object.defineProperty(img, "naturalHeight", {
    value: h,
    configurable: true,
  });
  return img;
}

afterEach(() => {
  Konva.stages.forEach((s) => s.destroy());
  vi.restoreAllMocks();
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

describe("EmojiCanvas — eraser tool", () => {
  it("pushes an initial snapshot to onPushState when image loads", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    await act(async () => {
      render(
        <EmojiCanvas
          preset={slackPreset}
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="eraser"
          onPushState={onPushState}
        />,
      );
    });

    expect(onPushState).toHaveBeenCalledTimes(1);
  });

  it("pushes exactly one snapshot after a complete mousedown→mouseup stroke", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
          preset={slackPreset}
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="eraser"
          onPushState={onPushState}
        />,
      ));
    });

    // Should have 1 call from initial snapshot
    expect(onPushState).toHaveBeenCalledTimes(1);

    const content = container.querySelector(".konvajs-content")!;

    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseMove(content, { clientX: 70, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 70, clientY: 64 });
    });

    // Exactly one additional push from the completed stroke
    expect(onPushState).toHaveBeenCalledTimes(2);
  });

  it("does not push an extra snapshot when mousemove occurs without mousedown", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
          preset={slackPreset}
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="eraser"
          onPushState={onPushState}
        />,
      ));
    });

    expect(onPushState).toHaveBeenCalledTimes(1);

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseMove(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 64, clientY: 64 });
    });

    // Still only 1 call — no stroke was started
    expect(onPushState).toHaveBeenCalledTimes(1);
  });

  it("does not push a snapshot when tool is not eraser", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
          preset={slackPreset}
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="brush"
          onPushState={onPushState}
        />,
      ));
    });

    // Initial snapshot still pushed
    expect(onPushState).toHaveBeenCalledTimes(1);

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content);
    });

    // No additional push — not in eraser mode
    expect(onPushState).toHaveBeenCalledTimes(1);
  });

  it("applies destination-out composite operation during an eraser stroke", async () => {
    // Spy on the mock context's composite operation usage
    const compositeOpsUsed: string[] = [];
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function (this: HTMLCanvasElement, type: string) {
        const ctx = origGetContext.call(this, type);
        if (ctx && type === "2d") {
          const origSet = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(ctx),
            "globalCompositeOperation",
          )?.set;
          if (!origSet) {
            // Proxy-based mock: track via property assignment interception
            const handler: ProxyHandler<CanvasRenderingContext2D> = {
              set(target, prop, value) {
                if (prop === "globalCompositeOperation") {
                  compositeOpsUsed.push(value as string);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (target as any)[prop] = value;
                return true;
              },
              get(target, prop) {
                const val = Reflect.get(target, prop);
                return typeof val === "function" ? val.bind(target) : val;
              },
            };
            return new Proxy(ctx, handler);
          }
        }
        return ctx;
      } as typeof HTMLCanvasElement.prototype.getContext,
    );

    const mockImage = makeMockImage();
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
          preset={slackPreset}
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="eraser"
          onPushState={() => {}}
        />,
      ));
    });

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content);
    });

    expect(compositeOpsUsed).toContain("destination-out");
  });
});
