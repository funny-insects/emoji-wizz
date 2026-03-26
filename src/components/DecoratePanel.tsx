import { useState, useRef, useEffect } from "react";
import "./DecoratePanel.css";
import type { StickerDefinition } from "../assets/stickers/index";
import type { FrameDefinition } from "../assets/frames/index";

interface DecoratePanelProps {
  image: HTMLImageElement | null;
  stickers: StickerDefinition[];
  onPlaceSticker: (def: StickerDefinition) => void;
  activeFrameId: string | null;
  frames: FrameDefinition[];
  onToggleFrame: (id: string) => void;
  frameThickness: number;
  onFrameThicknessChange: (value: number) => void;
}

export function DecoratePanel({
  image,
  stickers,
  onPlaceSticker,
  activeFrameId,
  frames,
  onToggleFrame,
  frameThickness,
  onFrameThicknessChange,
}: DecoratePanelProps) {
  const [activeTab, setActiveTab] = useState<"stickers" | "frames">("stickers");
  const [customStickers, setCustomStickers] = useState<StickerDefinition[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectURL = URL.createObjectURL(file);
    objectUrlsRef.current.push(objectURL);
    const def: StickerDefinition = {
      id: crypto.randomUUID(),
      src: objectURL,
      label: file.name,
      category: "custom",
    };
    setCustomStickers((prev) => [def, ...prev]);
    onPlaceSticker(def);
    // Reset so the same file can be re-uploaded
    e.target.value = "";
  }

  if (!image) return null;

  return (
    <div className="decorate-panel">
      <div className="decorate-panel__tabs">
        <button
          className={`decorate-panel__tab${activeTab === "stickers" ? " decorate-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("stickers")}
        >
          Stickers
        </button>
        <button
          className={`decorate-panel__tab${activeTab === "frames" ? " decorate-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("frames")}
        >
          Frames
        </button>
      </div>
      <div className="decorate-panel__content">
        {activeTab === "stickers" && (
          <>
            <button
              className="decorate-panel__upload"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload PNG
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              style={{ display: "none" }}
              onChange={handleUploadChange}
            />
            <div className="decorate-panel__grid">
              {customStickers.map((def) => (
                <button
                  key={def.id}
                  className="decorate-panel__item"
                  onClick={() => onPlaceSticker(def)}
                  title={def.label}
                >
                  <img src={def.src} alt={def.label} draggable={false} />
                  {/* codeql[js/xss] - React JSX escapes text nodes; file.name cannot be interpreted as HTML */}
                  <span className="decorate-panel__item-label">
                    {def.label}
                  </span>
                </button>
              ))}
              {stickers.map((def) => (
                <button
                  key={def.id}
                  className="decorate-panel__item"
                  onClick={() => onPlaceSticker(def)}
                  title={def.label}
                >
                  <img src={def.src} alt={def.label} draggable={false} />
                  <span className="decorate-panel__item-label">
                    {def.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {activeTab === "frames" && (
          <>
            <div className="decorate-panel__grid">
              {frames.map((def) => (
                <button
                  key={def.id}
                  className={`decorate-panel__item${activeFrameId === def.id ? " decorate-panel__item--active" : ""}`}
                  onClick={() => onToggleFrame(def.id)}
                  title={def.label}
                >
                  <img src={def.src} alt={def.label} />
                  <span className="decorate-panel__item-label">
                    {def.label}
                  </span>
                </button>
              ))}
            </div>
            {activeFrameId !== null && (
              <div className="decorate-panel__frame-controls">
                <label className="decorate-panel__frame-label">
                  Size
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={frameThickness}
                    className="decorate-panel__frame-slider"
                    onChange={(e) =>
                      onFrameThicknessChange(Number(e.target.value))
                    }
                  />
                </label>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
