import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStickerHistory } from "./useStickerHistory";
import type { StickerSnapshot } from "./useStickerHistory";
import type { StickerDescriptor } from "../utils/stickerTypes";

const makeSticker = (id: string): StickerDescriptor => ({
  id,
  src: "test.png",
  label: "test",
  x: 0,
  y: 0,
  width: 64,
  height: 64,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
});

const makeSnapshot = (stickers: StickerDescriptor[] = []): StickerSnapshot => ({
  stickers,
  activeFrameId: null,
  frameThickness: 0,
});

describe("useStickerHistory", () => {
  it("starts with canUndo=false and canRedo=false", () => {
    const { result } = renderHook(() => useStickerHistory());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("pushState with a single item does not enable undo", () => {
    const { result } = renderHook(() => useStickerHistory());
    act(() => result.current.pushState(makeSnapshot()));
    expect(result.current.canUndo).toBe(false);
  });

  it("pushState with two items enables undo", () => {
    const { result } = renderHook(() => useStickerHistory());
    act(() => result.current.pushState(makeSnapshot()));
    act(() => result.current.pushState(makeSnapshot([makeSticker("1")])));
    expect(result.current.canUndo).toBe(true);
  });

  it("undo returns the previous snapshot", () => {
    const { result } = renderHook(() => useStickerHistory());
    const snap1 = makeSnapshot();
    act(() => result.current.pushState(snap1));
    act(() => result.current.pushState(makeSnapshot([makeSticker("1")])));
    let restored: StickerSnapshot | null = null;
    act(() => {
      restored = result.current.undo();
    });
    expect(restored).toEqual(snap1);
  });

  it("undo when empty returns null", () => {
    const { result } = renderHook(() => useStickerHistory());
    let out: StickerSnapshot | null = makeSnapshot([makeSticker("x")]);
    act(() => {
      out = result.current.undo();
    });
    expect(out).toBeNull();
  });

  it("undo when only one item in stack returns null", () => {
    const { result } = renderHook(() => useStickerHistory());
    act(() => result.current.pushState(makeSnapshot()));
    let out: StickerSnapshot | null = makeSnapshot([makeSticker("x")]);
    act(() => {
      out = result.current.undo();
    });
    expect(out).toBeNull();
  });

  it("redo returns null when redo stack is empty", () => {
    const { result } = renderHook(() => useStickerHistory());
    let out: StickerSnapshot | null = makeSnapshot();
    act(() => {
      out = result.current.redo();
    });
    expect(out).toBeNull();
  });

  it("redo restores the undone snapshot", () => {
    const { result } = renderHook(() => useStickerHistory());
    const snap2 = makeSnapshot([makeSticker("1")]);
    act(() => result.current.pushState(makeSnapshot()));
    act(() => result.current.pushState(snap2));
    act(() => result.current.undo());
    let redoResult: StickerSnapshot | null = null;
    act(() => {
      redoResult = result.current.redo();
    });
    expect(redoResult).toEqual(snap2);
  });

  it("pushState after undo clears the redo stack", () => {
    const { result } = renderHook(() => useStickerHistory());
    act(() => result.current.pushState(makeSnapshot()));
    act(() => result.current.pushState(makeSnapshot([makeSticker("1")])));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.pushState(makeSnapshot([makeSticker("2")])));
    expect(result.current.canRedo).toBe(false);
  });

  it("clear resets both stacks and disables undo/redo", () => {
    const { result } = renderHook(() => useStickerHistory());
    act(() => result.current.pushState(makeSnapshot()));
    act(() => result.current.pushState(makeSnapshot([makeSticker("1")])));
    act(() => result.current.clear());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    let out: StickerSnapshot | null = makeSnapshot();
    act(() => {
      out = result.current.undo();
    });
    expect(out).toBeNull();
  });
});
