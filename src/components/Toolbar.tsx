import "./Toolbar.css";
import type { EditorTool } from "../App";
import { TEXT_COLOR_PALETTE } from "../utils/textTool";

interface ToolbarProps {
  image: HTMLImageElement | null;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  textSize: number;
  onTextSizeChange: (size: number) => void;
  onRemoveBackground: (tolerance: number) => void;
  bgTolerance: number;
  onBgToleranceChange: (t: number) => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
}

export function Toolbar({
  image,
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  brushColor,
  onBrushColorChange,
  brushSize,
  onBrushSizeChange,
  textColor,
  onTextColorChange,
  textSize,
  onTextSizeChange,
  onRemoveBackground,
  bgTolerance,
  onBgToleranceChange,
  onRotateLeft,
  onRotateRight,
  onFlipHorizontal,
  onFlipVertical,
}: ToolbarProps) {
  if (!image) return null;

  return (
    <div className="toolbar">
      <div className="toolbar-tools">
        <button
          className={`toolbar-btn${activeTool === "pointer" ? " toolbar-btn--active" : ""}`}
          onClick={() => onToolChange("pointer")}
          aria-label="Pointer"
          title="Pointer"
        >
          ↖
        </button>
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
        <button
          className="toolbar-btn"
          aria-label="Remove BG"
          title="Remove Background"
          disabled={!image}
          onClick={() => onRemoveBackground(bgTolerance)}
        >
          ✂
        </button>
      </div>

      <div className="toolbar-transforms">
        <button
          className="toolbar-btn"
          onClick={onRotateLeft}
          disabled={!image}
          aria-label="Rotate Left"
          title="Rotate Left"
        >
          ↺
        </button>
        <button
          className="toolbar-btn"
          onClick={onRotateRight}
          disabled={!image}
          aria-label="Rotate Right"
          title="Rotate Right"
        >
          ↻
        </button>
        <button
          className="toolbar-btn"
          onClick={onFlipHorizontal}
          disabled={!image}
          aria-label="Flip Horizontal"
          title="Flip Horizontal"
        >
          ⇔
        </button>
        <button
          className="toolbar-btn"
          onClick={onFlipVertical}
          disabled={!image}
          aria-label="Flip Vertical"
          title="Flip Vertical"
        >
          ⇕
        </button>
      </div>

      {activeTool === "brush" && (
        <div className="toolbar-brush-settings">
          <div className="toolbar-colors">
            {TEXT_COLOR_PALETTE.map((color) => (
              <button
                key={color}
                className={`toolbar-color-swatch${brushColor === color ? " toolbar-color-swatch--active" : ""}`}
                style={{ background: color }}
                onClick={() => onBrushColorChange(color)}
                aria-label={`Color ${color}`}
                title={color}
              />
            ))}
          </div>
          <div className="toolbar-brush-size">
            <label className="toolbar-brush-size-label" htmlFor="brush-size">
              px
            </label>
            <input
              id="brush-size"
              type="number"
              className="toolbar-brush-size-input"
              value={brushSize}
              min={1}
              max={100}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 100) onBrushSizeChange(v);
              }}
            />
          </div>
        </div>
      )}

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
          <div className="toolbar-brush-size">
            <label className="toolbar-brush-size-label" htmlFor="text-size">
              px
            </label>
            <input
              id="text-size"
              type="number"
              className="toolbar-brush-size-input"
              value={textSize}
              min={4}
              max={200}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 4 && v <= 200) onTextSizeChange(v);
              }}
            />
          </div>
        </div>
      )}

      <div className="toolbar-bg-settings">
        <label className="toolbar-brush-size-label" htmlFor="bg-tolerance">
          tol
        </label>
        <input
          id="bg-tolerance"
          type="number"
          className="toolbar-brush-size-input"
          value={bgTolerance}
          min={0}
          max={128}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 0 && v <= 128) onBgToleranceChange(v);
          }}
        />
      </div>

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
