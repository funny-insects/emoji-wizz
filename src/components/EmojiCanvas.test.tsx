import { describe, it, expect, afterEach, vi } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import Konva from "konva";
import { EmojiCanvas } from "./EmojiCanvas";

const noop = () => {};

function makeMockImage(w = 512, h = 512): HTMLImageElement {
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
  it("renders a canvas inside .konvajs-content with 512x512 dimensions", () => {
    const { container } = render(
      <EmojiCanvas
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
    expect(canvas!.width).toBe(512);
    expect(canvas!.height).toBe(512);
  });

  it("renders six layers in order: background, image, overlays, crop, stickers, frames", () => {
    render(
      <EmojiCanvas
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const stage = Konva.stages[0]!;
    expect(stage.getLayers().length).toBe(6);
  });

  it("renders checkerboard tiles for the 512x512 canvas", () => {
    render(
      <EmojiCanvas
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const stage = Konva.stages[0]!;
    const bgLayer = stage.getLayers()[0]!;
    // 512/8 = 64 tiles per side → 64×64 = 4096 tiles
    const checkerRects = bgLayer.find<Konva.Rect>("Rect");
    expect(checkerRects.length).toBe(4096);
  });

  it("does not render a safe-zone Rect overlay", () => {
    render(
      <EmojiCanvas
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const stage = Konva.stages[0]!;
    const bgLayer = stage.getLayers()[0]!;
    const transparentRects = bgLayer
      .find<Konva.Rect>("Rect")
      .filter((r) => r.fill() === "transparent");
    expect(transparentRects.length).toBe(0);
  });

  it("displays the label as 'Canvas' without dimensions", () => {
    const { container } = render(
      <EmojiCanvas
        image={null}
        handleFileInput={noop}
        handleDrop={noop}
        handlePaste={noop}
      />,
    );
    const label = container.querySelector(".section-label");
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe("Canvas");
  });

  it("renders the outer sizing div at 512x512 with displayScale=1", () => {
    const { container } = render(
      <EmojiCanvas
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
    const inner = outer.firstElementChild as HTMLElement;
    expect(inner.style.transform).toBe("scale(1)");
  });
});

describe("EmojiCanvas — eraser tool", () => {
  it("pushes an initial snapshot to onPushState when image loads", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    await act(async () => {
      render(
        <EmojiCanvas
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
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseMove(content, { clientX: 70, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 70, clientY: 64 });
    });

    expect(onPushState).toHaveBeenCalledTimes(2);
  });

  it("does not push an extra snapshot when mousemove occurs without mousedown", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
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

    expect(onPushState).toHaveBeenCalledTimes(1);
  });

  it("does not push a snapshot when tool is text (no mouse handling)", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
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
      fireEvent.mouseUp(content);
    });

    expect(onPushState).toHaveBeenCalledTimes(1);
  });

  it("applies destination-out composite operation during an eraser stroke", async () => {
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
      fireEvent.change(input!, { target: { value: "LGTM" } });
      fireEvent.keyDown(input!, { key: "Enter" });
    });

    expect(onPushState).toHaveBeenCalledTimes(2);
  });

  it("does not push a snapshot when text input is empty on Enter", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
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
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
    });

    const stage = Konva.stages[0]!;
    const overlaysLayer = stage.getLayers()[2];
    const lines = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    expect(lines.length).toBe(1);
    expect(lines[0]?.stroke()).toBe("#000000");
    // 512×512 canvas → strokeWidth = Math.round((512/128)*3) = 12
    expect(lines[0]?.strokeWidth()).toBe(12);
    expect(lines[0]?.lineCap()).toBe("round");
    expect(lines[0]?.lineJoin()).toBe("round");

    act(() => {
      fireEvent.mouseUp(content);
    });

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
          image={mockImage}
          handleFileInput={noop}
          handleDrop={noop}
          handlePaste={noop}
          activeTool="brush"
          onPushState={onPushState}
        />,
      ));
    });

    expect(onPushState).toHaveBeenCalledTimes(1);

    const content = container.querySelector(".konvajs-content")!;

    act(() => {
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseMove(content, { clientX: 70, clientY: 64 });
      fireEvent.mouseUp(content, { clientX: 70, clientY: 64 });
    });

    expect(onPushState).toHaveBeenCalledTimes(2);
  });

  it("does not push a snapshot when tool is not brush on mousedown", async () => {
    const onPushState = vi.fn();
    const mockImage = makeMockImage();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EmojiCanvas
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
      fireEvent.mouseDown(content, { clientX: 64, clientY: 64 });
      fireEvent.mouseUp(content);
    });

    const stage = Konva.stages[0]!;
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

    const stage = Konva.stages[0]!;
    const overlaysLayer = stage.getLayers()[2];
    const lines = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    const initialPointCount = lines[0]?.points().length ?? 0;

    act(() => {
      fireEvent.mouseMove(content, { clientX: 20, clientY: 10 });
      fireEvent.mouseMove(content, { clientX: 30, clientY: 10 });
    });

    const updatedLines = overlaysLayer?.find<Konva.Line>("Line") ?? [];
    const updatedPointCount = updatedLines[0]?.points().length ?? 0;
    expect(updatedPointCount).toBeGreaterThan(initialPointCount);

    act(() => {
      fireEvent.mouseUp(content);
    });
  });
});
