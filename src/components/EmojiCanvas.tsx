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
import { computeContainRect } from "../utils/imageScaling";
import { removeBackground } from "../utils/removeBackground";
import {
  rotateCanvas90,
  flipCanvas,
  reframeCanvas,
  cropCanvas,
} from "../utils/imageTransforms";
import type { EditorTool } from "../App";
import type { StickerDescriptor } from "../utils/stickerTypes";

interface EmojiCanvasProps {
  image: HTMLImageElement | null;
  handleFileInput: React.ChangeEventHandler<HTMLInputElement>;
  handleDrop: React.DragEventHandler<HTMLDivElement>;
  handlePaste: (e: ClipboardEvent) => void;
  activeTool?: EditorTool;
  onToolChange?: (tool: EditorTool) => void;
  onPushState?: (snapshot: string) => void;
  restoreSnapshot?: string | null;
  onSnapshotRestored?: () => void;
  brushColor?: string;
  brushSize?: number;
  textColor?: string;
  textSize?: number;
  stageRef?: React.RefObject<Konva.Stage | null>;
  fileName?: string;
  stickers?: StickerDescriptor[];
  selectedStickerId?: string | null;
  onUpdateSticker?: (desc: StickerDescriptor) => void;
  onDeleteSticker?: (id: string) => void;
  onSelectSticker?: (id: string | null) => void;
  activeFrameSrc?: string | null;
  bgRemovalRequest?: { tolerance: number; seq: number } | null;
  transformRequest?: {
    type: "rotateCW" | "rotateCCW" | "flipH" | "flipV";
    seq: number;
  } | null;
  cropConfirmSeq?: number;
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
  image,
  handleFileInput,
  handleDrop,
  handlePaste,
  activeTool,
  onToolChange,
  onPushState,
  restoreSnapshot,
  onSnapshotRestored,
  brushColor = "#000000",
  brushSize,
  textColor = "#000000",
  textSize = 18,
  stageRef,
  fileName,
  stickers = [],
  selectedStickerId = null,
  onUpdateSticker,
  onDeleteSticker,
  onSelectSticker,
  activeFrameSrc = null,
  bgRemovalRequest = null,
  transformRequest = null,
  cropConfirmSeq = 0,
}: EmojiCanvasProps) {
  const width = 512;
  const height = 512;
  const tiles = buildCheckerboard(width, height);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const stickerNodeRefs = useRef<Map<string, Konva.Image>>(new Map());
  const [stickerImages, setStickerImages] = useState<
    Record<string, HTMLImageElement>
  >({});
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const displayScale = 1;

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isRestoringRef = useRef(false);
  const isErasingRef = useRef(false);
  const isBrushingRef = useRef(false);
  const currentBrushLineRef = useRef<Konva.Line | null>(null);
  const onSnapshotRestoredRef = useRef(onSnapshotRestored);
  const onPushStateRef = useRef(onPushState);
  const [textInputPos, setTextInputPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [cropRect, setCropRect] = useState<{
    x: number;
    y: number;
    size: number;
  } | null>(null);
  const cropRectRef = useRef<Konva.Rect | null>(null);
  const cropTransformerRef = useRef<Konva.Transformer | null>(null);
  const prevCropConfirmSeqRef = useRef(cropConfirmSeq);

  useEffect(() => {
    onSnapshotRestoredRef.current = onSnapshotRestored;
  });
  useEffect(() => {
    onPushStateRef.current = onPushState;
  });

  const [displayCanvas, setDisplayCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );

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
  const brushStrokeWidth = brushSize ?? Math.round((width / 128) * 3);
  const scaledFontSize = Math.max(4, textSize);

  const currentDimensions = `${width}x${height}`;
  if (image !== prevImage || currentDimensions !== prevDimensions) {
    setPrevImage(image);
    setPrevDimensions(currentDimensions);
    if (image && imageRect) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          image,
          imageRect.x,
          imageRect.y,
          imageRect.width,
          imageRect.height,
        );
      }
      setDisplayCanvas(canvas);
    } else {
      setDisplayCanvas(null);
    }
  }

  useEffect(() => {
    offscreenCanvasRef.current = displayCanvas;
    if (displayCanvas && !isRestoringRef.current) {
      onPushStateRef.current?.(displayCanvas.toDataURL("image/png"));
    }
    isRestoringRef.current = false;
  }, [displayCanvas]);

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
      isRestoringRef.current = true;
      setDisplayCanvas(canvas);
      onSnapshotRestoredRef.current?.();
    };
    img.src = restoreSnapshot;
  }, [restoreSnapshot]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (activeTool !== "brush" && currentBrushLineRef.current) {
      currentBrushLineRef.current.destroy();
      currentBrushLineRef.current = null;
      isBrushingRef.current = false;
      Konva.stages[0]?.getLayers()[2]?.batchDraw();
    }
  }, [activeTool]);

  const [prevActiveTool, setPrevActiveTool] = useState<EditorTool | undefined>(
    activeTool,
  );
  if (activeTool !== prevActiveTool) {
    setPrevActiveTool(activeTool);
    if (activeTool !== "text" && textInputPos !== null) {
      setTextInputPos(null);
    }
  }

  const applyEraserAt = useCallback(
    (stageX: number, stageY: number) => {
      if (!offscreenCanvasRef.current || !imageRect) return;
      const ctx = offscreenCanvasRef.current.getContext("2d");
      if (!ctx) return;
      const prevOp = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(stageX, stageY, eraserRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = prevOp;
    },
    [imageRect, eraserRadius],
  );

  const flattenCurrentLine = useCallback((): boolean => {
    const line = currentBrushLineRef.current;
    if (!line || !offscreenCanvasRef.current || !imageRect) return false;
    const ctx = offscreenCanvasRef.current.getContext("2d");
    if (!ctx) return false;
    const pts = line.points();
    ctx.save();
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
    const stage = Konva.stages[0];
    stage?.getLayers()[2]?.batchDraw();
    stage?.getLayers()[1]?.batchDraw();
    return true;
  }, [imageRect]);

  const finalizeText = useCallback(
    (text: string, pos: { x: number; y: number } | null) => {
      setTextInputPos(null);
      if (!text.trim() || !pos || !offscreenCanvasRef.current || !imageRect)
        return;

      const stage = Konva.stages[0];
      const overlaysLayer = stage?.getLayers()[2];

      const textNode = new Konva.Text({
        x: pos.x,
        y: pos.y,
        text,
        fill: textColor,
        fontSize: scaledFontSize,
        fontFamily: "sans-serif",
      });
      overlaysLayer?.add(textNode);

      const ctx = offscreenCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.font = `${textNode.fontSize()}px ${textNode.fontFamily()}`;
        ctx.fillStyle = textNode.fill();
        ctx.fillText(textNode.text(), textNode.x(), textNode.y());
        ctx.restore();
      }

      textNode.destroy();
      stage?.getLayers()[1]?.batchDraw();
      overlaysLayer?.batchDraw();

      onPushStateRef.current?.(
        offscreenCanvasRef.current.toDataURL("image/png"),
      );
    },
    [textColor, scaledFontSize, imageRect],
  );

  const handleTextKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      pos: { x: number; y: number } | null,
    ) => {
      if (e.key === "Enter") {
        finalizeText(e.currentTarget.value, pos);
      } else if (e.key === "Escape") {
        setTextInputPos(null);
      }
    },
    [finalizeText],
  );

  const handleTextBlur = useCallback(
    (
      e: React.FocusEvent<HTMLInputElement>,
      pos: { x: number; y: number } | null,
    ) => {
      finalizeText(e.currentTarget.value, pos);
    },
    [finalizeText],
  );

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const target = e.target;
      const isStickerNode = [...stickerNodeRefs.current.values()].some(
        (node) => node === target,
      );
      const isTransformerPart =
        target instanceof Konva.Transformer ||
        target.getParent() instanceof Konva.Transformer;
      if (!isStickerNode && !isTransformerPart) {
        onSelectSticker?.(null);
      }
      if (activeTool !== "text") return;
      if (textInputPos) return;
      const stage = target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      setTextInputPos({ x: pos.x, y: pos.y });
    },
    [activeTool, textInputPos, onSelectSticker],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!offscreenCanvasRef.current) return;
      const stage = e.target.getStage();

      if (activeTool === "eraser") {
        isErasingRef.current = true;
        const pos = stage?.getPointerPosition();
        if (!pos) return;
        applyEraserAt(pos.x, pos.y);
        stage?.getLayers()[1]?.batchDraw();
      } else if (activeTool === "brush") {
        isBrushingRef.current = true;
        const pos = stage?.getPointerPosition();
        if (!pos) return;
        const overlaysLayer = stage?.getLayers()[2];
        const line = new Konva.Line({
          stroke: brushColor,
          strokeWidth: brushStrokeWidth,
          lineCap: "round",
          lineJoin: "round",
          points: [pos.x, pos.y, pos.x, pos.y],
        });
        overlaysLayer?.add(line);
        currentBrushLineRef.current = line;
        overlaysLayer?.batchDraw();
      }
    },
    [activeTool, applyEraserAt, brushColor, brushStrokeWidth],
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
      } else if (
        activeTool === "brush" &&
        isBrushingRef.current &&
        currentBrushLineRef.current
      ) {
        const points = currentBrushLineRef.current.points();
        currentBrushLineRef.current.points([...points, pos.x, pos.y]);
        stage?.getLayers()[2]?.batchDraw();
      }
    },
    [activeTool, applyEraserAt],
  );

  const handleMouseUp = useCallback(() => {
    if (isErasingRef.current && activeTool === "eraser") {
      isErasingRef.current = false;
      if (offscreenCanvasRef.current) {
        onPushStateRef.current?.(
          offscreenCanvasRef.current.toDataURL("image/png"),
        );
      }
    } else if (isBrushingRef.current && activeTool === "brush") {
      isBrushingRef.current = false;
      flattenCurrentLine();
      if (offscreenCanvasRef.current) {
        onPushStateRef.current?.(
          offscreenCanvasRef.current.toDataURL("image/png"),
        );
      }
    }
  }, [activeTool, flattenCurrentLine]);

  const handleMouseLeave = useCallback(() => {
    setEraserPos(null);
    if (isErasingRef.current && activeTool === "eraser") {
      isErasingRef.current = false;
      if (offscreenCanvasRef.current) {
        onPushStateRef.current?.(
          offscreenCanvasRef.current.toDataURL("image/png"),
        );
      }
    } else if (isBrushingRef.current && activeTool === "brush") {
      isBrushingRef.current = false;
      flattenCurrentLine();
      if (offscreenCanvasRef.current) {
        onPushStateRef.current?.(
          offscreenCanvasRef.current.toDataURL("image/png"),
        );
      }
    }
  }, [activeTool, flattenCurrentLine]);

  // Load frame image when activeFrameSrc changes
  useEffect(() => {
    if (!activeFrameSrc) {
      return;
    }
    const img = new window.Image();
    img.onload = () => setFrameImage(img);
    img.src = activeFrameSrc;
    return () => {
      setFrameImage(null);
    };
  }, [activeFrameSrc]);

  // Load images for stickers that haven't been loaded yet
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

  // Apply background removal when a new request arrives
  useEffect(() => {
    if (!bgRemovalRequest || !offscreenCanvasRef.current) return;
    const src = offscreenCanvasRef.current;
    const ctx = src.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, src.width, src.height);
    const result = removeBackground(imageData, bgRemovalRequest.tolerance);
    const newCanvas = document.createElement("canvas");
    newCanvas.width = src.width;
    newCanvas.height = src.height;
    const newCtx = newCanvas.getContext("2d");
    if (!newCtx) return;
    newCtx.putImageData(result, 0, 0);
    const id = setTimeout(() => setDisplayCanvas(newCanvas), 0);
    return () => clearTimeout(id);
  }, [bgRemovalRequest]);

  // Apply image transform (rotate/flip) when a new request arrives
  useEffect(() => {
    if (!transformRequest || !offscreenCanvasRef.current) return;
    const src = offscreenCanvasRef.current;
    let result: HTMLCanvasElement;
    switch (transformRequest.type) {
      case "rotateCW":
        result = rotateCanvas90(src, "cw");
        break;
      case "rotateCCW":
        result = rotateCanvas90(src, "ccw");
        break;
      case "flipH":
        result = flipCanvas(src, "horizontal");
        break;
      case "flipV":
        result = flipCanvas(src, "vertical");
        break;
    }
    const reframed = reframeCanvas(result, width, height);
    const id = setTimeout(() => setDisplayCanvas(reframed), 0);
    return () => clearTimeout(id);
  }, [transformRequest, width, height]);

  // Initialize / clear crop overlay when crop tool is toggled (sync during render)
  const [prevCropTool, setPrevCropTool] = useState<EditorTool | undefined>(
    activeTool,
  );
  if (activeTool !== prevCropTool) {
    setPrevCropTool(activeTool);
    if (activeTool === "crop") {
      const defaultSize = Math.round(width * 0.5);
      const offset = Math.round((width - defaultSize) / 2);
      setCropRect({ x: offset, y: offset, size: defaultSize });
    } else if (cropRect) {
      setCropRect(null);
    }
  }

  // Wire crop transformer to crop rect node
  useEffect(() => {
    const tr = cropTransformerRef.current;
    const node = cropRectRef.current;
    if (!tr) return;
    if (activeTool === "crop" && node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [activeTool, cropRect]);

  // Handle crop confirm
  useEffect(() => {
    if (cropConfirmSeq === prevCropConfirmSeqRef.current) return;
    prevCropConfirmSeqRef.current = cropConfirmSeq;
    if (!cropRect || !offscreenCanvasRef.current) return;
    const cropped = cropCanvas(offscreenCanvasRef.current, cropRect);
    const reframed = reframeCanvas(cropped, width, height);
    const id = setTimeout(() => {
      setDisplayCanvas(reframed);
      setCropRect(null);
      onToolChange?.("pointer");
    }, 0);
    return () => clearTimeout(id);
  }, [cropConfirmSeq, cropRect, width, height, onToolChange]);

  // Wire Transformer to selected sticker node
  useEffect(() => {
    const tr = transformerRef.current;
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

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    ...(image && activeTool === "eraser"
      ? { cursor: "none" }
      : image && activeTool === "brush"
        ? { cursor: "crosshair" }
        : image && activeTool === "text"
          ? { cursor: "text" }
          : image && activeTool === "crop"
            ? { cursor: "crosshair" }
            : {}),
  };

  return (
    <div className="section">
      <span className="section-label">Canvas</span>
      <div className="canvas-wrapper">
        <div
          className={`canvas-drop-zone${image ? " has-image" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !image && fileInputRef.current?.click()}
          title={image ? undefined : "Click or drop an image"}
          style={containerStyle}
        >
          <div
            style={{
              width: width * displayScale,
              height: height * displayScale,
            }}
          >
            <div
              style={{
                transform: `scale(${displayScale})`,
                transformOrigin: "top left",
                position: "relative",
                width,
                height,
              }}
            >
              <Stage
                width={width}
                height={height}
                ref={stageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
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
                </Layer>
                <Layer>
                  {image && imageRect && displayCanvas && (
                    <KonvaImage
                      image={displayCanvas}
                      x={0}
                      y={0}
                      width={width}
                      height={height}
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
                <Layer>
                  {activeTool === "crop" && cropRect && (
                    <>
                      {/* Dark mask: 4 rects surrounding the crop area */}
                      <Rect
                        x={0}
                        y={0}
                        width={width}
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
                        width={width - cropRect.x - cropRect.size}
                        height={cropRect.size}
                        fill="rgba(0,0,0,0.5)"
                        listening={false}
                      />
                      <Rect
                        x={0}
                        y={cropRect.y + cropRect.size}
                        width={width}
                        height={height - cropRect.y - cropRect.size}
                        fill="rgba(0,0,0,0.5)"
                        listening={false}
                      />
                      {/* Crop selection rect — draggable */}
                      <Rect
                        ref={cropRectRef}
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
                            Math.min(node.x(), width - cropRect.size),
                          );
                          const newY = Math.max(
                            0,
                            Math.min(node.y(), height - cropRect.size),
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
                            Math.min(Math.round(node.x()), width - newSize),
                          );
                          const newY = Math.max(
                            0,
                            Math.min(Math.round(node.y()), height - newSize),
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
                          const minSize = 20;
                          if (
                            newBox.width < minSize ||
                            newBox.height < minSize
                          ) {
                            return oldBox;
                          }
                          if (
                            newBox.x < 0 ||
                            newBox.y < 0 ||
                            newBox.x + newBox.width > width ||
                            newBox.y + newBox.height > height
                          ) {
                            return oldBox;
                          }
                          return newBox;
                        }}
                      />
                    </>
                  )}
                </Layer>
                <Layer>
                  {stickers.map((sticker) => {
                    const img = stickerImages[sticker.src];
                    if (!img) return null;
                    return (
                      <>
                        <KonvaImage
                          key={sticker.id}
                          ref={(node: Konva.Image | null) => {
                            if (node) {
                              stickerNodeRefs.current.set(sticker.id, node);
                            } else {
                              stickerNodeRefs.current.delete(sticker.id);
                            }
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
                          onClick={() => onSelectSticker?.(sticker.id)}
                          onDragEnd={(e) => {
                            onUpdateSticker?.({
                              ...sticker,
                              x: e.target.x(),
                              y: e.target.y(),
                            });
                          }}
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
                  <Transformer ref={transformerRef} />
                </Layer>
                <Layer>
                  {frameImage && (
                    <KonvaImage
                      image={frameImage}
                      x={0}
                      y={0}
                      width={width}
                      height={height}
                      listening={false}
                    />
                  )}
                </Layer>
              </Stage>
              {selectedSticker && selectedStickerId && (
                <button
                  style={{
                    position: "absolute",
                    left:
                      selectedSticker.x +
                      selectedSticker.width * selectedSticker.scaleX,
                    top: selectedSticker.y,
                    transform: "translate(-50%, -50%)",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#ff4444",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    lineHeight: 1,
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
              )}
              {textInputPos && activeTool === "text" && (
                <input
                  key={`text-${textInputPos.x}-${textInputPos.y}`}
                  style={{
                    position: "absolute",
                    left: textInputPos.x,
                    top: textInputPos.y,
                    fontSize: `${scaledFontSize}px`,
                    color: textColor,
                    background: "transparent",
                    border: "none",
                    outline: "1px dashed rgba(0,0,0,0.5)",
                    padding: 0,
                    margin: 0,
                    fontFamily: "sans-serif",
                    zIndex: 10,
                    minWidth: "50px",
                  }}
                  autoFocus
                  onKeyDown={(e) => handleTextKeyDown(e, textInputPos)}
                  onBlur={(e) => handleTextBlur(e, textInputPos)}
                />
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
            {fileName ? "Change image" : "Choose image"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
            />
          </label>
          {fileName && (
            <span className="file-name" title={fileName}>
              {fileName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
