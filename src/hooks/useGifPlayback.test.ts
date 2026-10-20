import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type Konva from "konva";
import { START_POSITION, stepPlayback, useGifPlayback } from "./useGifPlayback";
import type { CanvasImageItem } from "../utils/canvasImageTypes";

const DELAYS = [100, 200, 300];

describe("stepPlayback", () => {
  it("stays on the current frame until its delay has elapsed", () => {
    const next = stepPlayback(START_POSITION, 99, DELAYS, 0);
    expect(next).toEqual({ index: 0, carryMs: 99, loop: 0, done: false });
  });

  it("advances and carries the remainder into the next frame", () => {
    const next = stepPlayback(START_POSITION, 130, DELAYS, 0);
    expect(next.index).toBe(1);
    expect(next.carryMs).toBe(30);
  });

  it("accumulates small steps without drifting", () => {
    let pos = START_POSITION;
    for (let i = 0; i < 29; i++) pos = stepPlayback(pos, 10, DELAYS, 0);
    expect(pos.index).toBe(1);
    expect(pos.carryMs).toBe(190);
    pos = stepPlayback(pos, 10.5, DELAYS, 0);
    expect(pos.index).toBe(2);
    expect(pos.carryMs).toBeCloseTo(0.5);
  });

  it("skips multiple frames in one large step", () => {
    const next = stepPlayback(START_POSITION, 350, DELAYS, 0);
    expect(next.index).toBe(2);
    expect(next.carryMs).toBe(50);
  });

  it("wraps to frame 0 when looping forever", () => {
    const next = stepPlayback(START_POSITION, 610, DELAYS, 0);
    expect(next.index).toBe(0);
    expect(next.carryMs).toBe(10);
    expect(next.done).toBe(false);
  });

  it("handles very large gaps when looping forever", () => {
    const next = stepPlayback(START_POSITION, 600 * 1000 + 150, DELAYS, 0);
    expect(next.index).toBe(1);
    expect(next.carryMs).toBe(50);
  });

  it("plays loopCount + 1 times, then stops on the last frame", () => {
    let pos = stepPlayback(START_POSITION, 600, DELAYS, 1);
    expect(pos).toMatchObject({ index: 0, loop: 1, done: false });
    pos = stepPlayback(pos, 599, DELAYS, 1);
    expect(pos).toMatchObject({ index: 2, done: false });
    pos = stepPlayback(pos, 1, DELAYS, 1);
    expect(pos).toEqual({ index: 2, carryMs: 0, loop: 1, done: true });
    expect(stepPlayback(pos, 5000, DELAYS, 1)).toBe(pos);
  });

  it("ignores negative elapsed time", () => {
    const pos = { index: 1, carryMs: 50, loop: 0, done: false };
    expect(stepPlayback(pos, -20, DELAYS, 0)).toEqual(pos);
  });
});

describe("useGifPlayback", () => {
  it("swaps the node image on each tick without re-rendering", () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    vi.spyOn(performance, "now").mockReturnValue(0);

    const frames = [100, 100, 100].map((delayMs) => ({
      canvas: document.createElement("canvas"),
      delayMs,
    }));
    const item: CanvasImageItem = {
      id: "gif",
      label: "a.gif",
      canvas: frames[0]!.canvas,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      frames,
      loopCount: 0,
    };
    let shown: unknown = null;
    const node = {
      image: (value?: unknown) => {
        if (value !== undefined) shown = value;
        return shown;
      },
    } as unknown as Konva.Image;
    const batchDraw = vi.fn();
    const nodesRef = { current: new Map([["gif", node]]) };
    const layerRef = { current: { batchDraw } as unknown as Konva.Layer };

    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useGifPlayback({ item, nodesRef, layerRef, playing: true });
    });
    const rendersBefore = renders;

    const tick = (now: number) => act(() => callbacks.shift()!(now));
    tick(150);
    expect(shown).toBe(frames[1]!.canvas);
    tick(250);
    expect(shown).toBe(frames[2]!.canvas);
    expect(renders).toBe(rendersBefore);
    expect(result.current.currentFrame()).toBe(2);
    expect(batchDraw).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
