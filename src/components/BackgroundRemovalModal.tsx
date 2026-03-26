import { useState, useEffect, useRef } from "react";
import { removeBackground } from "../utils/removeBackground";
import { strengthToTolerance } from "../utils/strengthToTolerance";

const MAX_PREVIEW_SIZE = 200;

interface BackgroundRemovalModalProps {
  onConfirm: (strength: number) => void;
  onCancel: () => void;
  imageData: ImageData | null;
}

export function BackgroundRemovalModal({
  onConfirm,
  onCancel,
  imageData,
}: BackgroundRemovalModalProps) {
  const [strength, setStrength] = useState(50);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Compute preview dimensions maintaining aspect ratio
  const previewDims =
    imageData && imageData.width > 0 && imageData.height > 0
      ? (() => {
          const scale = Math.min(
            MAX_PREVIEW_SIZE / imageData.width,
            MAX_PREVIEW_SIZE / imageData.height,
            1,
          );
          return {
            width: Math.round(imageData.width * scale),
            height: Math.round(imageData.height * scale),
          };
        })()
      : null;

  // Debounced preview update
  useEffect(() => {
    if (!imageData || !previewCanvasRef.current) return;
    const id = setTimeout(() => {
      const result = removeBackground(imageData, strengthToTolerance(strength));
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Draw result scaled to preview canvas size
      const tmp = document.createElement("canvas");
      tmp.width = imageData.width;
      tmp.height = imageData.height;
      tmp.getContext("2d")!.putImageData(result, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
    }, 250);
    return () => clearTimeout(id);
  }, [imageData, strength]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          position: "relative",
          background: "#1e1e2e",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minWidth: 280,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={onCancel}
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            fontSize: 16,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <p style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 600 }}>
          Background Remover
        </p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          Automatically removes the background color from your image
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            htmlFor="bg-removal-strength"
            style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}
          >
            Strength: {strength}%
          </label>
          <input
            id="bg-removal-strength"
            type="range"
            min={1}
            max={100}
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#fe81d4" }}
          />
        </div>
        {previewDims && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={previewDims.width}
              height={previewDims.height}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 4,
                background:
                  "repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 12px 12px",
              }}
            />
          </div>
        )}
        <button
          onClick={() => onConfirm(strength)}
          style={{
            background: "#fe81d4",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            padding: "6px 14px",
          }}
        >
          Remove Background
        </button>
      </div>
    </div>
  );
}
