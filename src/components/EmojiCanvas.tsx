import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Circle } from "react-konva";
import Konva from "konva";
import { type PlatformPreset } from "../utils/presets";
import { computeContainRect } from "../utils/imageScaling";
import type { EditorTool } from "../App";

interface EmojiCanvasProps {
  preset: PlatformPreset;
  image: HTMLImageElement | null;
  handleFileInput: React.ChangeEventHandler<HTMLInputElement>;
  handleDrop: React.DragEventHandler<HTMLDivElement>;
  handlePaste: (e: ClipboardEvent) => void;
  activeTool?: EditorTool;
  onToolChange?: (tool: EditorTool) => void;
  onPushState?: (snapshot: string) => void;
  restoreSnapshot?: string | null;
  onSnapshotRestored?: () => void;
}

const TILE_SIZE = 8;

function buildCheckerboard(
  width: number,
  height: number,
): { x: number; y: number; fill: string }[] {
  const tiles: { x: number; y: number; fill: string }[] = [];
  for (let y = 0; y < height; y += TILE_SIZE) {
    for (let x = 0; x < width; x += TILE_SIZE) {
      const isLight =
        (Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 2 === 0;
      tiles.push({ x, y, fill: isLight ? "#FFFFFF" : "#CCCCCC" });
    }
  }
  return tiles;
}

export function EmojiCanvas({
  preset,
  image,
  handleFileInput,
  handleDrop,
  handlePaste,
  activeTool,
  onPushState,
  restoreSnapshot,
  onSnapshotRestored,
}: EmojiCanvasProps) {
  const { width, height, safeZonePadding } = preset;
  const tiles = buildCheckerboard(width, height);

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isErasingRef = useRef(false);
  const onSnapshotRestoredRef = useRef(onSnapshotRestored);
  const onPushStateRef = useRef(onPushState);

  useEffect(() => {
    onSnapshotRestoredRef.current = onSnapshotRestored;
  });
  useEffect(() => {
    onPushStateRef.current = onPushState;
  });

  // Track the canvas currently rendered by Konva
  const [displayCanvas, setDisplayCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );

  // Track previous image + stage dimensions to detect changes without useEffect setState
  const [prevImage, setPrevImage] = useState<HTMLImageElement | null>(null);
  const [prevDimensions, setPrevDimensions] = useState("");

  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const imageRect = useMemo(
    () =>
      image
        ? computeContainRect(
            image.naturalWidth,
            image.naturalHeight,
            width,
            height,
          )
        : null,
    [image, width, height],
  );

  const eraserRadius = Math.round((width / 128) * 3);

  // Derived state: rebuild offscreen canvas when image or stage dimensions change.
  // Following the React "Storing information from previous renders" pattern to avoid
  // calling setState inside a useEffect (react-hooks/set-state-in-effect).
  const currentDimensions = `${width}x${height}`;
  if (image !== prevImage || currentDimensions !== prevDimensions) {
    setPrevImage(image);
    setPrevDimensions(currentDimensions);
    if (image && imageRect) {
      const canvas = document.createElement("canvas");
      canvas.width = imageRect.width;
      canvas.height = imageRect.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, imageRect.width, imageRect.height);
      }
      setDisplayCanvas(canvas);
    } else {
      setDisplayCanvas(null);
    }
  }

  // Sync ref with displayCanvas and push initial snapshot when canvas is ready.
  // Ref mutation and external function calls are allowed in effects.
  useEffect(() => {
    offscreenCanvasRef.current = displayCanvas;
    if (displayCanvas) {
      onPushStateRef.current?.(displayCanvas.toDataURL("image/png"));
    }
  }, [displayCanvas]);

  // Restore snapshot (setState is inside img.onload — async, not flagged by lint rule)
  useEffect(() => {
    if (!restoreSnapshot) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      offscreenCanvasRef.current = canvas;
      setDisplayCanvas(canvas);
      onSnapshotRestoredRef.current?.();
    };
    img.src = restoreSnapshot;
  }, [restoreSnapshot]);

  // Paste handler
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const applyEraserAt = useCallback(
    (stageX: number, stageY: number) => {
      if (!offscreenCanvasRef.current || !imageRect) return;
      const ctx = offscreenCanvasRef.current.getContext("2d");
      if (!ctx) return;
      const prevOp = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(
        stageX - imageRect.x,
        stageY - imageRect.y,
        eraserRadius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalCompositeOperation = prevOp;
    },
    [imageRect, eraserRadius],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "eraser" || !offscreenCanvasRef.current) return;
      isErasingRef.current = true;
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      applyEraserAt(pos.x, pos.y);
      stage?.getLayers()[1]?.batchDraw();
    },
    [activeTool, applyEraserAt],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      if (activeTool === "eraser") {
        setEraserPos({ x: pos.x, y: pos.y });
        if (!isErasingRef.current) return;
        applyEraserAt(pos.x, pos.y);
        stage?.getLayers()[1]?.batchDraw();
      }
    },
    [activeTool, applyEraserAt],
  );

  const handleMouseUp = useCallback(() => {
    if (!isErasingRef.current || activeTool !== "eraser") return;
    isErasingRef.current = false;
    if (offscreenCanvasRef.current) {
      onPushStateRef.current?.(
        offscreenCanvasRef.current.toDataURL("image/png"),
      );
    }
  }, [activeTool]);

  const handleMouseLeave = useCallback(() => {
    setEraserPos(null);
    if (isErasingRef.current && activeTool === "eraser") {
      isErasingRef.current = false;
      if (offscreenCanvasRef.current) {
        onPushStateRef.current?.(
          offscreenCanvasRef.current.toDataURL("image/png"),
        );
      }
    }
  }, [activeTool]);

  const containerStyle: React.CSSProperties =
    activeTool === "eraser" && image ? { cursor: "none" } : {};

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={containerStyle}
    >
      <Stage
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Layer>
          {tiles.map((tile, i) => (
            <Rect
              key={i}
              x={tile.x}
              y={tile.y}
              width={TILE_SIZE}
              height={TILE_SIZE}
              fill={tile.fill}
            />
          ))}
          <Rect
            x={safeZonePadding}
            y={safeZonePadding}
            width={width - 2 * safeZonePadding}
            height={height - 2 * safeZonePadding}
            stroke="rgba(0, 120, 255, 0.5)"
            strokeWidth={1}
            dash={[4, 4]}
            fill="transparent"
          />
        </Layer>
        <Layer>
          {image && imageRect && displayCanvas && (
            <KonvaImage
              image={displayCanvas}
              x={imageRect.x}
              y={imageRect.y}
              width={imageRect.width}
              height={imageRect.height}
            />
          )}
        </Layer>
        <Layer>
          {activeTool === "eraser" && eraserPos && image && (
            <Circle
              x={eraserPos.x}
              y={eraserPos.y}
              radius={eraserRadius}
              stroke="rgba(0,0,0,0.7)"
              strokeWidth={1.5}
              fill="transparent"
              listening={false}
            />
          )}
        </Layer>
      </Stage>
      <input type="file" accept="image/*" onChange={handleFileInput} />
    </div>
  );
}
