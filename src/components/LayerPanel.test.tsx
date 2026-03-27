import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { LayerPanel } from "./LayerPanel";
import type { CanvasImageItem } from "../utils/canvasImageTypes";

function makeItem(id: string, label: string): CanvasImageItem {
  const canvas = document.createElement("canvas");
  canvas.width = 50;
  canvas.height = 50;
  return {
    id,
    label,
    canvas,
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  };
}

describe("LayerPanel", () => {
  it("renders 'No images yet' when items is empty", () => {
    const { container } = render(
      <LayerPanel
        items={[]}
        activeImageId={null}
        onSelectImage={() => {}}
        onReorder={() => {}}
      />,
    );
    expect(container.textContent).toContain("No images yet");
  });

  it("renders a row for each item", () => {
    const items = [makeItem("a", "alpha.png"), makeItem("b", "beta.png")];
    const { container } = render(
      <LayerPanel
        items={items}
        activeImageId={null}
        onSelectImage={() => {}}
        onReorder={() => {}}
      />,
    );
    const rows = container.querySelectorAll(".layer-row");
    expect(rows.length).toBe(2);
  });

  it("shows items in reverse order (last item first in panel)", () => {
    const items = [makeItem("a", "bottom.png"), makeItem("b", "top.png")];
    const { container } = render(
      <LayerPanel
        items={items}
        activeImageId={null}
        onSelectImage={() => {}}
        onReorder={() => {}}
      />,
    );
    const labels = container.querySelectorAll(".layer-label");
    expect(labels[0]!.textContent).toBe("top.png");
    expect(labels[1]!.textContent).toBe("bottom.png");
  });

  it("applies active class to the selected image row", () => {
    const items = [makeItem("a", "a.png"), makeItem("b", "b.png")];
    const { container } = render(
      <LayerPanel
        items={items}
        activeImageId="b"
        onSelectImage={() => {}}
        onReorder={() => {}}
      />,
    );
    const rows = container.querySelectorAll(".layer-row");
    // display order is reversed: b is first
    expect(rows[0]!.classList.contains("layer-row--active")).toBe(true);
    expect(rows[1]!.classList.contains("layer-row--active")).toBe(false);
  });

  it("calls onSelectImage with the correct id when a row is clicked", () => {
    const items = [makeItem("a", "a.png"), makeItem("b", "b.png")];
    const onSelect = vi.fn();
    const { container } = render(
      <LayerPanel
        items={items}
        activeImageId={null}
        onSelectImage={onSelect}
        onReorder={() => {}}
      />,
    );
    const rows = container.querySelectorAll(".layer-row");
    act(() => {
      fireEvent.click(rows[0]!); // first displayed = "b" (top z-order)
    });
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("calls onReorder with reversed order when dragging first row to second", () => {
    const items = [makeItem("a", "a.png"), makeItem("b", "b.png")];
    const onReorder = vi.fn();
    const { container } = render(
      <LayerPanel
        items={items}
        activeImageId={null}
        onSelectImage={() => {}}
        onReorder={onReorder}
      />,
    );
    const rows = container.querySelectorAll(".layer-row");
    // display: [b, a]. Drag b (index 0) to a (index 1) → display becomes [a, b] → items order [b, a]
    act(() => {
      fireEvent.dragStart(rows[0]!);
      fireEvent.dragOver(rows[1]!);
      fireEvent.drop(rows[1]!);
    });
    expect(onReorder).toHaveBeenCalled();
    const newOrder: CanvasImageItem[] = onReorder.mock.calls[0][0];
    expect(newOrder[0]!.id).toBe("b");
    expect(newOrder[1]!.id).toBe("a");
  });
});
