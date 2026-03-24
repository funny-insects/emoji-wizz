import "./Toolbar.css";
import type { EditorTool } from "../App";
import type { TextSize } from "../utils/textTool";
import { TEXT_COLOR_PALETTE } from "../utils/textTool";

interface ToolbarProps {
  image: HTMLImageElement | null;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  textSize: TextSize;
  onTextSizeChange: (size: TextSize) => void;
}

const SIZE_LABELS: Record<TextSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
};

const TEXT_SIZES: TextSize[] = ["small", "medium", "large"];

export function Toolbar({
  image,
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  textColor,
  onTextColorChange,
  textSize,
  onTextSizeChange,
}: ToolbarProps) {
  if (!image) return null;

  return (
    <div className="toolbar">
      <div className="toolbar-tools">
        <button
          className={`toolbar-btn${activeTool === "eraser" ? " toolbar-btn--active" : ""}`}
          onClick={() => onToolChange("eraser")}
          aria-label="Eraser"
          title="Eraser"
        >
          ◻
        </button>
        <button
          className={`toolbar-btn${activeTool === "brush" ? " toolbar-btn--active" : ""}`}
          onClick={() => onToolChange("brush")}
          aria-label="Brush"
          title="Brush"
        >
          ✏
        </button>
        <button
          className={`toolbar-btn${activeTool === "text" ? " toolbar-btn--active" : ""}`}
          onClick={() => onToolChange("text")}
          aria-label="Text"
          title="Text"
        >
          T
        </button>
      </div>

      {activeTool === "text" && (
        <div className="toolbar-text-settings">
          <div className="toolbar-colors">
            {TEXT_COLOR_PALETTE.map((color) => (
              <button
                key={color}
                className={`toolbar-color-swatch${textColor === color ? " toolbar-color-swatch--active" : ""}`}
                style={{ background: color }}
                onClick={() => onTextColorChange(color)}
                aria-label={`Color ${color}`}
                title={color}
              />
            ))}
          </div>
          <div className="toolbar-sizes">
            {TEXT_SIZES.map((size) => (
              <button
                key={size}
                className={`toolbar-size-btn${textSize === size ? " toolbar-size-btn--active" : ""}`}
                onClick={() => onTextSizeChange(size)}
                aria-label={size.charAt(0).toUpperCase() + size.slice(1)}
                title={size}
              >
                {SIZE_LABELS[size]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="toolbar-history">
        <button
          className="toolbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
        >
          ↩
        </button>
        <button
          className="toolbar-btn"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
        >
          ↪
        </button>
      </div>
    </div>
  );
}
