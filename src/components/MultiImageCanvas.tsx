import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Circle,
  Transformer,
  Text as KonvaText,
} from "react-konva";
import Konva from "konva";
import { removeBackground } from "../utils/removeBackground";
import {
  rotateCanvas90,
  flipCanvas,
  reframeCanvas,
  cropCanvas,
} from "../utils/imageTransforms";
import type { EditorTool } from "../App";
import type { CanvasImageItem } from "../utils/canvasImageTypes";
import type { StickerDescriptor } from "../utils/stickerTypes";

const CANVAS_SIZE = 512;
const TILE_SIZE = 8;

function buildCheckerboard(
  w: number,
  h: number,
): { x: number; y: number; fill: string }[] {
  const tiles: { x: number; y: number; fill: string }[] = [];
  for (let y = 0; y < h; y += TILE_SIZE) {
    for (let x = 0; x < w; x += TILE_SIZE) {
      const isLight =
        (Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 2 === 0;
      tiles.push({ x, y, fill: isLight ? "#FFFFFF" : "#CCCCCC" });
    }
  }
  return tiles;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export interface MultiImageCanvasProps {
  items: CanvasImageItem[];
  activeImageId: string | null;
  stageRef?: React.RefObject<Konva.Stage | null>;
  activeTool?: EditorTool;
  onToolChange?: (tool: EditorTool) => void;
  brushColor?: string;
  brushSize?: number;
  eraserSize?: number;
  bgRemovalRequest?: { tolerance: number; seq: number } | null;
  transformRequest?: {
    type: "rotateCW" | "rotateCCW" | "flipH" | "flipV";
    seq: number;
  } | null;
  cropConfirmSeq?: number;
  bgColor?: string | null;
  onBgColorChange?: (color: string | null) => void;
  stickers?: StickerDescriptor[];
  selectedStickerId?: string | null;
  onUpdateSticker?: (desc: StickerDescriptor) => void;
  onDeleteSticker?: (id: string) => void;
  onSelectSticker?: (id: string | null) => void;
  activeFrameSrc?: string | null;
  frameThickness?: number;
  onAddImage: (img: HTMLImageElement, label: string) => void;
  onUpdateItem: (updated: CanvasImageItem) => void;
  onRemoveItem: (id: string) => void;
  onSetActiveImageId: (id: string | null) => void;
  onPushHistory: () => void;
}

export function MultiImageCanvas({
  items,
  activeImageId,
  stageRef,
  activeTool = "pointer",
  onToolChange,
  brushColor = "#000000",
  brushSize,
  eraserSize = 12,
  bgColor = null,
  onBgColorChange,
  stickers = [],
  selectedStickerId = null,
  onUpdateSticker,
  onDeleteSticker,
  onSelectSticker,
  activeFrameSrc = null,
  frameThickness = 50,
  bgRemovalRequest = null,
  transformRequest = null,
  cropConfirmSeq = 0,
  onAddImage,
  onUpdateItem,
  onRemoveItem,
  onSetActiveImageId,
  onPushHistory,
}: MultiImageCanvasProps) {
  const tiles = useMemo(() => buildCheckerboard(CANVAS_SIZE, CANVAS_SIZE), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsLayerRef = useRef<Konva.Layer | null>(null);
  const overlayLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const cropRectNodeRef = useRef<Konva.Rect | null>(null);
  const cropTransformerRef = useRef<Konva.Transformer | null>(null);
  const itemNodeRefs = useRef<Map<string, Konva.Image>>(new Map());
  const stickerNodeRefs = useRef<Map<string, Konva.Image>>(new Map());
  const stickerTransformerRef = useRef<Konva.Transformer | null>(null);
  const [stickerImages, setStickerImages] = useState<
    Record<string, HTMLImageElement>
  >({});
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);

  const isErasingRef = useRef(false);
  const isBrushingRef = useRef(false);
  const currentBrushLineRef = useRef<Konva.Line | null>(null);

  const prevBgRemovalSeqRef = useRef(bgRemovalRequest?.seq ?? -1);
  const prevTransformSeqRef = useRef(transformRequest?.seq ?? -1);
  const prevCropConfirmSeqRef = useRef(cropConfirmSeq);

  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [cropRect, setCropRect] = useState<{
    x: number;
    y: number;
    size: number;
  } | null>(null);

  // Increment to force Konva layer redraw after in-place canvas mutations
  const [renderRevision, setRenderRevision] = useState(0);
  const bumpRevision = useCallback(() => setRenderRevision((r) => r + 1), []);

  const brushStrokeWidth = brushSize ?? Math.round((CANVAS_SIZE / 128) * 3);

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeImageId) ?? null,
    [items, activeImageId],
  );

  // ── Paste listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const clipItems = e.clipboardData?.items;
      if (!clipItems) return;
      for (const item of clipItems) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;
          const img = await loadImageFromBlob(blob);
          onAddImage(img, "pasted-image");
          onPushHistory();
          return;
        }
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onAddImage, onPushHistory]);

  // ── Load sticker images ─────────────────────────────────────────────────────
  useEffect(() => {
    stickers.forEach((s) => {
      if (!stickerImages[s.src]) {
        const img = new window.Image();
        img.onload = () =>
          setStickerImages((prev) => ({ ...prev, [s.src]: img }));
        img.src = s.src;
      }
    });
  }, [stickers, stickerImages]);

  // ── Load frame image ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeFrameSrc) return;
    const img = new window.Image();
    img.onload = () => setFrameImage(img);
    img.src = activeFrameSrc;
    return () => setFrameImage(null);
  }, [activeFrameSrc]);

  // ── Wire sticker transformer ────────────────────────────────────────────────
  useEffect(() => {
    const tr = stickerTransformerRef.current;
    if (!tr) return;
    if (selectedStickerId) {
      const node = stickerNodeRefs.current.get(selectedStickerId);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
      }
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedStickerId]);

  // ── Wire Transformer to active item ────────────────────────────────────────
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (activeImageId) {
      const node = itemNodeRefs.current.get(activeImageId);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
      }
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [activeImageId, renderRevision]);

  // ── Wire Crop Transformer ───────────────────────────────────────────────────
  useEffect(() => {
    const tr = cropTransformerRef.current;
    const node = cropRectNodeRef.current;
    if (!tr) return;
    if (activeTool === "crop" && node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [activeTool, cropRect]);

  // ── Initialize crop rect when tool switches to crop ────────────────────────
  const [prevActiveTool, setPrevActiveTool] = useState<EditorTool>(activeTool);
  if (activeTool !== prevActiveTool) {
    setPrevActiveTool(activeTool);
    if (activeTool === "crop") {
      if (activeItem) {
        const displayW = activeItem.width * activeItem.scaleX;
        const displayH = activeItem.height * activeItem.scaleY;
        const size = Math.round(Math.min(displayW, displayH) * 0.8);
        const cx = Math.round(activeItem.x + displayW / 2 - size / 2);
        const cy = Math.round(activeItem.y + displayH / 2 - size / 2);
        setCropRect({ x: cx, y: cy, size });
      } else {
        const defaultSize = Math.round(CANVAS_SIZE * 0.5);
        const offset = Math.round((CANVAS_SIZE - defaultSize) / 2);
        setCropRect({ x: offset, y: offset, size: defaultSize });
      }
    } else if (cropRect !== null) {
      setCropRect(null);
    }
  }

  // ── Crop confirm ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cropConfirmSeq === prevCropConfirmSeqRef.current) return;
    prevCropConfirmSeqRef.current = cropConfirmSeq;
    if (!cropRect || !activeItem) return;

    const localX = Math.max(
      0,
      Math.round((cropRect.x - activeItem.x) / activeItem.scaleX),
    );
    const localY = Math.max(
      0,
      Math.round((cropRect.y - activeItem.y) / activeItem.scaleY),
    );
    const localSize = Math.max(
      1,
      Math.round(
        Math.min(
          cropRect.size / activeItem.scaleX,
          activeItem.canvas.width - localX,
          activeItem.canvas.height - localY,
        ),
      ),
    );

    const croppedCanvas = cropCanvas(activeItem.canvas, {
      x: localX,
      y: localY,
      size: localSize,
    });
    const updatedItem: CanvasImageItem = {
      ...activeItem,
      canvas: croppedCanvas,
      x: cropRect.x,
      y: cropRect.y,
      width: localSize,
      height: localSize,
      scaleX: 1,
      scaleY: 1,
    };
    const timerId = setTimeout(() => {
      setCropRect(null);
      onUpdateItem(updatedItem);
      onPushHistory();
      onToolChange?.("pointer");
    }, 0);
    return () => clearTimeout(timerId);
  }, [cropConfirmSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Transform request (rotate / flip) ──────────────────────────────────────
  useEffect(() => {
    if (!transformRequest) return;
    if (transformRequest.seq === prevTransformSeqRef.current) return;
    prevTransformSeqRef.current = transformRequest.seq;
    if (!activeItem) return;

    let result: HTMLCanvasElement;
    switch (transformRequest.type) {
      case "rotateCW":
        result = rotateCanvas90(activeItem.canvas, "cw");
        break;
      case "rotateCCW":
        result = rotateCanvas90(activeItem.canvas, "ccw");
        break;
      case "flipH":
        result = flipCanvas(activeItem.canvas, "horizontal");
        break;
      case "flipV":
        result = flipCanvas(activeItem.canvas, "vertical");
        break;
    }
    // For rotation the canvas dims swap; reframe to current visual dimensions
    const targetW = Math.round(activeItem.width * activeItem.scaleX);
    const targetH = Math.round(activeItem.height * activeItem.scaleY);
    const reframed = reframeCanvas(result, targetW, targetH);
    onUpdateItem({
      ...activeItem,
      canvas: reframed,
      width: targetW,
      height: targetH,
      scaleX: 1,
      scaleY: 1,
    });
    onPushHistory();
  }, [transformRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Background removal request ──────────────────────────────────────────────
  useEffect(() => {
    if (!bgRemovalRequest) return;
    if (bgRemovalRequest.seq === prevBgRemovalSeqRef.current) return;
    prevBgRemovalSeqRef.current = bgRemovalRequest.seq;
    if (!activeItem) return;

    const src = activeItem.canvas;
    const ctx = src.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, src.width, src.height);
    const result = removeBackground(imageData, bgRemovalRequest.tolerance);
    const newCanvas = document.createElement("canvas");
    newCanvas.width = src.width;
    newCanvas.height = src.height;
    newCanvas.getContext("2d")!.putImageData(result, 0, 0);
    onUpdateItem({ ...activeItem, canvas: newCanvas });
    onPushHistory();
  }, [bgRemovalRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Eraser helper (maps stage coords → item-local coords) ──────────────────
  const applyEraserAt = useCallback(
    (stageX: number, stageY: number) => {
      if (!activeItem) return;
      const ctx = activeItem.canvas.getContext("2d");
      if (!ctx) return;
      const localX = (stageX - activeItem.x) / activeItem.scaleX;
      const localY = (stageY - activeItem.y) / activeItem.scaleY;
      const localRadius =
        eraserSize / Math.max(activeItem.scaleX, activeItem.scaleY);
      const prevOp = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(localX, localY, localRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = prevOp;
    },
    [activeItem, eraserSize],
  );

  // ── Brush flatten helper (maps stage-coord line → item-local canvas) ────────
  const flattenBrushLine = useCallback(() => {
    const line = currentBrushLineRef.current;
    if (!line || !activeItem) return false;
    const ctx = activeItem.canvas.getContext("2d");
    if (!ctx) return false;
    const pts = line.points();
    if (pts.length < 2) return false;
    ctx.save();
    ctx.setTransform(
      1 / activeItem.scaleX,
      0,
      0,
      1 / activeItem.scaleY,
      -activeItem.x / activeItem.scaleX,
      -activeItem.y / activeItem.scaleY,
    );
    ctx.strokeStyle = line.stroke();
    ctx.lineWidth = line.strokeWidth();
    ctx.lineCap = line.lineCap() as CanvasLineCap;
    ctx.lineJoin = line.lineJoin() as CanvasLineJoin;
    ctx.beginPath();
    ctx.moveTo(pts[0]!, pts[1]!);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pts[i]!, pts[i + 1]!);
    }
    ctx.stroke();
    ctx.restore();
    line.destroy();
    currentBrushLineRef.current = null;
    overlayLayerRef.current?.batchDraw();
    return true;
  }, [activeItem]);

  // ── Mouse handlers ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!activeItem) return;
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;

      if (activeTool === "eraser") {
        isErasingRef.current = true;
        applyEraserAt(pos.x, pos.y);
        bumpRevision();
        itemsLayerRef.current?.batchDraw();
      } else if (activeTool === "brush") {
        isBrushingRef.current = true;
        const line = new Konva.Line({
          stroke: brushColor,
          strokeWidth: brushStrokeWidth,
          lineCap: "round",
          lineJoin: "round",
          points: [pos.x, pos.y, pos.x, pos.y],
        });
        overlayLayerRef.current?.add(line);
        currentBrushLineRef.current = line;
        overlayLayerRef.current?.batchDraw();
      }
    },
    [
      activeTool,
      activeItem,
      applyEraserAt,
      brushColor,
      brushStrokeWidth,
      bumpRevision,
    ],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;

      if (activeTool === "eraser" || activeTool === "brush") {
        setEraserPos({ x: pos.x, y: pos.y });
      }

      if (activeTool === "eraser" && isErasingRef.current && activeItem) {
        applyEraserAt(pos.x, pos.y);
        itemsLayerRef.current?.batchDraw();
      } else if (
        activeTool === "brush" &&
        isBrushingRef.current &&
        currentBrushLineRef.current
      ) {
        const points = currentBrushLineRef.current.points();
        currentBrushLineRef.current.points([...points, pos.x, pos.y]);
        overlayLayerRef.current?.batchDraw();
      }
    },
    [activeTool, activeItem, applyEraserAt],
  );

  const handleMouseUp = useCallback(() => {
    if (isErasingRef.current && activeTool === "eraser") {
      isErasingRef.current = false;
      onPushHistory();
    } else if (isBrushingRef.current && activeTool === "brush") {
      isBrushingRef.current = false;
      flattenBrushLine();
      itemsLayerRef.current?.batchDraw();
      onPushHistory();
    }
  }, [activeTool, flattenBrushLine, onPushHistory]);

  const handleMouseLeave = useCallback(() => {
    setEraserPos(null);
    if (isErasingRef.current && activeTool === "eraser") {
      isErasingRef.current = false;
      onPushHistory();
    } else if (isBrushingRef.current && activeTool === "brush") {
      isBrushingRef.current = false;
      flattenBrushLine();
      itemsLayerRef.current?.batchDraw();
      onPushHistory();
    }
  }, [activeTool, flattenBrushLine, onPushHistory]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const target = e.target;
      const isTransformerPart =
        target instanceof Konva.Transformer ||
        target.getParent() instanceof Konva.Transformer;
      if (isTransformerPart) return;

      const clickedItemId = [...itemNodeRefs.current.entries()].find(
        ([, node]) => node === target,
      )?.[0];
      const clickedStickerId = [...stickerNodeRefs.current.entries()].find(
        ([, node]) => node === target,
      )?.[0];

      if (clickedItemId) {
        onSetActiveImageId(clickedItemId);
        onSelectSticker?.(null);
      } else if (clickedStickerId) {
        onSelectSticker?.(clickedStickerId);
        onSetActiveImageId(null);
      } else {
        onSetActiveImageId(null);
        onSelectSticker?.(null);
      }
    },
    [onSetActiveImageId, onSelectSticker],
  );

  // ── File picker ─────────────────────────────────────────────────────────────
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const img = await loadImageFromBlob(file);
    onAddImage(img, file.name);
    onPushHistory();
    // reset so the same file can be picked again
    e.target.value = "";
  }

  // ── Drop handler ─────────────────────────────────────────────────────────────
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const img = await loadImageFromBlob(file);
    onAddImage(img, file.name);
    onPushHistory();
  }

  const needsActiveImage =
    (activeTool === "brush" ||
      activeTool === "eraser" ||
      activeTool === "crop") &&
    !activeItem;

  const cursorStyle =
    activeTool === "eraser" && activeItem
      ? "none"
      : activeTool === "brush" && activeItem
        ? "crosshair"
        : activeTool === "crop" && activeItem
          ? "crosshair"
          : undefined;

  return (
    <div className="section">
      <span className="section-label">Canvas</span>
      <div className="canvas-wrapper">
        <div
          className={`canvas-drop-zone${items.length > 0 ? " has-image" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            position: "relative",
            display: "inline-block",
            cursor: cursorStyle,
          }}
        >
          <div style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
            <div
              style={{
                position: "relative",
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
              }}
            >
              <Stage
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                ref={stageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleStageClick}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                onTap={handleStageClick}
              >
                {/* Layer 0: Background */}
                <Layer>
                  {bgColor ? (
                    <Rect
                      x={0}
                      y={0}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                      fill={bgColor}
                    />
                  ) : (
                    tiles.map((tile, i) => (
                      <Rect
                        key={i}
                        x={tile.x}
                        y={tile.y}
                        width={TILE_SIZE}
                        height={TILE_SIZE}
                        fill={tile.fill}
                      />
                    ))
                  )}
                </Layer>

                {/* Layer 1: Images + Transformer */}
                <Layer ref={itemsLayerRef}>
                  {items.map((item) => (
                    <KonvaImage
                      key={`${item.id}-${renderRevision}`}
                      ref={(node: Konva.Image | null) => {
                        if (node) {
                          itemNodeRefs.current.set(item.id, node);
                        } else {
                          itemNodeRefs.current.delete(item.id);
                        }
                      }}
                      image={item.canvas}
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      scaleX={item.scaleX}
                      scaleY={item.scaleY}
                      rotation={item.rotation}
                      stroke={item.id === activeImageId ? "#4A90E2" : undefined}
                      strokeWidth={item.id === activeImageId ? 2 : 0}
                      draggable={activeTool === "pointer"}
                      onClick={() => onSetActiveImageId(item.id)}
                      onTap={() => onSetActiveImageId(item.id)}
                      onDragEnd={(e) => {
                        onUpdateItem({
                          ...item,
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                        onPushHistory();
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        onUpdateItem({
                          ...item,
                          x: node.x(),
                          y: node.y(),
                          scaleX: node.scaleX(),
                          scaleY: node.scaleY(),
                          rotation: node.rotation(),
                        });
                        onPushHistory();
                      }}
                    />
                  ))}
                  <Transformer ref={transformerRef} />
                </Layer>

                {/* Layer 2: Drawing overlay (brush lines, cursor, crop) */}
                <Layer ref={overlayLayerRef}>
                  {(activeTool === "eraser" || activeTool === "brush") &&
                    eraserPos &&
                    activeItem && (
                      <Circle
                        x={eraserPos.x}
                        y={eraserPos.y}
                        radius={
                          activeTool === "eraser"
                            ? eraserSize
                            : brushStrokeWidth / 2
                        }
                        stroke="rgba(0,0,0,0.7)"
                        strokeWidth={1.5}
                        fill="transparent"
                        listening={false}
                      />
                    )}

                  {activeTool === "crop" && cropRect && (
                    <>
                      <Rect
                        x={0}
                        y={0}
                        width={CANVAS_SIZE}
                        height={cropRect.y}
                        fill="rgba(0,0,0,0.5)"
                        listening={false}
                      />
                      <Rect
                        x={0}
                        y={cropRect.y}
                        width={cropRect.x}
                        height={cropRect.size}
                        fill="rgba(0,0,0,0.5)"
                        listening={false}
                      />
                      <Rect
                        x={cropRect.x + cropRect.size}
                        y={cropRect.y}
                        width={CANVAS_SIZE - cropRect.x - cropRect.size}
                        height={cropRect.size}
                        fill="rgba(0,0,0,0.5)"
                        listening={false}
                      />
                      <Rect
                        x={0}
                        y={cropRect.y + cropRect.size}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE - cropRect.y - cropRect.size}
                        fill="rgba(0,0,0,0.5)"
                        listening={false}
                      />
                      <Rect
                        ref={cropRectNodeRef}
                        x={cropRect.x}
                        y={cropRect.y}
                        width={cropRect.size}
                        height={cropRect.size}
                        stroke="white"
                        strokeWidth={2}
                        dash={[6, 3]}
                        draggable
                        onDragEnd={(e) => {
                          const node = e.target;
                          const newX = Math.max(
                            0,
                            Math.min(node.x(), CANVAS_SIZE - cropRect.size),
                          );
                          const newY = Math.max(
                            0,
                            Math.min(node.y(), CANVAS_SIZE - cropRect.size),
                          );
                          node.x(newX);
                          node.y(newY);
                          setCropRect({ ...cropRect, x: newX, y: newY });
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const newSize = Math.max(
                            20,
                            Math.round(cropRect.size * scaleX),
                          );
                          const newX = Math.max(
                            0,
                            Math.min(
                              Math.round(node.x()),
                              CANVAS_SIZE - newSize,
                            ),
                          );
                          const newY = Math.max(
                            0,
                            Math.min(
                              Math.round(node.y()),
                              CANVAS_SIZE - newSize,
                            ),
                          );
                          node.scaleX(1);
                          node.scaleY(1);
                          node.width(newSize);
                          node.height(newSize);
                          node.x(newX);
                          node.y(newY);
                          setCropRect({ x: newX, y: newY, size: newSize });
                        }}
                      />
                      <Transformer
                        ref={cropTransformerRef}
                        keepRatio={true}
                        enabledAnchors={[
                          "top-left",
                          "top-right",
                          "bottom-left",
                          "bottom-right",
                        ]}
                        rotateEnabled={false}
                        boundBoxFunc={(oldBox, newBox) => {
                          if (newBox.width < 20 || newBox.height < 20)
                            return oldBox;
                          if (
                            newBox.x < 0 ||
                            newBox.y < 0 ||
                            newBox.x + newBox.width > CANVAS_SIZE ||
                            newBox.y + newBox.height > CANVAS_SIZE
                          )
                            return oldBox;
                          return newBox;
                        }}
                      />
                    </>
                  )}
                </Layer>

                {/* Layer 3: Stickers */}
                <Layer>
                  {stickers.map((sticker) => {
                    const img = stickerImages[sticker.src];
                    if (!img) return null;
                    return (
                      <>
                        <KonvaImage
                          key={sticker.id}
                          ref={(node: Konva.Image | null) => {
                            if (node)
                              stickerNodeRefs.current.set(sticker.id, node);
                            else stickerNodeRefs.current.delete(sticker.id);
                          }}
                          image={img}
                          x={sticker.x}
                          y={sticker.y}
                          width={sticker.width}
                          height={sticker.height}
                          scaleX={sticker.scaleX}
                          scaleY={sticker.scaleY}
                          rotation={sticker.rotation}
                          draggable
                          onClick={() => {
                            onSelectSticker?.(sticker.id);
                            onSetActiveImageId(null);
                          }}
                          onTap={() => {
                            onSelectSticker?.(sticker.id);
                            onSetActiveImageId(null);
                          }}
                          onDragEnd={(e) =>
                            onUpdateSticker?.({
                              ...sticker,
                              x: e.target.x(),
                              y: e.target.y(),
                            })
                          }
                          onTransformEnd={(e) => {
                            const node = e.target;
                            onUpdateSticker?.({
                              ...sticker,
                              x: node.x(),
                              y: node.y(),
                              scaleX: node.scaleX(),
                              scaleY: node.scaleY(),
                              rotation: node.rotation(),
                            });
                          }}
                        />
                        {sticker.text && (
                          <KonvaText
                            x={sticker.x + sticker.width * sticker.scaleX * 0.1}
                            y={
                              sticker.y + sticker.height * sticker.scaleY * 0.3
                            }
                            width={sticker.width * sticker.scaleX * 0.8}
                            text={sticker.text}
                            fontSize={Math.max(
                              10,
                              sticker.width * sticker.scaleX * 0.15,
                            )}
                            fill="#222"
                            align="center"
                            wrap="word"
                            listening={false}
                          />
                        )}
                      </>
                    );
                  })}
                  <Transformer ref={stickerTransformerRef} />
                </Layer>

                {/* Layer 4: Frame */}
                <Layer>
                  {frameImage &&
                    (() => {
                      const frameScale = 100 / frameThickness;
                      const frameW = CANVAS_SIZE * frameScale;
                      const frameH = CANVAS_SIZE * frameScale;
                      const frameX = -(frameW - CANVAS_SIZE) / 2;
                      const frameY = -(frameH - CANVAS_SIZE) / 2;
                      return (
                        <KonvaImage
                          image={frameImage}
                          x={frameX}
                          y={frameY}
                          width={frameW}
                          height={frameH}
                          listening={false}
                        />
                      );
                    })()}
                </Layer>
              </Stage>

              {/* "Select an image" hint when tool requires active image */}
              {needsActiveImage && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontSize: "0.85rem",
                    }}
                  >
                    Select an image to edit
                  </div>
                </div>
              )}

              {/* Delete button for active item */}
              {activeItem && activeTool === "pointer" && (
                <button
                  style={{
                    position: "absolute",
                    left: activeItem.x + activeItem.width * activeItem.scaleX,
                    top: activeItem.y,
                    transform: "translate(-50%, -50%)",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#ff4444",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    lineHeight: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                    padding: 0,
                  }}
                  onClick={() => {
                    onRemoveItem(activeItem.id);
                    onPushHistory();
                  }}
                  aria-label="Delete image"
                >
                  ×
                </button>
              )}

              {/* Delete button for selected sticker */}
              {selectedStickerId &&
                (() => {
                  const s = stickers.find((st) => st.id === selectedStickerId);
                  if (!s) return null;
                  return (
                    <button
                      style={{
                        position: "absolute",
                        left: s.x + s.width * s.scaleX,
                        top: s.y,
                        transform: "translate(-50%, -50%)",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#ff4444",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 20,
                        padding: 0,
                      }}
                      onClick={() => onDeleteSticker?.(selectedStickerId)}
                      aria-label="Delete sticker"
                    >
                      ×
                    </button>
                  );
                })()}

              {/* Drop hint when canvas is empty */}
              {items.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: "var(--text-3)",
                    fontSize: "0.8rem",
                    pointerEvents: "none",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity={0.4}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Paste, drop, or choose images</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="file-input-row">
          <label className="file-input-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Add image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
            />
          </label>
          {items.length > 0 && (
            <span className="file-name">
              {items.length} image{items.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {onBgColorChange && (
          <div className="bg-color-row">
            <span className="bg-color-label">Background</span>
            <input
              type="color"
              className="bg-color-input"
              value={bgColor ?? "#ffffff"}
              onChange={(e) => onBgColorChange(e.target.value)}
              title="Pick background color"
              aria-hidden="true"
            />
            {bgColor && (
              <button
                className="bg-color-clear"
                onClick={() => onBgColorChange(null)}
                title="Remove background color (transparent)"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
