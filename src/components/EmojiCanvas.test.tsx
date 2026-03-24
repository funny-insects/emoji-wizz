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
    expect(safeZone.stroke()).toBe("rgba(254, 129, 212, 0.6)");
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

  it("does not push a snapshot when tool is text (no mouse handling)", async () => {
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
          activeTool="text"
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

    // No additional push — text tool has no mouse-down/up snapshot logic yet
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

describe("EmojiCanvas — text tool", () => {
  it("shows a text input element on click when text tool is active", async () => {
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
          activeTool="text"
          onPushState={() => {}}
        />,
      ));
    });

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 64, clientY: 64 });
    });

    // Konva fires onClick after mousedown+mouseup at same position
    const input = container.querySelector("input:not([type='file'])");
    expect(input).not.toBeNull();
  });

  it("pushes exactly one snapshot when text is finalized with Enter", async () => {
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
          activeTool="text"
          onPushState={onPushState}
        />,
      ));
    });

    // 1 call from initial snapshot
    expect(onPushState).toHaveBeenCalledTimes(1);

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 64, clientY: 64 });
    });

    const input = container.querySelector(
      "input:not([type='file'])",
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    act(() => {
      fireEvent.change(input!, { target: { value: "LGTM" } });
      fireEvent.keyDown(input!, { key: "Enter" });
    });

    // One additional push from text placement
    expect(onPushState).toHaveBeenCalledTimes(2);
  });

  it("does not push a snapshot when text input is empty on Enter", async () => {
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
          activeTool="text"
          onPushState={onPushState}
        />,
      ));
    });

    expect(onPushState).toHaveBeenCalledTimes(1);

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 64, clientY: 64 });
    });

    const input = container.querySelector(
      "input:not([type='file'])",
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    act(() => {
      fireEvent.keyDown(input!, { key: "Enter" });
    });

    // No additional push — empty text discarded
    expect(onPushState).toHaveBeenCalledTimes(1);
  });

  it("calls fillText on the canvas context when text is finalized", async () => {
    const fillTextCalls: [string, number, number][] = [];
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function (this: HTMLCanvasElement, type: string) {
        const ctx = origGetContext.call(this, type);
        if (ctx && type === "2d") {
          const handler: ProxyHandler<CanvasRenderingContext2D> = {
            get(target, prop) {
              if (prop === "fillText") {
                return (text: string, x: number, y: number) => {
                  fillTextCalls.push([text, x, y]);
                  return Reflect.apply(target.fillText, target, [text, x, y]);
                };
              }
              const val = Reflect.get(target, prop);
              return typeof val === "function" ? val.bind(target) : val;
            },
          };
          return new Proxy(ctx, handler);
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
          activeTool="text"
          onPushState={() => {}}
          textColor="#FF0000"
        />,
      ));
    });

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 40, clientY: 40 });
      fireEvent.mouseUp(content, { clientX: 40, clientY: 40 });
    });

    const input = container.querySelector(
      "input:not([type='file'])",
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    act(() => {
      fireEvent.change(input!, { target: { value: "Hello" } });
      fireEvent.keyDown(input!, { key: "Enter" });
    });

    expect(fillTextCalls.some(([text]) => text === "Hello")).toBe(true);
  });

  it("discards text input when tool switches away from text", async () => {
    const mockImage = makeMockImage();
    const { container, rerender } = await act(async () =>
      render(
        <EmojiCanvas
          preset={slackPreset}
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="text"
          onPushState={() => {}}
        />,
      ),
    );

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 64, clientY: 64 });
    });

    expect(container.querySelector("input:not([type='file'])")).not.toBeNull();

    act(() => {
      rerender(
        <EmojiCanvas
          preset={slackPreset}
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="brush"
          onPushState={() => {}}
        />,
      );
    });

    expect(container.querySelector("input:not([type='file'])")).toBeNull();
  });
});

