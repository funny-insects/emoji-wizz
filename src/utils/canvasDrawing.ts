export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const tileSize = 8;
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const isLight =
        (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
      ctx.fillStyle = isLight ? "#FFFFFF" : "#CCCCCC";
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
}

export function drawSafeZone(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(0, 120, 255, 0.5)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);
  ctx.restore();
}
