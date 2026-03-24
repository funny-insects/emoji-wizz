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
  brushColor?: string;
  brushSize?: number;
  textColor?: string;
  textSize?: number;
  stageRef?: React.RefObject<Konva.Stage | null>;
  fileName?: string;
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
  brushColor = "#000000",
  brushSize,
  textColor = "#000000",
  textSize = 18,
  stageRef,
  fileName,
}: EmojiCanvasProps) {
  const { width, height, safeZonePadding } = preset;
  const tiles = buildCheckerboard(width, height);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (activeTool !== "text") return;
      if (textInputPos) return;
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      setTextInputPos({ x: pos.x, y: pos.y });
    },
    [activeTool, textInputPos],
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

  const containerStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    ...(image && activeTool === "eraser"
      ? { cursor: "none" }
      : image && activeTool === "brush"
        ? { cursor: "crosshair" }
        : image && activeTool === "text"
          ? { cursor: "text" }
          : {}),
  };

  return (
    <div className="section">
      <span className="section-label">
        Canvas — {width}×{height}px
      </span>
      <div className="canvas-wrapper">
        <div
          className={`canvas-drop-zone${image ? " has-image" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !image && fileInputRef.current?.click()}
          title={image ? undefined : "Click or drop an image"}
          style={containerStyle}
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
              <Rect
                x={safeZonePadding}
                y={safeZonePadding}
                width={width - 2 * safeZonePadding}
                height={height - 2 * safeZonePadding}
                stroke="rgba(254, 129, 212, 0.6)"
                strokeWidth={1}
                dash={[4, 4]}
                fill="transparent"
              />
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
          </Stage>
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
