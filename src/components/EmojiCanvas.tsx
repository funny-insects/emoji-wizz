import { useEffect, useRef } from "react";
import { type PlatformPreset } from "../utils/presets";
import { drawCheckerboard, drawSafeZone } from "../utils/canvasDrawing";
import { computeContainRect } from "../utils/imageScaling";

interface EmojiCanvasProps {
  preset: PlatformPreset;
  image: HTMLImageElement | null;
  handleFileInput: React.ChangeEventHandler<HTMLInputElement>;
  handleDrop: React.DragEventHandler<HTMLDivElement>;
  handlePaste: (e: ClipboardEvent) => void;
}

export function EmojiCanvas({
  preset,
  image,
  handleFileInput,
  handleDrop,
  handlePaste,
}: EmojiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, preset.width, preset.height);
    drawCheckerboard(ctx, preset.width, preset.height);
    drawSafeZone(ctx, preset.width, preset.height, preset.safeZonePadding);

    if (image) {
      const rect = computeContainRect(
        image.naturalWidth,
        image.naturalHeight,
        preset.width,
        preset.height,
      );
      ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    }
  }, [preset, image]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <canvas ref={canvasRef} width={preset.width} height={preset.height} />
      <input type="file" accept="image/*" onChange={handleFileInput} />
    </div>
  );
}
