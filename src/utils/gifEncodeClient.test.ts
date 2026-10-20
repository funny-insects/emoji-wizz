import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeGif } from "./gifEncode";
import type { GifEncodeOptions, RgbaFrame } from "./gifEncode";
import { fitToSizeLimit } from "./fitToSizeLimit";
import type { FitInput } from "./fitToSizeLimit";

const W = 8;
const H = 8;
const OPTS: GifEncodeOptions = {
  maxColors: 64,
  transparent: false,
  loopCount: 0,
};

function makeFrames(count: number): RgbaFrame[] {
  return Array.from({ length: count }, (_, f) => {
    const data = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      data[i * 4] = (i * 7 + f * 40) % 256;
      data[i * 4 + 1] = (i * 3) % 256;
      data[i * 4 + 2] = f * 50;
      data[i * 4 + 3] = 255;
    }
    return { data, delayMs: 100 };
  });
}

function makeInput(): FitInput {
  return {
    frames: makeFrames(4),
    width: W,
    height: H,
    transparent: false,
    loopCount: 0,
    limitBytes: 1_000_000,
  };
}

type Client = typeof import("./gifEncodeClient");

async function loadClient(): Promise<Client> {
  vi.resetModules();
  return import("./gifEncodeClient");
}

describe("gifEncodeClient in-thread fallback", () => {
  let runEncodeGif: Client["runEncodeGif"];
  let runFitToSizeLimit: Client["runFitToSizeLimit"];

  beforeEach(async () => {
    ({ runEncodeGif, runFitToSizeLimit } = await loadClient());
  });

  it("runEncodeGif matches encodeGif", async () => {
    const frames = makeFrames(3);
    const expected = encodeGif(frames, W, H, OPTS);
    const bytes = await runEncodeGif(frames, W, H, OPTS);
    expect(Array.from(bytes)).toEqual(Array.from(expected));
  });

  it("runFitToSizeLimit matches fitToSizeLimit and reports progress", async () => {
    const expectedProgress: unknown[] = [];
    const expected = fitToSizeLimit(makeInput(), encodeGif, (p) =>
      expectedProgress.push(p),
    );
    const progress: unknown[] = [];
    const result = await runFitToSizeLimit(makeInput(), (p) =>
      progress.push(p),
    );
    expect(Array.from(result.bytes)).toEqual(Array.from(expected.bytes));
    expect(result.settings).toEqual(expected.settings);
    expect(result.fits).toBe(expected.fits);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress).toEqual(expectedProgress);
  });
});

interface Posted {
  message: { id: number; mode: string };
  transfer: Transferable[];
}

describe("gifEncodeClient with a Worker", () => {
  let instances: FakeWorker[];
  let posted: Posted[];

  class FakeWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    terminated = false;
    constructor() {
      instances.push(this);
    }
    postMessage(message: Posted["message"], transfer: Transferable[]) {
      posted.push({ message, transfer });
      const reply = (data: unknown) =>
        queueMicrotask(() => this.onmessage?.({ data } as MessageEvent));
      if (message.mode === "fit") {
        reply({ id: message.id, type: "progress", step: 1, total: 2 });
        reply({ id: message.id, type: "result", result: { tag: "fit" } });
      } else {
        reply({
          id: message.id,
          type: "result",
          result: { bytes: new Uint8Array([message.id]) },
        });
      }
    }
    terminate() {
      this.terminated = true;
    }
  }

  let runEncodeGif: Client["runEncodeGif"];
  let runFitToSizeLimit: Client["runFitToSizeLimit"];

  beforeEach(async () => {
    instances = [];
    posted = [];
    vi.stubGlobal("Worker", FakeWorker);
    ({ runEncodeGif, runFitToSizeLimit } = await loadClient());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("correlates ids, forwards progress and transfers frame buffers", async () => {
    const input = makeInput();
    const buffers = input.frames.map((f) => f.data.buffer);
    const progress: unknown[] = [];

    const [a, b] = await Promise.all([
      runFitToSizeLimit(input, (p) => progress.push(p)),
      runEncodeGif(makeFrames(1), W, H, OPTS),
    ]);

    expect((a as unknown as { tag: string }).tag).toBe("fit");
    expect(b[0]).toBe(posted[1]?.message.id);
    expect(posted[0]?.message.id).not.toBe(posted[1]?.message.id);
    expect(progress).toEqual([{ step: 1, total: 2 }]);
    expect(posted[0]?.transfer).toEqual(buffers);
    expect(instances).toHaveLength(1);
  });

  it("copies frames that do not own their whole buffer", async () => {
    const backing = new ArrayBuffer(W * H * 4 * 2);
    const view = new Uint8ClampedArray(backing, W * H * 4, W * H * 4);
    await runEncodeGif([{ data: view, delayMs: 50 }], W, H, OPTS);
    const sent = posted[posted.length - 1];
    expect(sent?.transfer).toHaveLength(1);
    expect(sent?.transfer[0]).not.toBe(backing);
  });

  it("rejects pending calls on worker error and recreates the worker", async () => {
    class SilentWorker extends FakeWorker {
      override postMessage() {}
    }
    vi.stubGlobal("Worker", SilentWorker);
    const first = runEncodeGif(makeFrames(1), W, H, OPTS).catch((e) => e);
    const silent = instances[instances.length - 1];
    silent?.onerror?.({ message: "boom" } as ErrorEvent);
    expect(await first).toEqual(new Error("boom"));
    expect(silent?.terminated).toBe(true);

    vi.stubGlobal("Worker", FakeWorker);
    const count = instances.length;
    await runEncodeGif(makeFrames(1), W, H, OPTS);
    expect(instances.length).toBe(count + 1);
  });
});
