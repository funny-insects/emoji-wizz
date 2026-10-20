import { encodeGif } from "../utils/gifEncode";
import type { GifEncodeOptions, RgbaFrame } from "../utils/gifEncode";
import { fitToSizeLimit } from "../utils/fitToSizeLimit";
import type { FitInput } from "../utils/fitToSizeLimit";

export type GifWorkerRequest =
  | { id: number; mode: "fit"; input: FitInput }
  | {
      id: number;
      mode: "encode";
      frames: RgbaFrame[];
      width: number;
      height: number;
      opts: GifEncodeOptions;
    };

interface WorkerScope {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<GifWorkerRequest>) => void) | null;
}

const scope = self as unknown as WorkerScope;

function ownBuffer(bytes: Uint8Array): Uint8Array {
  if (bytes.byteOffset === 0 && bytes.buffer.byteLength === bytes.byteLength) {
    return bytes;
  }
  return bytes.slice();
}

scope.onmessage = (event) => {
  const msg = event.data;
  try {
    if (msg.mode === "fit") {
      const result = fitToSizeLimit(msg.input, encodeGif, (progress) =>
        scope.postMessage({ id: msg.id, type: "progress", ...progress }),
      );
      result.bytes = ownBuffer(result.bytes);
      scope.postMessage({ id: msg.id, type: "result", result }, [
        result.bytes.buffer,
      ]);
    } else {
      const bytes = ownBuffer(
        encodeGif(msg.frames, msg.width, msg.height, msg.opts),
      );
      scope.postMessage({ id: msg.id, type: "result", result: { bytes } }, [
        bytes.buffer,
      ]);
    }
  } catch (err) {
    scope.postMessage({
      id: msg.id,
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
