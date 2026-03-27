import { useRef, useEffect } from "react";
import type { CanvasImageItem } from "../utils/canvasImageTypes";

interface LayerPanelProps {
  items: CanvasImageItem[];
  activeImageId: string | null;
  onSelectImage: (id: string) => void;
  onReorder: (newItems: CanvasImageItem[]) => void;
}

function ItemThumbnail({ canvas }: { canvas: HTMLCanvasElement }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.drawImage(canvas, 0, 0, el.width, el.height);
  }, [canvas]);

  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 3,
        flexShrink: 0,
        background: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px",
      }}
    />
  );
}

export function LayerPanel({
  items,
  activeImageId,
  onSelectImage,
  onReorder,
}: LayerPanelProps) {
  const dragIdRef = useRef<string | null>(null);

  // Display order: last item in array (top z-order) shown first in the list
  const displayItems = [...items].reverse();

  function handleDragStart(id: string) {
    dragIdRef.current = id;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) return;

    // Work in display order (reversed), then reverse back to get items order
    const fromDisplayIdx = displayItems.findIndex((i) => i.id === fromId);
    const toDisplayIdx = displayItems.findIndex((i) => i.id === targetId);
    if (fromDisplayIdx === -1 || toDisplayIdx === -1) return;

    const newDisplay = [...displayItems];
    const [moved] = newDisplay.splice(fromDisplayIdx, 1);
    newDisplay.splice(toDisplayIdx, 0, moved!);

    onReorder([...newDisplay].reverse());
    dragIdRef.current = null;
  }

  if (items.length === 0) {
    return (
      <div className="layer-panel">
        <span className="section-label">Layers</span>
        <p className="layer-panel-empty">No images yet</p>
      </div>
    );
  }

  return (
    <div className="layer-panel">
      <span className="section-label">Layers</span>
      <ul className="layer-list">
        {displayItems.map((item) => (
          <li
            key={item.id}
            className={`layer-row${item.id === activeImageId ? " layer-row--active" : ""}`}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.id)}
            onClick={() => onSelectImage(item.id)}
          >
            <ItemThumbnail canvas={item.canvas} />
            <span className="layer-label" title={item.label}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
