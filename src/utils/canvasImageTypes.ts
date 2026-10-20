export interface AnimationFrame {
  canvas: HTMLCanvasElement;
  delayMs: number;
}

export interface CanvasImageItem {
  id: string;
  label: string;
  /** Displayed frame at rest; for animated items always one of `frames[i].canvas`. */
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  /** Never mutated in place; per-frame operations produce a new array of new canvases. */
  frames?: readonly AnimationFrame[];
  /** 0 = loop forever. */
  loopCount?: number;
}

interface CanvasImageSnapshotBase {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface StaticImageSnapshot extends CanvasImageSnapshotBase {
  kind: "static";
  dataUrl: string;
}

export interface AnimatedImageSnapshot extends CanvasImageSnapshotBase {
  kind: "animated";
  frameSetId: string;
  posterIndex: number;
  loopCount: number;
}

export type CanvasImageSnapshot = StaticImageSnapshot | AnimatedImageSnapshot;

export function isAnimated(
  item: Pick<CanvasImageItem, "frames">,
): item is CanvasImageItem & { frames: readonly AnimationFrame[] } {
  return (item.frames?.length ?? 0) > 1;
}
