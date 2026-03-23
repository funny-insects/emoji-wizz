import { useEffect, useRef } from "react";
import { type PlatformPreset } from "../utils/presets";
import { drawCheckerboard, drawSafeZone } from "../utils/canvasDrawing";

interface EmojiCanvasProps {
  preset: PlatformPreset;
}

export function EmojiCanvas({ preset }: EmojiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, preset.width, preset.height);
    drawCheckerboard(ctx, preset.width, preset.height);
    drawSafeZone(ctx, preset.width, preset.height, preset.safeZonePadding);
  }, [preset]);

  return (
    <div>
      <canvas ref={canvasRef} width={preset.width} height={preset.height} />
    </div>
  );
}
