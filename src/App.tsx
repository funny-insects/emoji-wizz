import { useState, useEffect, useCallback, useRef } from "react";
import Konva from "konva";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { Toolbar } from "./components/Toolbar";
import { OptimizerPanel } from "./components/OptimizerPanel";
import { ExportControls } from "./components/ExportControls";
import { PresetSelector } from "./components/PresetSelector";
import { PLATFORM_PRESETS, type PlatformPreset } from "./utils/presets";
import { useImageImport } from "./hooks/useImageImport";
import { useHistory } from "./hooks/useHistory";
import { detectContentBounds } from "./utils/detectContentBounds";
import { generateSuggestions } from "./utils/generateSuggestions";
import {
  buildExportCanvas,
  buildFilename,
  checkFileSizeWarning,
  type ExportFormat,
} from "./utils/exportUtils";
import referenceEmojiPng from "./assets/reference-emoji.png";

export type EditorTool = "eraser" | "brush" | "text";

function App() {
  const [activePreset, setActivePreset] = useState<PlatformPreset>(
    PLATFORM_PRESETS[0]!,
  );
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const { image, handleFileInput, handleDrop, handlePaste, fileName } =
    useImageImport();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [customEmojiDataUrl, setCustomEmojiDataUrl] = useState<string | null>(
    null,
  );
  const [activeTool, setActiveTool] = useState<EditorTool>("eraser");
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [textColor, setTextColor] = useState<string>("#000000");
  const [textSize, setTextSize] = useState<number>(18);
  const { pushState, undo, redo, canUndo, canRedo } = useHistory();

  const [restoreSnapshot, setRestoreSnapshot] = useState<string | null>(null);

  const handleUndo = useCallback(() => {
    const snapshot = undo();
    if (snapshot) setRestoreSnapshot(snapshot);
  }, [undo]);

  const handleRedo = useCallback(() => {
    const snapshot = redo();
    if (snapshot) setRestoreSnapshot(snapshot);
  }, [redo]);

  const handleSnapshotRestored = useCallback(() => {
    setRestoreSnapshot(null);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  function handleAnalyze() {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL();
    setCustomEmojiDataUrl(dataUrl);
    const canvas = stageRef.current.toCanvas();
    const imageData = canvas
      .getContext("2d")!
      .getImageData(0, 0, activePreset.width, activePreset.height);
    const bounds = detectContentBounds(imageData);
    if (!bounds) {
      setSuggestions([]);
      return;
    }
    setSuggestions(generateSuggestions(bounds, activePreset));
  }

  function handlePresetChange(id: string) {
    const preset = PLATFORM_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    if (image) {
      const ok = window.confirm(
        `Switching to ${preset.label} will resize the canvas. Your image will be re-scaled to fit. Continue?`,
      );
      if (!ok) return;
    }
    setActivePreset(preset);
    setSizeWarning(null);
  }

  function handleDownload(format: ExportFormat) {
    if (!image) return;
    const canvas = buildExportCanvas(image, activePreset);
    const mimeMap: Record<ExportFormat, string> = {
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    canvas.toBlob((blob) => {
      if (!blob) {
        setSizeWarning(
          "Export failed: this format is not supported by your browser.",
        );
        return;
      }
      setSizeWarning(checkFileSizeWarning(blob.size, activePreset));
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = buildFilename(format);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    }, mimeMap[format]);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          emoji<span>wizz</span>
        </h1>
        <p>Create platform-perfect custom emojis</p>
      </header>

      <div className="app-card">
        <PresetSelector
          presets={PLATFORM_PRESETS}
          activePresetId={activePreset.id}
          onChange={handlePresetChange}
        />
        <div className="editor-area">
          <Toolbar
            image={image}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            brushColor={brushColor}
            onBrushColorChange={setBrushColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            textColor={textColor}
            onTextColorChange={setTextColor}
            textSize={textSize}
            onTextSizeChange={setTextSize}
          />
          <EmojiCanvas
            preset={activePreset}
            image={image}
            handleFileInput={handleFileInput}
            handleDrop={handleDrop}
            handlePaste={handlePaste}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onPushState={pushState}
            restoreSnapshot={restoreSnapshot}
            onSnapshotRestored={handleSnapshotRestored}
            brushColor={brushColor}
            brushSize={brushSize}
            textColor={textColor}
            textSize={textSize}
            stageRef={stageRef}
            fileName={fileName}
          />
        </div>
        <OptimizerPanel
          hasImage={image !== null}
          onAnalyze={handleAnalyze}
          suggestions={suggestions}
          customEmojiDataUrl={customEmojiDataUrl}
          referenceEmojiSrc={referenceEmojiPng}
        />
        <ExportControls
          image={image}
          preset={activePreset}
          onDownload={handleDownload}
          sizeWarning={sizeWarning}
        />
      </div>
    </div>
  );
}

export default App;
