import { describe, it, expect } from "vitest";
import { START_POSITION, stepPlayback } from "./useGifPlayback";

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
