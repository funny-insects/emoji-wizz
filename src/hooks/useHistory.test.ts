import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHistory } from "./useHistory";

describe("useHistory", () => {
  it("starts with canUndo=false and canRedo=false", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("pushState with a single item does not enable undo", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.pushState("snap1"));
    expect(result.current.canUndo).toBe(false);
  });

  it("pushState with two items enables undo", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.pushState("snap1"));
    act(() => result.current.pushState("snap2"));
    expect(result.current.canUndo).toBe(true);
  });

  it("undo returns the previous snapshot", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.pushState("snap1"));
    act(() => result.current.pushState("snap2"));
    let restored: string | null = null;
    act(() => {
      restored = result.current.undo();
    });
    expect(restored).toBe("snap1");
  });

  it("undo when empty returns null", () => {
    const { result } = renderHook(() => useHistory());
    let out: string | null = "not-null";
    act(() => {
      out = result.current.undo();
    });
    expect(out).toBeNull();
  });

  it("undo when only one item in stack returns null", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.pushState("snap1"));
    let out: string | null = "not-null";
    act(() => {
      out = result.current.undo();
    });
    expect(out).toBeNull();
  });

  it("redo returns null when redo stack is empty", () => {
    const { result } = renderHook(() => useHistory());
    let out: string | null = "not-null";
    act(() => {
      out = result.current.redo();
    });
    expect(out).toBeNull();
  });

  it("redo restores the undone snapshot", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.pushState("snap1"));
    act(() => result.current.pushState("snap2"));
    act(() => result.current.undo());
    let redoResult: string | null = null;
    act(() => {
      redoResult = result.current.redo();
    });
    expect(redoResult).toBe("snap2");
  });

  it("pushState after undo clears the redo stack", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.pushState("snap1"));
    act(() => result.current.pushState("snap2"));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.pushState("snap3"));
    expect(result.current.canRedo).toBe(false);
  });

  it("clear resets both stacks and disables undo/redo", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.pushState("snap1"));
    act(() => result.current.pushState("snap2"));
    act(() => result.current.clear());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    let out: string | null = "not-null";
    act(() => {
      out = result.current.undo();
    });
    expect(out).toBeNull();
  });
});
