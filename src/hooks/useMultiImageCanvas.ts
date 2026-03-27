import { useState, useRef, useCallback } from "react";
import type {
  CanvasImageItem,
  CanvasImageSnapshot,
} from "../utils/canvasImageTypes";

const CANVAS_SIZE = 512;
const MAX_IMAGE_SIZE = 256;
const MAX_HISTORY = 20;

function serializeItem(item: CanvasImageItem): CanvasImageSnapshot {
  return {
    id: item.id,
    label: item.label,
    dataUrl: item.canvas.toDataURL("image/png"),
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    scaleX: item.scaleX,
    scaleY: item.scaleY,
    rotation: item.rotation,
  };
}

function deserializeSnapshot(
  snap: CanvasImageSnapshot,
): Promise<CanvasImageItem> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve({
        id: snap.id,
        label: snap.label,
        canvas,
        x: snap.x,
        y: snap.y,
        width: snap.width,
        height: snap.height,
        scaleX: snap.scaleX,
        scaleY: snap.scaleY,
        rotation: snap.rotation,
      });
    };
    img.src = snap.dataUrl;
  });
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

  const setItems = useCallback((newItems: CanvasImageItem[]) => {
    itemsRef.current = newItems;
    setItemsState(newItems);
  }, []);

  const pushHistory = useCallback(() => {
    const snapshot = itemsRef.current.map(serializeItem);
    if (undoStack.current.length >= MAX_HISTORY) undoStack.current.shift();
    undoStack.current.push(snapshot);
    redoStack.current = [];
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(false);
  }, []);

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
      const item: CanvasImageItem = {
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
      setItems([...itemsRef.current, item]);
      return item.id;
    },
    [setItems],
  );

  const updateItem = useCallback(
    (updated: CanvasImageItem) => {
      setItems(itemsRef.current.map((i) => (i.id === updated.id ? updated : i)));
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
    const restored = await Promise.all(previous.map(deserializeSnapshot));
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
    const restored = await Promise.all(entry.map(deserializeSnapshot));
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
    setCanUndo(false);
    setCanRedo(false);
  }, [setItems]);

  return {
    items,
    activeImageId,
    setActiveImageId,
    addImage,
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