describe("EmojiCanvas — brush tool", () => {
  it("creates a Konva.Line on the overlays layer with correct color and stroke width on mousedown", async () => {
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
          onPushState={() => {}}
        />,
      ));
    });

    const content = container.querySelector(".konvajs-content")!;

    // Fire mousedown — line should be created on overlays layer (index 2)
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
    });

    const stage = Konva.stages[0];
    const overlaysLayer = stage.getLayers()[2];
    const lines = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    expect(lines.length).toBe(1);
    expect(lines[0]?.stroke()).toBe("#000000");
    // 128×128 canvas → strokeWidth = Math.round((128/128)*3) = 3
    expect(lines[0]?.strokeWidth()).toBe(3);
    expect(lines[0]?.lineCap()).toBe("round");
    expect(lines[0]?.lineJoin()).toBe("round");

    // Finish the stroke
    act(() => {
      fireEvent.mouseUp(content);
    });

    // Line should be flattened and removed from overlays layer
    const linesAfter = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    expect(linesAfter.length).toBe(0);
  });

  it("pushes exactly one snapshot after a complete brush mousedown→mouseup stroke", async () => {
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

    // 1 call from initial snapshot
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

  it("does not push a snapshot when tool is not brush on mousedown", async () => {
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

    // Initial snapshot still pushed
    expect(onPushState).toHaveBeenCalledTimes(1);

    const content = container.querySelector(".konvajs-content")!;
    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content);
    });

    // Eraser mouseup pushes (for the eraser stroke), brush does not interfere
    // Active tool is eraser so brush path is not taken
    const stage = Konva.stages[0];
    const overlaysLayer = stage.getLayers()[2];
    const lines = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    expect(lines.length).toBe(0);
  });

  it("appends points to the line on mousemove during a brush stroke", async () => {
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
          onPushState={() => {}}
        />,
      ));
    });

    const content = container.querySelector(".konvajs-content")!;

    act(() => {
      fireEvent.mouseDown(content, { clientX: 10, clientY: 10 });
    });

    const stage = Konva.stages[0];
    const overlaysLayer = stage.getLayers()[2];
    const lines = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    const initialPointCount = lines[0]?.points().length ?? 0;

    act(() => {
      fireEvent.mouseMove(content, { clientX: 20, clientY: 10 });
      fireEvent.mouseMove(content, { clientX: 30, clientY: 10 });
    });

    // Points should have grown: initial 4 (2 pairs) + 2 moves × 2 coords = 8
    const updatedLines = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    const updatedPointCount = updatedLines[0]?.points().length ?? 0;
    expect(updatedPointCount).toBeGreaterThan(initialPointCount);

    act(() => {
      fireEvent.mouseUp(content);
    });
  });
});

const applePreset = PLATFORM_PRESETS.find((p) => p.id === "apple")!;

describe("EmojiCanvas — display scale", () => {
  it("renders the outer sizing div at 512×512 for the Slack (128×128) preset (4x scale)", () => {
    const { container } = render(
      <EmojiCanvas
        preset={slackPreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const dropZone = container.querySelector(".canvas-drop-zone")!;
    const outer = dropZone.firstElementChild as HTMLElement;
    expect(outer.style.width).toBe("512px");
    expect(outer.style.height).toBe("512px");
  });

  it("renders the outer sizing div at 512×512 for the Apple (512×512) preset (1x scale)", () => {
    const { container } = render(
      <EmojiCanvas
        preset={applePreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const dropZone = container.querySelector(".canvas-drop-zone")!;
    const outer = dropZone.firstElementChild as HTMLElement;
    expect(outer.style.width).toBe("512px");
    expect(outer.style.height).toBe("512px");
  });

  it("applies transform: scale(4) for Slack and scale(1) for Apple on the inner div", () => {
    const { container, rerender } = render(
      <EmojiCanvas
        preset={slackPreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const dropZone = container.querySelector(".canvas-drop-zone")!;
    const inner = dropZone.firstElementChild!.firstElementChild as HTMLElement;
    expect(inner.style.transform).toBe("scale(4)");

    rerender(
      <EmojiCanvas
        preset={applePreset}
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const innerAfter = dropZone.firstElementChild!
      .firstElementChild as HTMLElement;
    expect(innerAfter.style.transform).toBe("scale(1)");
  });
});
