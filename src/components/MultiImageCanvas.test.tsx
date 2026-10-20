import { describe, it, expect, afterEach, vi } from "vitest";
import { render, act, screen, fireEvent } from "@testing-library/react";
import Konva from "konva";
import { MultiImageCanvas } from "./MultiImageCanvas";
import type { CanvasImageItem } from "../utils/canvasImageTypes";

const noop = () => {};

function makeItem(overrides: Partial<CanvasImageItem> = {}): CanvasImageItem {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 80;
  return {
    id: "item-1",
    label: "test.png",
    canvas,
    x: 206,
    y: 216,
    width: 100,
    height: 80,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    ...overrides,
  };
}

afterEach(() => {
  Konva.stages.forEach((s) => s.destroy());
});

describe("MultiImageCanvas", () => {
  it("renders a 512×512 Konva stage", () => {
    const { container } = render(
      <MultiImageCanvas
        items={[]}
        activeImageId={null}
        onAddImage={noop}
        onUpdateItem={noop}
        onRemoveItem={noop}
        onSetActiveImageId={noop}
        onPushHistory={noop}
      />,
    );
    const wrapper = container.querySelector(".konvajs-content");
    expect(wrapper).not.toBeNull();
    const canvas = wrapper!.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas!.width).toBe(512);
    expect(canvas!.height).toBe(512);
  });

  it("shows drop hint text when no items are present", () => {
    const { container } = render(
      <MultiImageCanvas
        items={[]}
        activeImageId={null}
        onAddImage={noop}
        onUpdateItem={noop}
        onRemoveItem={noop}
        onSetActiveImageId={noop}
        onPushHistory={noop}
      />,
    );
    expect(container.textContent).toContain("Paste, drop, or choose images");
  });

  it("does not show drop hint when items exist", () => {
    const item = makeItem();
    const { container } = render(
      <MultiImageCanvas
        items={[item]}
        activeImageId={null}
        onAddImage={noop}
        onUpdateItem={noop}
        onRemoveItem={noop}
        onSetActiveImageId={noop}
        onPushHistory={noop}
      />,
    );
    expect(container.textContent).not.toContain(
      "Paste, drop, or choose images",
    );
  });

  it("shows 'Select an image to edit' hint when brush tool is active and no image is selected", async () => {
    const item = makeItem();
    const { container } = await act(async () =>
      render(
        <MultiImageCanvas
          items={[item]}
          activeImageId={null}
          activeTool="brush"
          onAddImage={noop}
          onUpdateItem={noop}
          onRemoveItem={noop}
          onSetActiveImageId={noop}
          onPushHistory={noop}
        />,
      ),
    );
    expect(container.textContent).toContain("Select an image to edit");
  });

  it("does not show the hint when an image is active with brush tool", async () => {
    const item = makeItem();
    const { container } = await act(async () =>
      render(
        <MultiImageCanvas
          items={[item]}
          activeImageId="item-1"
          activeTool="brush"
          onAddImage={noop}
          onUpdateItem={noop}
          onRemoveItem={noop}
          onSetActiveImageId={noop}
          onPushHistory={noop}
        />,
      ),
    );
    expect(container.textContent).not.toContain("Select an image to edit");
  });

  it("renders five Konva layers", () => {
    render(
      <MultiImageCanvas
        items={[]}
        activeImageId={null}
        onAddImage={noop}
        onUpdateItem={noop}
        onRemoveItem={noop}
        onSetActiveImageId={noop}
        onPushHistory={noop}
      />,
    );
    const stage = Konva.stages[0]!;
    expect(stage.getLayers().length).toBe(5);
  });

  it("shows delete button for active item when pointer tool is active", async () => {
    const item = makeItem();
    const { container } = await act(async () =>
      render(
        <MultiImageCanvas
          items={[item]}
          activeImageId="item-1"
          activeTool="pointer"
          onAddImage={noop}
          onUpdateItem={noop}
          onRemoveItem={noop}
          onSetActiveImageId={noop}
          onPushHistory={noop}
        />,
      ),
    );
    const deleteBtn = container.querySelector(
      'button[aria-label="Delete image"]',
    );
    expect(deleteBtn).not.toBeNull();
  });

  it("calls onRemoveItem and onPushHistory when delete button is clicked", async () => {
    const item = makeItem();
    let removedId: string | null = null;
    let historyPushed = false;
    const { container } = await act(async () =>
      render(
        <MultiImageCanvas
          items={[item]}
          activeImageId="item-1"
          activeTool="pointer"
          onAddImage={noop}
          onUpdateItem={noop}
          onRemoveItem={(id) => {
            removedId = id;
          }}
          onSetActiveImageId={noop}
          onPushHistory={() => {
            historyPushed = true;
          }}
        />,
      ),
    );
    const deleteBtn = container.querySelector(
      'button[aria-label="Delete image"]',
    ) as HTMLButtonElement;
    act(() => {
      deleteBtn.click();
    });
    expect(removedId).toBe("item-1");
    expect(historyPushed).toBe(true);
  });

  describe("animation playback controls", () => {
    function makeAnimatedItem(): CanvasImageItem {
      const frames = Array.from({ length: 4 }, () => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        return { canvas, delayMs: 100 };
      });
      return makeItem({
        id: "gif-1",
        label: "anim.gif",
        canvas: frames[0]!.canvas,
        width: 32,
        height: 32,
        frames,
        loopCount: 0,
      });
    }

    function renderCanvas(
      items: CanvasImageItem[],
      onUpdateItem: (item: CanvasImageItem) => void = noop,
    ) {
      return render(
        <MultiImageCanvas
          items={items}
          activeImageId={null}
          onAddImage={noop}
          onUpdateItem={onUpdateItem}
          onRemoveItem={noop}
          onSetActiveImageId={noop}
          onPushHistory={noop}
        />,
      );
    }

    it("does not render playback controls without an animated item", () => {
      renderCanvas([makeItem()]);
      expect(
        screen.queryByRole("button", { name: "Pause animation" }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Play animation" }),
      ).toBeNull();
    });

    it("renders a Pause button and no scrubber while playing", () => {
      renderCanvas([makeItem(), makeAnimatedItem()]);
      expect(
        screen.getByRole("button", { name: "Pause animation" }),
      ).toHaveTextContent("Pause");
      expect(screen.queryByRole("slider", { name: "Frame" })).toBeNull();
    });

    it("pausing shows the scrubber and scrubbing sets the resting frame", () => {
      const item = makeAnimatedItem();
      const onUpdateItem = vi.fn();
      renderCanvas([item], onUpdateItem);

      fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));
      expect(
        screen.getByRole("button", { name: "Play animation" }),
      ).toHaveTextContent("Play");
      const slider = screen.getByRole("slider", { name: "Frame" });
      expect(slider).toHaveAttribute("max", "3");
      expect(screen.getByText("Frame 1 / 4")).toBeInTheDocument();

      fireEvent.change(slider, { target: { value: "2" } });
      expect(screen.getByText("Frame 3 / 4")).toBeInTheDocument();
      expect(onUpdateItem).toHaveBeenLastCalledWith({
        ...item,
        canvas: item.frames![2]!.canvas,
      });
    });

    it("exposes animation controls through animationRef", () => {
      const animationRef: {
        current: import("./MultiImageCanvas").AnimationControls | null;
      } = { current: null };
      const { unmount } = render(
        <MultiImageCanvas
          items={[makeAnimatedItem()]}
          activeImageId={null}
          animationRef={animationRef}
          onAddImage={noop}
          onUpdateItem={noop}
          onRemoveItem={noop}
          onSetActiveImageId={noop}
          onPushHistory={noop}
        />,
      );
      expect(animationRef.current?.currentFrame()).toBe(0);
      unmount();
      expect(animationRef.current).toBeNull();
    });
  });
});
