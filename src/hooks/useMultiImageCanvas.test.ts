import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMultiImageCanvas } from "./useMultiImageCanvas";
import type { CanvasImageItem } from "../utils/canvasImageTypes";

// Minimal 1×1 transparent PNG data URL
const MOCK_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=";

// Mock Image so onload fires immediately when src is set (avoids jsdom async image load)
class MockImage {
  private _src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 1;
  height = 1;
  set src(value: string) {
    this._src = value;
    if (this.onload) setTimeout(this.onload, 0);
  }
  get src() {
    return this._src;
  }
}

const originalImage = globalThis.Image;

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    MOCK_DATA_URL,
  );
  globalThis.Image = MockImage as unknown as typeof Image;
});

afterEach(() => {
  globalThis.Image = originalImage;
  vi.restoreAllMocks();
});

function makeImage(w = 100, h = 80): HTMLImageElement {
  const img = new Image() as HTMLImageElement;
  Object.defineProperty(img, "naturalWidth", { value: w, configurable: true });
  Object.defineProperty(img, "naturalHeight", {
    value: h,
    configurable: true,
  });
  return img;
}

describe("useMultiImageCanvas", () => {
  it("starts with no items and canUndo/canRedo both false", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.activeImageId).toBeNull();
  });

  it("addImage appends an item with centred position", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    const img = makeImage(100, 80);
    act(() => {
      result.current.addImage(img, "test.png");
    });
    expect(result.current.items).toHaveLength(1);
    const item = result.current.items[0]!;
    expect(item.label).toBe("test.png");
    expect(item.width).toBeGreaterThan(0);
    expect(item.height).toBeGreaterThan(0);
    expect(item.scaleX).toBe(1);
    expect(item.scaleY).toBe(1);
    expect(item.rotation).toBe(0);
  });

  it("addImage returns the new item id", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    let id!: string;
    act(() => {
      id = result.current.addImage(makeImage(), "a.png");
    });
    expect(result.current.items[0]!.id).toBe(id);
  });

  it("addImage caps image size to 256px", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    act(() => {
      result.current.addImage(makeImage(1024, 512), "big.png");
    });
    const item = result.current.items[0]!;
    expect(item.width).toBeLessThanOrEqual(256);
    expect(item.height).toBeLessThanOrEqual(256);
  });

  it("removeItem removes the item and clears activeImageId if it was that item", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    let id!: string;
    act(() => {
      id = result.current.addImage(makeImage(), "a.png");
      result.current.setActiveImageId(id);
    });
    expect(result.current.activeImageId).toBe(id);
    act(() => {
      result.current.removeItem(id);
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.activeImageId).toBeNull();
  });

  it("removeItem does not clear activeImageId when a different item is removed", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    let id1!: string;
    let id2!: string;
    act(() => {
      id1 = result.current.addImage(makeImage(), "a.png");
      id2 = result.current.addImage(makeImage(), "b.png");
      result.current.setActiveImageId(id1);
    });
    act(() => {
      result.current.removeItem(id2);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.activeImageId).toBe(id1);
  });

  it("updateItem replaces the matching item", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    act(() => {
      result.current.addImage(makeImage(), "a.png");
    });
    const original = result.current.items[0]!;
    act(() => {
      result.current.updateItem({ ...original, x: 99, y: 88 });
    });
    expect(result.current.items[0]!.x).toBe(99);
    expect(result.current.items[0]!.y).toBe(88);
  });

  it("reorderItems replaces the items array in the new order", () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    act(() => {
      result.current.addImage(makeImage(), "a.png");
      result.current.addImage(makeImage(), "b.png");
    });
    const [first, second] = result.current.items as [
      CanvasImageItem,
      CanvasImageItem,
    ];
    act(() => {
      result.current.reorderItems([second, first]);
    });
    expect(result.current.items[0]!.label).toBe("b.png");
    expect(result.current.items[1]!.label).toBe("a.png");
  });

  it("pushHistory + undo restores previous state", async () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    act(() => {
      result.current.addImage(makeImage(), "a.png");
      result.current.pushHistory();
    });
    expect(result.current.canUndo).toBe(true);
    await act(async () => {
      await result.current.undo();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("pushHistory + undo + redo restores forward state", async () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    act(() => {
      result.current.addImage(makeImage(), "a.png");
      result.current.pushHistory();
    });
    await act(async () => {
      await result.current.undo();
    });
    expect(result.current.items).toHaveLength(0);
    await act(async () => {
      await result.current.redo();
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.canRedo).toBe(false);
  });

  it("undo does nothing when at the beginning of history", async () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    await act(async () => {
      await result.current.undo();
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("redo does nothing when nothing has been undone", async () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    act(() => {
      result.current.addImage(makeImage(), "a.png");
      result.current.pushHistory();
    });
    await act(async () => {
      await result.current.redo();
    });
    expect(result.current.items).toHaveLength(1);
  });

  it("clear resets items, activeImageId, and history", async () => {
    const { result } = renderHook(() => useMultiImageCanvas());
    act(() => {
      const id = result.current.addImage(makeImage(), "a.png");
      result.current.setActiveImageId(id);
      result.current.pushHistory();
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.activeImageId).toBeNull();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
