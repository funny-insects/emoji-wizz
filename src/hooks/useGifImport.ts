import { useCallback, useState } from "react";
import {
  GIF_MAX_BYTES,
  GifImportError,
  decodeGifToCanvases,
  gifTooLargeMessage,
} from "../utils/gifDecode";
import type { AnimationFrame } from "../utils/canvasImageTypes";

const MAX_IMAGE_SIZE = 256;
export const ONE_ANIMATED_GIF_MESSAGE =
  "Only one animated GIF per composition is supported.";
const UNREADABLE_GIF_MESSAGE = "This file is not a readable GIF.";

/** "static": a one-frame GIF the caller must import as a still image. */
export type GifImportOutcome = "animated" | "static" | "error";

interface UseGifImportOptions {
  onAddAnimatedImage: (
    frames: AnimationFrame[],
    label: string,
    loopCount: number,
  ) => string | null;
  onPushHistory: () => void;
}

export function firstClipboardImage(
  clipItems: DataTransferItemList | undefined,
): File | null {
  if (!clipItems) return null;
  for (const item of clipItems) {
    if (!item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) return file;
  }
  return null;
}

export function useGifImport({
  onAddAnimatedImage,
  onPushHistory,
}: UseGifImportOptions) {
  const [importError, setImportError] = useState<string | null>(null);

  const clearImportError = useCallback(() => setImportError(null), []);

  const importGif = useCallback(
    async (file: Blob, label: string): Promise<GifImportOutcome> => {
      try {
        if (file.size > GIF_MAX_BYTES) {
          throw new GifImportError(gifTooLargeMessage(file.size));
        }
        const { frames, loopCount } = decodeGifToCanvases(
          await file.arrayBuffer(),
          MAX_IMAGE_SIZE,
        );
        if (frames.length <= 1) {
          setImportError(null);
          return "static";
        }
        if (onAddAnimatedImage(frames, label, loopCount) === null) {
          setImportError(ONE_ANIMATED_GIF_MESSAGE);
          return "error";
        }
        onPushHistory();
        setImportError(null);
        return "animated";
      } catch (err) {
        setImportError(
          err instanceof GifImportError ? err.message : UNREADABLE_GIF_MESSAGE,
        );
        return "error";
      }
    },
    [onAddAnimatedImage, onPushHistory],
  );

  return { importGif, importError, clearImportError };
}
