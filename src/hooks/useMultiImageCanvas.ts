import { useState, useRef, useCallback } from "react";
import {
  isAnimated,
  type AnimationFrame,
  type CanvasImageItem,
  type CanvasImageSnapshot,
} from "../utils/canvasImageTypes";

const CANVAS_SIZE = 512;
const MAX_IMAGE_SIZE = 256;
const MAX_HISTORY = 20;

type FrameSet = readonly AnimationFrame[];

interface FrameSetRegistry {
  sets: Map<string, FrameSet>;
  ids: WeakMap<FrameSet, string>;
}

type ItemGeometry = Pick<
  CanvasImageItem,
  | "id"
  | "label"
  | "x"
  | "y"
  | "width"
  | "height"
  | "scaleX"
  | "scaleY"
  | "rotation"
>;

function geometryOf(src: ItemGeometry): ItemGeometry {
  return {
    id: src.id,
    label: src.label,
    x: src.x,
    y: src.y,
    width: src.width,
    height: src.height,
    scaleX: src.scaleX,
    scaleY: src.scaleY,
    rotation: src.rotation,
  };
}

function serializeItem(
  item: CanvasImageItem,
  registry: FrameSetRegistry,
): CanvasImageSnapshot {
  if (!isAnimated(item)) {
    return {
      kind: "static",
      ...geometryOf(item),
      dataUrl: item.canvas.toDataURL("image/png"),
    };
  }
  let frameSetId = registry.ids.get(item.frames);
  if (!frameSetId) {
    frameSetId = crypto.randomUUID();
    registry.ids.set(item.frames, frameSetId);
  }
  registry.sets.set(frameSetId, item.frames);
  return {
    kind: "animated",
    ...geometryOf(item),
    frameSetId,
    posterIndex: Math.max(
      0,
      item.frames.findIndex((f) => f.canvas === item.canvas),
    ),
    loopCount: item.loopCount ?? 0,
  };
}

function deserializeSnapshot(
  snap: CanvasImageSnapshot,
  registry: FrameSetRegistry,
): Promise<CanvasImageItem> {
  if (snap.kind === "animated") {
    const frames = registry.sets.get(snap.frameSetId)!;
    return Promise.resolve({
      ...geometryOf(snap),
      canvas: (frames[snap.posterIndex] ?? frames[0]!).canvas,
      frames,
      loopCount: snap.loopCount,
    });
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve({ ...geometryOf(snap), canvas });
    };
    img.src = snap.dataUrl;
  });
}

function centeredItem(
  canvas: HTMLCanvasElement,
  label: string,
): CanvasImageItem {
  const w = canvas.width;
  const h = canvas.height;
  return {
    id: crypto.randomUUID(),
    label,
    canvas,
    x: Math.round((CANVAS_SIZE - w) / 2),
    y: Math.round((CANVAS_SIZE - h) / 2),
    width: w,
    height: h,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  };
}

export function useMultiImageCanvas() {
  const [items, setItemsState] = useState<CanvasImageItem[]>([]);
  const itemsRef = useRef<CanvasImageItem[]>([]);

  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  // Start with one empty entry so the first add is undoable
  const undoStack = useRef<CanvasImageSnapshot[][]>([[]]);
  const redoStack = useRef<CanvasImageSnapshot[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const registry = useRef<FrameSetRegistry>({
    sets: new Map(),
    ids: new WeakMap(),
  });

  const pruneFrameSets = useCallback(() => {
    const referenced = new Set<string>();
    for (const entry of [...undoStack.current, ...redoStack.current]) {
      for (const snap of entry) {
        if (snap.kind === "animated") referenced.add(snap.frameSetId);
      }
    }
    for (const id of registry.current.sets.keys()) {
      if (!referenced.has(id)) registry.current.sets.delete(id);
    }
  }, []);

  const setItems = useCallback((newItems: CanvasImageItem[]) => {
    itemsRef.current = newItems;
    setItemsState(newItems);
  }, []);

  const pushHistory = useCallback(() => {
    const snapshot = itemsRef.current.map((item) =>
      serializeItem(item, registry.current),
    );
    if (undoStack.current.length >= MAX_HISTORY) undoStack.current.shift();
    undoStack.current.push(snapshot);
    redoStack.current = [];
    pruneFrameSets();
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(false);
  }, [pruneFrameSets]);

  const addImage = useCallback(
    (img: HTMLImageElement, label: string): string => {
      const scale = Math.min(
        1,
        MAX_IMAGE_SIZE / Math.max(img.naturalWidth, img.naturalHeight, 1),
      );
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const item = centeredItem(canvas, label);
      setItems([...itemsRef.current, item]);
      return item.id;
    },
    [setItems],
  );

  const addAnimatedImage = useCallback(
    (
      frames: AnimationFrame[],
      label: string,
      loopCount: number,
    ): string | null => {
      if (frames.length === 0 || itemsRef.current.some(isAnimated)) return null;
      const item: CanvasImageItem = {
        ...centeredItem(frames[0]!.canvas, label),
        frames,
        loopCount,
      };
      setItems([...itemsRef.current, item]);
      return item.id;
    },
    [setItems],
  );

  const updateItem = useCallback(
    (updated: CanvasImageItem) => {
      setItems(
        itemsRef.current.map((i) => (i.id === updated.id ? updated : i)),
      );
    },
    [setItems],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems(itemsRef.current.filter((i) => i.id !== id));
      setActiveImageId((prev) => (prev === id ? null : prev));
    },
    [setItems],
  );

  const reorderItems = useCallback(
    (newOrder: CanvasImageItem[]) => {
      setItems(newOrder);
    },
    [setItems],
  );

  const undo = useCallback(async () => {
    if (undoStack.current.length <= 1) return;
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);
    const previous = undoStack.current[undoStack.current.length - 1]!;
    const restored = await Promise.all(
      previous.map((snap) => deserializeSnapshot(snap, registry.current)),
    );
    setItems(restored);
    setActiveImageId((prev) =>
      restored.some((i) => i.id === prev) ? prev : null,
    );
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(true);
  }, [setItems]);

  const redo = useCallback(async () => {
    if (redoStack.current.length === 0) return;
    const entry = redoStack.current.pop()!;
    undoStack.current.push(entry);
    const restored = await Promise.all(
      entry.map((snap) => deserializeSnapshot(snap, registry.current)),
    );
    setItems(restored);
    setActiveImageId((prev) =>
      restored.some((i) => i.id === prev) ? prev : null,
    );
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }, [setItems]);

  const clear = useCallback(() => {
    setItems([]);
    setActiveImageId(null);
    undoStack.current = [[]];
    redoStack.current = [];
    registry.current.sets.clear();
    setCanUndo(false);
    setCanRedo(false);
  }, [setItems]);

  return {
    items,
    activeImageId,
    setActiveImageId,
    addImage,
    addAnimatedImage,
    hasAnimatedItem: items.some(isAnimated),
    updateItem,
    removeItem,
    reorderItems,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
}
