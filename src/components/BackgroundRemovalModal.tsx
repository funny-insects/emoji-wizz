import { useState, useEffect } from "react";

interface BackgroundRemovalModalProps {
  onConfirm: (strength: number) => void;
  onCancel: () => void;
  imageData: ImageData | null;
}

export function BackgroundRemovalModal({
  onConfirm,
  onCancel,
}: BackgroundRemovalModalProps) {
  const [strength, setStrength] = useState(50);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

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
