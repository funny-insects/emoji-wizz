import { useEffect } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import { type PlatformPreset } from "../utils/presets";
import { computeContainRect } from "../utils/imageScaling";

interface EmojiCanvasProps {
  preset: PlatformPreset;
  image: HTMLImageElement | null;
  handleFileInput: React.ChangeEventHandler<HTMLInputElement>;
  handleDrop: React.DragEventHandler<HTMLDivElement>;
  handlePaste: (e: ClipboardEvent) => void;
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
}: EmojiCanvasProps) {
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
    <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <Stage width={width} height={height}>
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
      </Stage>
      <input type="file" accept="image/*" onChange={handleFileInput} />
    </div>
  );
}
