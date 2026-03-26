import { useState, useEffect, useCallback, useRef } from "react";
import Konva from "konva";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { Toolbar } from "./components/Toolbar";
import { OptimizerPanel } from "./components/OptimizerPanel";
import { ExportControls } from "./components/ExportControls";
import { DecoratePanel } from "./components/DecoratePanel";
import { SpeechBubbleModal } from "./components/SpeechBubbleModal";
import { BackgroundRemovalModal } from "./components/BackgroundRemovalModal";
import { strengthToTolerance } from "./utils/strengthToTolerance";
import { PLATFORM_PRESETS } from "./utils/presets";
import { useImageImport } from "./hooks/useImageImport";

const CANVAS_SIZE = 512;
import { useHistory } from "./hooks/useHistory";
import { useStickerHistory } from "./hooks/useStickerHistory";
import { detectContentBounds } from "./utils/detectContentBounds";
import { generateSuggestions } from "./utils/generateSuggestions";
import { detectContrastIssues } from "./utils/detectContrastIssues";
import {
  buildExportCanvas,
  buildFilename,
  checkFileSizeWarning,
  downscaleCanvas,
  exportStageAsBlob,
  type ExportFormat,
} from "./utils/exportUtils";
import type { PlatformPreset } from "./utils/presets";
import { STICKER_DEFINITIONS } from "./assets/stickers/index";
import { FRAME_DEFINITIONS } from "./assets/frames/index";
import type { StickerDescriptor } from "./utils/stickerTypes";
import type { StickerDefinition } from "./assets/stickers/index";
import referenceEmojiPng from "./assets/reference-emoji.png";

export type EditorTool = "pointer" | "eraser" | "brush" | "text" | "crop";

