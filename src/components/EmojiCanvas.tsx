import { useEffect, useRef } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import { type PlatformPreset } from "../utils/presets";
import { computeContainRect } from "../utils/imageScaling";

interface EmojiCanvasProps {
  preset: PlatformPreset;
  image: HTMLImageElement | null;
  handleFileInput: React.ChangeEventHandler<HTMLInputElement>;
  handleDrop: React.DragEventHandler<HTMLDivElement>;
  handlePaste: (e: ClipboardEvent) => void;
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
  stageRef,
  fileName,
}: EmojiCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const { width, height, safeZonePadding } = preset;
  const tiles = buildCheckerboard(width, height);
  const imageRect = image
    ? computeContainRect(image.naturalWidth, image.naturalHeight, width, height)
    : null;

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
        >
          <Stage width={width} height={height} ref={stageRef}>
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
              {image && imageRect && (
                <KonvaImage
                  image={image}
                  x={imageRect.x}
                  y={imageRect.y}
                  width={imageRect.width}
                  height={imageRect.height}
                />
              )}
            </Layer>
            <Layer />
          </Stage>
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
