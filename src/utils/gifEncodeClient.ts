import { encodeGif } from "./gifEncode";
import type { GifEncodeOptions, RgbaFrame } from "./gifEncode";
import { fitToSizeLimit } from "./fitToSizeLimit";
import type { FitInput, FitProgress, FitResult } from "./fitToSizeLimit";

type WorkerReply =
  | ({ id: number; type: "progress" } & FitProgress)
  | { id: number; type: "result"; result: unknown }
  | { id: number; type: "error"; message: string };

interface Pending {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  onProgress?: (p: FitProgress) => void;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function dropWorker(error: Error): void {
  worker?.terminate();
  worker = null;
  const calls = [...pending.values()];
  pending.clear();
  calls.forEach((call) => call.reject(error));
}

function getWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === "undefined") return null;
  try {
    const created = new Worker(
      new URL("../workers/gifEncode.worker.ts", import.meta.url),
      { type: "module" },
    );
    created.onmessage = (event: MessageEvent<WorkerReply>) => {
      const msg = event.data;
      const call = pending.get(msg.id);
      if (!call) return;
      if (msg.type === "progress") {
        call.onProgress?.({ step: msg.step, total: msg.total });
        return;
      }
      pending.delete(msg.id);
      if (msg.type === "result") call.resolve(msg.result);
      else call.reject(new Error(msg.message));
    };
    created.onerror = (event) => {
      dropWorker(new Error(event.message || "GIF worker failed"));
    };
    worker = created;
    return created;
  } catch {
    return null;
  }
}

function ownedFrame(frame: RgbaFrame): RgbaFrame {
  const { data } = frame;
  if (data.byteOffset === 0 && data.buffer.byteLength === data.byteLength) {
    return frame;
  }
  return { ...frame, data: new Uint8ClampedArray(data) };
}

function frameTransfers(frames: RgbaFrame[]): Transferable[] {
  return [...new Set(frames.map((f) => f.data.buffer as ArrayBuffer))];
}

function post<T>(
  w: Worker,
  message: Record<string, unknown>,
  transfer: Transferable[],
  onProgress?: (p: FitProgress) => void,
): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (result: unknown) => void,
      reject,
      onProgress,
    });
    try {
      w.postMessage({ id, ...message }, transfer);
    } catch (err) {
      pending.delete(id);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export function runFitToSizeLimit(
  input: FitInput,
  onProgress?: (p: FitProgress) => void,
): Promise<FitResult> {
  const w = getWorker();
  if (!w) {
    return Promise.resolve().then(() =>
      fitToSizeLimit(input, encodeGif, onProgress),
    );
  }
  const frames = input.frames.map(ownedFrame);
  return post<FitResult>(
    w,
    { mode: "fit", input: { ...input, frames } },
    frameTransfers(frames),
    onProgress,
  );
}

export function runEncodeGif(
  frames: RgbaFrame[],
  width: number,
  height: number,
  opts: GifEncodeOptions,
): Promise<Uint8Array> {
  const w = getWorker();
  if (!w) {
    return Promise.resolve().then(() => encodeGif(frames, width, height, opts));
  }
  const owned = frames.map(ownedFrame);
  return post<{ bytes: Uint8Array }>(
    w,
    { mode: "encode", frames: owned, width, height, opts },
    frameTransfers(owned),
  ).then((r) => r.bytes);
}
