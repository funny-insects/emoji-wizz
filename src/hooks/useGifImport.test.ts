import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGifImport } from "./useGifImport";
import { GIF_MAX_BYTES } from "../utils/gifDecode";

describe("useGifImport", () => {
  it("rejects files over the size cap without reading them", async () => {
    const onAddAnimatedImage = vi.fn();
    const { result } = renderHook(() =>
      useGifImport({ onAddAnimatedImage, onPushHistory: vi.fn() }),
    );
    const arrayBuffer = vi.fn();
    const file = { size: GIF_MAX_BYTES + 1, arrayBuffer } as unknown as Blob;

    let outcome!: string;
    await act(async () => {
      outcome = await result.current.importGif(file, "huge.gif");
    });

    expect(outcome).toBe("error");
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(onAddAnimatedImage).not.toHaveBeenCalled();
    expect(result.current.importError).toMatch(/limit is 20 MB/);
  });
});
