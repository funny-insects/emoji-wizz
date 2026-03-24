export interface StickerDescriptor {
  id: string;
  src: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  requiresText?: boolean;
  text?: string;
}
