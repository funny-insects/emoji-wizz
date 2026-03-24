import { useState, useEffect, useCallback, useRef } from "react";
import Konva from "konva";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { Toolbar } from "./components/Toolbar";
import { OptimizerPanel } from "./components/OptimizerPanel";
import { ExportControls } from "./components/ExportControls";
import { PresetSelector } from "./components/PresetSelector";
import { DecoratePanel } from "./components/DecoratePanel";
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
import { STICKER_DEFINITIONS } from "./assets/stickers/index";
import { FRAME_DEFINITIONS } from "./assets/frames/index";
import type { StickerDescriptor } from "./utils/stickerTypes";
import type { StickerDefinition } from "./assets/stickers/index";
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
  const [latestSnapshot, setLatestSnapshot] = useState<string | null>(null);

  const [stickers, setStickers] = useState<StickerDescriptor[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);

  const handlePushState = useCallback(
    (snapshot: string) => {
      pushState(snapshot);
      setLatestSnapshot(snapshot);
    },
    [pushState],
  );

  const handleUndo = useCallback(() => {
    const snapshot = undo();
    if (snapshot) {
      setRestoreSnapshot(snapshot);
      setLatestSnapshot(snapshot);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const snapshot = redo();
    if (snapshot) {
      setRestoreSnapshot(snapshot);
      setLatestSnapshot(snapshot);
    }
  }, [redo]);

  const handleSnapshotRestored = useCallback(() => {
    setRestoreSnapshot(null);
  }, []);

  const handlePlaceSticker = useCallback(
    (def: StickerDefinition) => {
      const descriptor: StickerDescriptor = {
        id: crypto.randomUUID(),
        src: def.src,
        label: def.label,
        x: activePreset.width / 2 - 32,
        y: activePreset.height / 2 - 32,
        width: 64,
        height: 64,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        requiresText: def.requiresText,
      };
      setStickers((prev) => [...prev, descriptor]);
    },
    [activePreset],
  );

  const handleUpdateSticker = useCallback((desc: StickerDescriptor) => {
    setStickers((prev) => prev.map((s) => (s.id === desc.id ? desc : s)));
  }, []);

  const handleDeleteSticker = useCallback((id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    setSelectedStickerId((prev) => (prev === id ? null : prev));
  }, []);

  const handleSelectSticker = useCallback((id: string | null) => {
    setSelectedStickerId(id);
  }, []);

  const handleToggleFrame = useCallback((id: string) => {
    setActiveFrameId((prev) => (prev === id ? null : id));
  }, []);

  const selectedStickerIdRef = useRef(selectedStickerId);
  useEffect(() => {
    selectedStickerIdRef.current = selectedStickerId;
  }, [selectedStickerId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const id = selectedStickerIdRef.current;
        if (id) {
          e.preventDefault();
          handleDeleteSticker(id);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, handleDeleteSticker]);

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

  function triggerDownload(canvas: HTMLCanvasElement, format: ExportFormat) {
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

  function handleDownload(format: ExportFormat) {
    if (!image) return;
    if (latestSnapshot) {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = activePreset.width;
        canvas.height = activePreset.height;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        triggerDownload(canvas, format);
      };
      img.src = latestSnapshot;
    } else {
      triggerDownload(buildExportCanvas(image, activePreset), format);
    }
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
            onPushState={handlePushState}
            restoreSnapshot={restoreSnapshot}
            onSnapshotRestored={handleSnapshotRestored}
            brushColor={brushColor}
            brushSize={brushSize}
            textColor={textColor}
            textSize={textSize}
            stageRef={stageRef}
            fileName={fileName}
            stickers={stickers}
            selectedStickerId={selectedStickerId}
            onUpdateSticker={handleUpdateSticker}
            onDeleteSticker={handleDeleteSticker}
            onSelectSticker={handleSelectSticker}
          />
          <DecoratePanel
            image={image}
            stickers={STICKER_DEFINITIONS}
            onPlaceSticker={handlePlaceSticker}
            activeFrameId={activeFrameId}
            frames={FRAME_DEFINITIONS}
            onToggleFrame={handleToggleFrame}
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