function App() {
  const [exportPreset, setExportPreset] = useState<PlatformPreset>(
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
  const [activeTool, setActiveTool] = useState<EditorTool>("pointer");
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [textColor, setTextColor] = useState<string>("#000000");
  const [textSize, setTextSize] = useState<number>(18);
  const [showBgRemovalModal, setShowBgRemovalModal] = useState(false);
  const [bgRemovalImageData, setBgRemovalImageData] =
    useState<ImageData | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bgRemovalRequest, setBgRemovalRequest] = useState<{
    tolerance: number;
    seq: number;
  } | null>(null);
  const [transformRequest, setTransformRequest] = useState<{
    type: "rotateCW" | "rotateCCW" | "flipH" | "flipV";
    seq: number;
  } | null>(null);
  const transformSeqRef = useRef(0);
  const {
    pushState,
    undo: imageUndo,
    redo: imageRedo,
    canUndo,
    canRedo,
  } = useHistory();
  const stickerHistory = useStickerHistory();

  const [restoreSnapshot, setRestoreSnapshot] = useState<string | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<string | null>(null);
  const latestSnapshotRef = useRef<string | null>(null);

  const [stickers, setStickers] = useState<StickerDescriptor[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [showSpeechBubbleModal, setShowSpeechBubbleModal] = useState(false);
  const pendingTextStickerRef = useRef<StickerDefinition | null>(null);
  const activeFrameSrc =
    FRAME_DEFINITIONS.find((f) => f.id === activeFrameId)?.src ?? null;

  const handlePushState = useCallback(
    (snapshot: string) => {
      pushState(snapshot);
      stickerHistory.pushState([...stickers]);
      setLatestSnapshot(snapshot);
      latestSnapshotRef.current = snapshot;
    },
    [pushState, stickerHistory, stickers],
  );

  const handleUndo = useCallback(() => {
    const imgSnap = imageUndo();
    const stickerSnap = stickerHistory.undo();
    if (imgSnap) {
      setRestoreSnapshot(imgSnap);
      setLatestSnapshot(imgSnap);
    }
    setStickers(stickerSnap ?? []);
  }, [imageUndo, stickerHistory]);

  const handleRedo = useCallback(() => {
    const imgSnap = imageRedo();
    const stickerSnap = stickerHistory.redo();
    if (imgSnap) {
      setRestoreSnapshot(imgSnap);
      setLatestSnapshot(imgSnap);
    }
    setStickers(stickerSnap ?? []);
  }, [imageRedo, stickerHistory]);

  const handleSnapshotRestored = useCallback(() => {
    setRestoreSnapshot(null);
  }, []);

  const handleOpenBgRemoval = useCallback(() => {
    const canvas = offscreenCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        setBgRemovalImageData(
          ctx.getImageData(0, 0, canvas.width, canvas.height),
        );
      }
    }
    setShowBgRemovalModal(true);
  }, []);

  const handleBgRemovalConfirm = useCallback((strength: number) => {
    setBgRemovalRequest((prev) => ({
      tolerance: strengthToTolerance(strength),
      seq: (prev?.seq ?? 0) + 1,
    }));
    setShowBgRemovalModal(false);
    setBgRemovalImageData(null);
  }, []);

  const handleBgRemovalCancel = useCallback(() => {
    setShowBgRemovalModal(false);
    setBgRemovalImageData(null);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setTransformRequest({ type: "rotateCCW", seq: transformSeqRef.current++ });
  }, []);

  const handleRotateRight = useCallback(() => {
    setTransformRequest({ type: "rotateCW", seq: transformSeqRef.current++ });
  }, []);

  const handleFlipHorizontal = useCallback(() => {
    setTransformRequest({ type: "flipH", seq: transformSeqRef.current++ });
  }, []);

  const handleFlipVertical = useCallback(() => {
    setTransformRequest({ type: "flipV", seq: transformSeqRef.current++ });
  }, []);

  const [cropConfirmSeq, setCropConfirmSeq] = useState(0);
  const cropConfirmSeqRef = useRef(0);

  const handleCropConfirm = useCallback(() => {
    setCropConfirmSeq(++cropConfirmSeqRef.current);
  }, []);

  const handleCropCancel = useCallback(() => {
    setActiveTool("pointer");
  }, []);

  const createStickerDescriptor = useCallback(
    (def: StickerDefinition, text?: string): StickerDescriptor => ({
      id: crypto.randomUUID(),
      src: def.src,
      label: def.label,
      x: CANVAS_SIZE / 2 - 32,
      y: CANVAS_SIZE / 2 - 32,
      width: 64,
      height: 64,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      requiresText: def.requiresText,
      text,
    }),
    [],
  );

  const handlePlaceSticker = useCallback(
    (def: StickerDefinition) => {
      if (def.requiresText) {
        pendingTextStickerRef.current = def;
        setShowSpeechBubbleModal(true);
        return;
      }
      const newSticker = createStickerDescriptor(def);
      const newStickers = [...stickers, newSticker];
      setStickers(newStickers);
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState(newStickers);
    },
    [stickers, createStickerDescriptor, pushState, stickerHistory],
  );

  const handleSpeechBubblePlace = useCallback(
    (text: string) => {
      const def = pendingTextStickerRef.current;
      if (def) {
        const newSticker = createStickerDescriptor(def, text);
        const newStickers = [...stickers, newSticker];
        setStickers(newStickers);
        pushState(latestSnapshotRef.current ?? "");
        stickerHistory.pushState(newStickers);
        pendingTextStickerRef.current = null;
      }
      setShowSpeechBubbleModal(false);
    },
    [stickers, createStickerDescriptor, pushState, stickerHistory],
  );

  const handleSpeechBubbleCancel = useCallback(() => {
    pendingTextStickerRef.current = null;
    setShowSpeechBubbleModal(false);
  }, []);

  const handleUpdateSticker = useCallback(
    (desc: StickerDescriptor) => {
      const newStickers = stickers.map((s) => (s.id === desc.id ? desc : s));
      setStickers(newStickers);
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState(newStickers);
    },
    [stickers, pushState, stickerHistory],
  );

  const handleDeleteSticker = useCallback(
    (id: string) => {
      const newStickers = stickers.filter((s) => s.id !== id);
      setStickers(newStickers);
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState(newStickers);
      setSelectedStickerId((prev) => (prev === id ? null : prev));
    },
    [stickers, pushState, stickerHistory],
  );

  const handleSelectSticker = useCallback((id: string | null) => {
    setSelectedStickerId(id);
  }, []);

  const handleToggleFrame = useCallback(
    (id: string) => {
      setActiveFrameId((prev) => (prev === id ? null : id));
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState(stickers);
    },
    [stickers, pushState, stickerHistory],
  );

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
      } else if (activeTool === "crop" && e.key === "Enter") {
        e.preventDefault();
        handleCropConfirm();
      } else if (activeTool === "crop" && e.key === "Escape") {
        e.preventDefault();
        handleCropCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteSticker,
    activeTool,
    handleCropConfirm,
    handleCropCancel,
  ]);

  function handleAnalyze() {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL();
    const canvas = stageRef.current.toCanvas();
    const imageData = canvas
      .getContext("2d")!
      .getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const bounds = detectContentBounds(imageData);
    if (!bounds) {
      setSuggestions([]);
    } else {
      setSuggestions([
        ...generateSuggestions(bounds, exportPreset, CANVAS_SIZE),
        ...detectContrastIssues(imageData, bounds),
      ]);
    }
    if (exportPreset.width < CANVAS_SIZE) {
      const img = new window.Image();
      img.onload = () => {
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = CANVAS_SIZE;
        sourceCanvas.height = CANVAS_SIZE;
        sourceCanvas.getContext("2d")!.drawImage(img, 0, 0);
        const scaled = downscaleCanvas(
          sourceCanvas,
          exportPreset.width,
          exportPreset.height,
        );
        setCustomEmojiDataUrl(scaled.toDataURL());
      };
      img.src = dataUrl;
    } else {
      setCustomEmojiDataUrl(dataUrl);
    }
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
      setSizeWarning(checkFileSizeWarning(blob.size, exportPreset));
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = buildFilename(format, exportPreset.id);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    }, mimeMap[format]);
  }

  function handleDownload(format: ExportFormat) {
    if (!image) return;
    if (stickers.length > 0 || activeFrameId !== null) {
      if (!stageRef.current) {
        setSizeWarning("Export failed: canvas not ready.");
        return;
      }
      exportStageAsBlob(stageRef.current, exportPreset).then((blob) => {
        if (!blob) {
          setSizeWarning(
            "Export failed: this format is not supported by your browser.",
          );
          return;
        }
        setSizeWarning(checkFileSizeWarning(blob.size, exportPreset));
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = buildFilename(format, exportPreset.id);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(href);
      });
      return;
    }
    if (latestSnapshot) {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        const exportCanvas = downscaleCanvas(
          canvas,
          exportPreset.width,
          exportPreset.height,
        );
        triggerDownload(exportCanvas, format);
      };
      img.src = latestSnapshot;
    } else {
      triggerDownload(buildExportCanvas(image, exportPreset), format);
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
            onOpenBgRemoval={handleOpenBgRemoval}
            onRotateLeft={handleRotateLeft}
            onRotateRight={handleRotateRight}
            onFlipHorizontal={handleFlipHorizontal}
            onFlipVertical={handleFlipVertical}
            onCropConfirm={handleCropConfirm}
            onCropCancel={handleCropCancel}
          />
          <EmojiCanvas
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
            activeFrameSrc={activeFrameSrc}
            bgRemovalRequest={bgRemovalRequest}
            transformRequest={transformRequest}
            cropConfirmSeq={cropConfirmSeq}
            canvasRef={offscreenCanvasRef}
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
          onDownload={handleDownload}
          sizeWarning={sizeWarning}
          presets={PLATFORM_PRESETS}
          activePresetId={exportPreset.id}
          onPresetChange={(id) => {
            const preset = PLATFORM_PRESETS.find((p) => p.id === id);
            if (preset) setExportPreset(preset);
          }}
        />
      </div>
      {showSpeechBubbleModal && (
        <SpeechBubbleModal
          onPlace={handleSpeechBubblePlace}
          onCancel={handleSpeechBubbleCancel}
        />
      )}
      {showBgRemovalModal && (
        <BackgroundRemovalModal
          onConfirm={handleBgRemovalConfirm}
          onCancel={handleBgRemovalCancel}
          imageData={bgRemovalImageData}
        />
      )}
    </div>
  );
}

export default App;
