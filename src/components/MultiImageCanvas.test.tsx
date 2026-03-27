import { describe, it, expect, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
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
    expect(container.textContent).not.toContain("Paste, drop, or choose images");
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
});
