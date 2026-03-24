import { useRef, useEffect } from "react";

interface SpeechBubbleModalProps {
  onPlace: (text: string) => void;
  onCancel: () => void;
}

export function SpeechBubbleModal({
  onPlace,
  onCancel,
}: SpeechBubbleModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function handlePlace() {
    onPlace(inputRef.current?.value ?? "");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onPlace(e.currentTarget.value);
    }
  }

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
        <p style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 600 }}>
          Speech Bubble Text
        </p>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter text..."
          onKeyDown={handleKeyDown}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            padding: "8px 10px",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 13,
              padding: "6px 14px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePlace}
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
            Place
          </button>
        </div>
      </div>
    </div>
  );
}
