import "./Toolbar.css";
import type { EditorTool } from "../App";

interface ToolbarProps {
  image: HTMLImageElement | null;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function Toolbar({
  image,
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
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
