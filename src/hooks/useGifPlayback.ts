import { useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import type {
  AnimationFrame,
  CanvasImageItem,
} from "../utils/canvasImageTypes";

export interface PlaybackPosition {
  index: number;
  carryMs: number;
  loop: number;
  done: boolean;
}

export const START_POSITION: PlaybackPosition = {
  index: 0,
  carryMs: 0,
  loop: 0,
  done: false,
};

/** loopCount follows the NETSCAPE extension: 0 = forever, n = play n + 1 times. */
export function stepPlayback(
  position: PlaybackPosition,
  elapsedMs: number,
  delays: readonly number[],
  loopCount: number,
): PlaybackPosition {
  const n = delays.length;
  if (n === 0 || position.done) return position;
  const delayAt = (i: number) => Math.max(1, delays[i] ?? 1);
  let { index, loop } = position;
  let carryMs = position.carryMs + Math.max(0, elapsedMs);
  if (loopCount === 0) {
    const total = delays.reduce((sum, _, i) => sum + delayAt(i), 0);
    carryMs %= total;
  }

  while (carryMs >= delayAt(index)) {
    carryMs -= delayAt(index);
    if (index + 1 < n) {
      index += 1;
    } else if (loopCount > 0 && loop >= loopCount) {
      return { index, carryMs: 0, loop, done: true };
    } else {
      index = 0;
      loop += 1;
    }
  }
  return { index, carryMs, loop, done: false };
}

function posterIndex(item: CanvasImageItem | null): number {
  const frames = item?.frames;
  if (!item || !frames) return 0;
  return Math.max(
    0,
    frames.findIndex((f) => f.canvas === item.canvas),
  );
}

interface UseGifPlaybackOptions {
  item: CanvasImageItem | null;
  nodesRef: React.RefObject<Map<string, Konva.Image>>;
  layerRef: React.RefObject<Konva.Layer | null>;
  playing: boolean;
}

export function useGifPlayback({
  item,
  nodesRef,
  layerRef,
  playing,
}: UseGifPlaybackOptions) {
  const frames: readonly AnimationFrame[] | undefined =
    item && (item.frames?.length ?? 0) > 1 ? item.frames : undefined;
  const itemId = item?.id ?? null;
  const loopCount = item?.loopCount ?? 0;

  const restIndex = posterIndex(item);
  const [frameIndexState, setFrameIndexState] = useState(restIndex);
  const [prevRest, setPrevRest] = useState({ frames, restIndex });
  if (frames !== prevRest.frames || restIndex !== prevRest.restIndex) {
    setPrevRest({ frames, restIndex });
    setFrameIndexState(restIndex);
  }
  const frameIndex = frames ? Math.min(frameIndexState, frames.length - 1) : 0;

  const positionRef = useRef<PlaybackPosition>(START_POSITION);

  const showFrameOnNode = useCallback(
    (index: number) => {
      if (!frames || !itemId) return;
      const target = frames[Math.min(index, frames.length - 1)]?.canvas;
      const node = nodesRef.current.get(itemId);
      if (!target || !node || node.image() === target) return;
      node.image(target);
      layerRef.current?.batchDraw();
    },
    [frames, itemId, nodesRef, layerRef],
  );

  useEffect(() => {
    positionRef.current = { ...START_POSITION, index: restIndex };
  }, [frames, restIndex]);

  useEffect(() => {
    if (!playing || !frames) return;
    const delays = frames.map((f) => f.delayMs);
    if (positionRef.current.done) positionRef.current = START_POSITION;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = stepPlayback(
        positionRef.current,
        now - last,
        delays,
        loopCount,
      );
      last = now;
      positionRef.current = next;
      showFrameOnNode(next.index);
      if (!next.done) rafId = requestAnimationFrame(tick);
    };
    showFrameOnNode(positionRef.current.index);
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, frames, loopCount, showFrameOnNode]);

  useEffect(() => {
    if (playing) return;
    showFrameOnNode(frameIndex);
  }, [playing, frameIndex, showFrameOnNode]);

  const setFrameIndex = useCallback((index: number) => {
    positionRef.current = { ...START_POSITION, index };
    setFrameIndexState(index);
  }, []);

  const currentFrame = useCallback(() => positionRef.current.index, []);

  const showFrame = useCallback(
    (index: number) => {
      if (!frames || !itemId) return;
      const target = frames[index]?.canvas;
      const node = nodesRef.current.get(itemId);
      if (target && node) node.image(target);
    },
    [frames, itemId, nodesRef],
  );

  return { frameIndex, setFrameIndex, currentFrame, showFrame };
}
