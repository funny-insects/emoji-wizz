import { useRef, useState, useCallback } from "react";
import type { StickerDescriptor } from "../utils/stickerTypes";

export function useStickerHistory() {
  const undoStackRef = useRef<StickerDescriptor[][]>([]);
  const redoStackRef = useRef<StickerDescriptor[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushState = useCallback((snapshot: StickerDescriptor[]) => {
    undoStackRef.current.push(snapshot);
    redoStackRef.current = [];
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(false);
  }, []);

  const undo = useCallback((): StickerDescriptor[] | null => {
    if (undoStackRef.current.length <= 1) return null;
    const popped = undoStackRef.current.pop()!;
    redoStackRef.current.push(popped);
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(true);
    return previous ?? null;
  }, []);

  const redo = useCallback((): StickerDescriptor[] | null => {
    if (redoStackRef.current.length === 0) return null;
    const snapshot = redoStackRef.current.pop()!;
    undoStackRef.current.push(snapshot);
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(redoStackRef.current.length > 0);
    return snapshot;
  }, []);

  const clear = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return { pushState, undo, redo, canUndo, canRedo, clear };
}
