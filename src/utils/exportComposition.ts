import type Konva from "konva";
import { encodeGif, type RgbaFrame } from "./gifEncode";
import {
  buildFilename,
  checkFileSizeWarning,
  downscaleCanvas,
  type ExportFormat,
} from "./exportUtils";
import type { PlatformPreset } from "./presets";
import type { AnimationControls, AnimationFrame } from "./canvasImageTypes";

export type ExportRoute = "gif-animated" | "gif-static" | "png" | "webp";

export const STATIC_EXPORT_NOTE = "Static export: animation not included";
export const UNSUPPORTED_FORMAT_MESSAGE =
  "Export failed: this format is not supported by your browser.";

const MAX_COLORS = 256;

export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportError";
  }
}

export function routeExport(
  format: ExportFormat,
  animated: boolean,
): ExportRoute {
  if (format === "gif") return animated ? "gif-animated" : "gif-static";
  return format;
}

export interface StageRenderOptions {
  hideBackground: boolean;
}

/** Runs `render` with every `.ui` node (and the background layer when requested) hidden. */
export function withExportVisibility<T>(
  stage: Konva.Stage,
  { hideBackground }: StageRenderOptions,
  render: () => T,
): T {
  const hidden: Konva.Node[] = [...stage.find(".ui")];
  const bgLayer = stage.getLayers()[0];
  if (hideBackground && bgLayer) hidden.push(bgLayer);
  const previous = hidden.map((node) => node.visible());
  hidden.forEach((node) => node.visible(false));
  try {
    return render();
  } finally {
    hidden.forEach((node, i) => node.visible(previous[i]!));
  }
}

export function renderStageFrame(
  stage: Konva.Stage,
  preset: PlatformPreset,
  opts: StageRenderOptions,
): HTMLCanvasElement {
  const full = withExportVisibility(stage, opts, () =>
    stage.toCanvas({ pixelRatio: 1 }),
  );
  return downscaleCanvas(full, preset.width, preset.height);
}

function canvasRgba(canvas: HTMLCanvasElement): Uint8ClampedArray {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ExportError("Export failed: canvas not ready.");
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

export interface AnimationSource {
  frames: readonly AnimationFrame[];
  loopCount: number;
  controls: AnimationControls;
}

export interface RenderedAnimation {
  frames: RgbaFrame[];
  width: number;
  height: number;
  transparent: boolean;
  loopCount: number;
}

/** Shows each source frame on the stage synchronously, renders it, then restores the playing frame. */
export function renderAnimationFrames(
  stage: Konva.Stage,
  preset: PlatformPreset,
  bgColor: string | null,
  animation: AnimationSource,
): RenderedAnimation {
  const opts = { hideBackground: bgColor === null };
  const { controls } = animation;
  const frames = withExportVisibility(stage, opts, () => {
    try {
      return animation.frames.map((frame, i) => {
        controls.showFrame(i);
        const canvas = renderStageFrame(stage, preset, opts);
        return { data: canvasRgba(canvas), delayMs: frame.delayMs };
      });
    } finally {
      controls.showFrame(controls.currentFrame());
    }
  });
  return {
    frames,
    width: preset.width,
    height: preset.height,
    transparent: bgColor === null,
    loopCount: animation.loopCount,
  };
}

export type AnimatedEncoder = (
  rendered: RenderedAnimation,
) => Promise<Uint8Array> | Uint8Array;

const encodeFullQuality: AnimatedEncoder = (rendered) =>
  encodeGif(rendered.frames, rendered.width, rendered.height, {
    maxColors: MAX_COLORS,
    transparent: rendered.transparent,
    loopCount: rendered.loopCount,
  });

function gifBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes], { type: "image/gif" });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header = "", base64 = ""] = dataUrl.split(",");
  const mime = header.slice("data:".length).split(";")[0] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new ExportError(UNSUPPORTED_FORMAT_MESSAGE));
    }, "image/png");
  });
}

export interface ExportRequest {
  stage: Konva.Stage;
  preset: PlatformPreset;
  format: ExportFormat;
  bgColor: string | null;
  animation?: AnimationSource | null;
  encodeAnimated?: AnimatedEncoder;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  warning: string | null;
  note?: string;
}

export async function exportComposition({
  stage,
  preset,
  format,
  bgColor,
  animation = null,
  encodeAnimated = encodeFullQuality,
}: ExportRequest): Promise<ExportResult> {
  const route = routeExport(format, animation !== null);
  const opts = { hideBackground: bgColor === null };
  let blob: Blob;

  if (route === "gif-animated" && animation) {
    const rendered = renderAnimationFrames(stage, preset, bgColor, animation);
    blob = gifBlob(await encodeAnimated(rendered));
  } else {
    const canvas = renderStageFrame(stage, preset, opts);
    if (route === "gif-static") {
      const bytes = encodeGif(
        [{ data: canvasRgba(canvas), delayMs: 0 }],
        canvas.width,
        canvas.height,
        { maxColors: MAX_COLORS, transparent: bgColor === null, loopCount: 0 },
      );
      blob = gifBlob(bytes);
    } else if (route === "webp") {
      const dataUrl = canvas.toDataURL("image/webp");
      if (!dataUrl.startsWith("data:image/webp")) {
        throw new ExportError(UNSUPPORTED_FORMAT_MESSAGE);
      }
      blob = dataUrlToBlob(dataUrl);
    } else {
      blob = await canvasToPngBlob(canvas);
    }
  }

  return {
    blob,
    filename: buildFilename(format),
    warning: checkFileSizeWarning(blob.size, preset),
    ...(animation && format !== "gif" ? { note: STATIC_EXPORT_NOTE } : {}),
  };
}
