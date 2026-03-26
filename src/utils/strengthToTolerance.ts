export function strengthToTolerance(strength: number): number {
  return Math.round((strength / 100) * 128);
}
