import { useState, useEffect, useCallback, useRef } from "react";
import Konva from "konva";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { MultiImageCanvas } from "./components/MultiImageCanvas";
import { LayerPanel } from "./components/LayerPanel";
import { Toolbar } from "./components/Toolbar";
import { OptimizerPanel } from "./components/OptimizerPanel";
import { ExportControls } from "./components/ExportControls";
import { DecoratePanel } from "./components/DecoratePanel";
import { SpeechBubbleModal } from "./components/SpeechBubbleModal";
import { BackgroundRemovalModal } from "./components/BackgroundRemovalModal";
import { strengthToTolerance } from "./utils/strengthToTolerance";
import { PLATFORM_PRESETS } from "./utils/presets";
import { useImageImport } from "./hooks/useImageImport";
import { useMultiImageCanvas } from "./hooks/useMultiImageCanvas";
import { firstClipboardImage, useGifImport } from "./hooks/useGifImport";
import { isGifFile } from "./utils/gifDecode";

const CANVAS_SIZE = 512;
import { useHistory } from "./hooks/useHistory";
import { useStickerHistory } from "./hooks/useStickerHistory";
import { detectContentBounds } from "./utils/detectContentBounds";
import { generateSuggestions } from "./utils/generateSuggestions";
import { detectContrastIssues } from "./utils/detectContrastIssues";
import { downscaleCanvas, type ExportFormat } from "./utils/exportUtils";
import {
  ExportError,
  UNSUPPORTED_FORMAT_MESSAGE,
  describeProgress,
  exportComposition,
} from "./utils/exportComposition";
import { isAnimated, type AnimationControls } from "./utils/canvasImageTypes";
import type { PlatformPreset } from "./utils/presets";
import { STICKER_DEFINITIONS } from "./assets/stickers/index";
import { FRAME_DEFINITIONS } from "./assets/frames/index";
import type { StickerDescriptor } from "./utils/stickerTypes";
import type { StickerDefinition } from "./assets/stickers/index";
import referenceEmojiPng from "./assets/reference-emoji.png";

export type EditorTool = "pointer" | "eraser" | "brush" | "text" | "crop";
export type EditorMode = "singleImage" | "multiImage";

function App() {
  // ── Editor mode ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<EditorMode>("singleImage");

  // ── Multi-image state ──────────────────────────────────────────────────────
  const multiImage = useMultiImageCanvas();

  // ── Background color ───────────────────────────────────────────────────────
  const [bgColor, setBgColor] = useState<string | null>(null);

  // ── Export / shared state ──────────────────────────────────────────────────
  const [exportPreset, setExportPreset] = useState<PlatformPreset>(
    PLATFORM_PRESETS[0]!,
  );
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [customEmojiDataUrl, setCustomEmojiDataUrl] = useState<string | null>(
    null,
  );

  // ── Single-image state ─────────────────────────────────────────────────────
  const {
    image,
    importFile,
    handleFileInput,
    handleDrop,
    handlePaste,
    fileName,
  } = useImageImport();
  const {
    importGif,
    importError: gifImportError,
    clearImportError: clearGifImportError,
  } = useGifImport({
    onAddAnimatedImage: multiImage.addAnimatedImage,
    onPushHistory: multiImage.pushHistory,
  });

  const importSingleModeGif = useCallback(
    async (file: File, label: string) => {
      const outcome = await importGif(file, label);
      if (outcome === "animated") setMode("multiImage");
      else if (outcome === "static") await importFile(file, label);
    },
    [importGif, importFile],
  );

  const handleSingleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !isGifFile(file)) {
        clearGifImportError();
        return handleFileInput(e);
      }
      const input = e.target;
      void importSingleModeGif(file, file.name).then(() => {
        input.value = "";
      });
    },
    [handleFileInput, importSingleModeGif, clearGifImportError],
  );

  const handleSingleDrop = useCallback(
    (e: React.DragEvent) => {
      const file = e.dataTransfer.files?.[0];
      if (!file || !isGifFile(file)) {
        clearGifImportError();
        return handleDrop(e);
      }
      e.preventDefault();
      void importSingleModeGif(file, file.name);
    },
    [handleDrop, importSingleModeGif, clearGifImportError],
  );

  const handleSinglePaste = useCallback(
    (e: ClipboardEvent) => {
      const file = firstClipboardImage(e.clipboardData?.items);
      if (!file || !isGifFile(file)) {
        clearGifImportError();
        return handlePaste(e);
      }
      void importSingleModeGif(file, "pasted-image");
    },
    [handlePaste, importSingleModeGif, clearGifImportError],
  );
  const [activeTool, setActiveTool] = useState<EditorTool>("pointer");
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [eraserSize, setEraserSize] = useState<number>(12);
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
  const latestSnapshotRef = useRef<string | null>(null);

  const [stickers, setStickers] = useState<StickerDescriptor[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [frameThickness, setFrameThickness] = useState<number>(50);
  const [showSpeechBubbleModal, setShowSpeechBubbleModal] = useState(false);
  const pendingTextStickerRef = useRef<StickerDefinition | null>(null);
  const activeFrameSrc =
    FRAME_DEFINITIONS.find((f) => f.id === activeFrameId)?.src ?? null;

  // ── Single-image callbacks (unchanged) ────────────────────────────────────
  const handlePushState = useCallback(
    (snapshot: string) => {
      pushState(snapshot);
      stickerHistory.pushState({
        stickers: [...stickers],
        activeFrameId,
        frameThickness,
      });
      latestSnapshotRef.current = snapshot;
    },
    [pushState, stickerHistory, stickers, activeFrameId, frameThickness],
  );

  const handleUndo = useCallback(() => {
    if (mode === "multiImage") {
      void multiImage.undo();
      return;
    }
    const imgSnap = imageUndo();
    const stickerSnap = stickerHistory.undo();
    if (imgSnap) {
      setRestoreSnapshot(imgSnap);
    }
    if (stickerSnap) {
      setStickers(stickerSnap.stickers);
      setActiveFrameId(stickerSnap.activeFrameId);
      setFrameThickness(stickerSnap.frameThickness);
    } else {
      setStickers([]);
    }
  }, [mode, multiImage, imageUndo, stickerHistory]);

  const handleRedo = useCallback(() => {
    if (mode === "multiImage") {
      void multiImage.redo();
      return;
    }
    const imgSnap = imageRedo();
    const stickerSnap = stickerHistory.redo();
    if (imgSnap) {
      setRestoreSnapshot(imgSnap);
    }
    if (stickerSnap) {
      setStickers(stickerSnap.stickers);
      setActiveFrameId(stickerSnap.activeFrameId);
      setFrameThickness(stickerSnap.frameThickness);
    } else {
      setStickers([]);
    }
  }, [mode, multiImage, imageRedo, stickerHistory]);

  const handleSnapshotRestored = useCallback(() => {
    setRestoreSnapshot(null);
  }, []);

  const handleOpenBgRemoval = useCallback(() => {
    if (mode === "multiImage") {
      const activeItem = multiImage.items.find(
        (i) => i.id === multiImage.activeImageId,
      );
      if (!activeItem) return;
      const ctx = activeItem.canvas.getContext("2d");
      if (ctx) {
        setBgRemovalImageData(
          ctx.getImageData(
            0,
            0,
            activeItem.canvas.width,
            activeItem.canvas.height,
          ),
        );
      }
      setShowBgRemovalModal(true);
      return;
    }
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
  }, [mode, multiImage]);

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
      stickerHistory.pushState({
        stickers: newStickers,
        activeFrameId,
        frameThickness,
      });
    },
    [
      stickers,
      createStickerDescriptor,
      pushState,
      stickerHistory,
      activeFrameId,
      frameThickness,
    ],
  );

  const handleSpeechBubblePlace = useCallback(
    (text: string) => {
      const def = pendingTextStickerRef.current;
      if (def) {
        const newSticker = createStickerDescriptor(def, text);
        const newStickers = [...stickers, newSticker];
        setStickers(newStickers);
        pushState(latestSnapshotRef.current ?? "");
        stickerHistory.pushState({
          stickers: newStickers,
          activeFrameId,
          frameThickness,
        });
        pendingTextStickerRef.current = null;
      }
      setShowSpeechBubbleModal(false);
    },
    [
      stickers,
      createStickerDescriptor,
      pushState,
      stickerHistory,
      activeFrameId,
      frameThickness,
    ],
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
      stickerHistory.pushState({
        stickers: newStickers,
        activeFrameId,
        frameThickness,
      });
    },
    [stickers, pushState, stickerHistory, activeFrameId, frameThickness],
  );

  const handleDeleteSticker = useCallback(
    (id: string) => {
      const newStickers = stickers.filter((s) => s.id !== id);
      setStickers(newStickers);
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState({
        stickers: newStickers,
        activeFrameId,
        frameThickness,
      });
      setSelectedStickerId((prev) => (prev === id ? null : prev));
    },
    [stickers, pushState, stickerHistory, activeFrameId, frameThickness],
  );

  const handleSelectSticker = useCallback((id: string | null) => {
    setSelectedStickerId(id);
  }, []);

  const handleToggleFrame = useCallback(
    (id: string) => {
      const nextFrameId = activeFrameId === id ? null : id;
      const nextThickness =
        nextFrameId !== null && nextFrameId !== activeFrameId
          ? 50
          : frameThickness;
      setActiveFrameId(nextFrameId);
      setFrameThickness(nextThickness);
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState({
        stickers,
        activeFrameId: nextFrameId,
        frameThickness: nextThickness,
      });
    },
    [stickers, activeFrameId, frameThickness, pushState, stickerHistory],
  );

  const handleFrameThicknessChange = useCallback((value: number) => {
    setFrameThickness(value);
  }, []);

  const handleFrameThicknessCommit = useCallback(
    (value: number) => {
      setFrameThickness(value);
      pushState(latestSnapshotRef.current ?? "");
      stickerHistory.pushState({
        stickers,
        activeFrameId,
        frameThickness: value,
      });
    },
    [stickers, activeFrameId, pushState, stickerHistory],
  );

  const handleRemoveFrame = useCallback(() => {
    pushState(latestSnapshotRef.current ?? "");
    stickerHistory.pushState({
      stickers,
      activeFrameId: null,
      frameThickness: 50,
    });
    setActiveFrameId(null);
    setFrameThickness(50);
  }, [stickers, pushState, stickerHistory]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const selectedStickerIdRef = useRef(selectedStickerId);
  useEffect(() => {
    selectedStickerIdRef.current = selectedStickerId;
  }, [selectedStickerId]);

  const activeImageIdRef = useRef(multiImage.activeImageId);
  useEffect(() => {
    activeImageIdRef.current = multiImage.activeImageId;
  }, [multiImage.activeImageId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (mode === "multiImage") {
          const imgId = activeImageIdRef.current;
          const stkId = selectedStickerIdRef.current;
          if (imgId) {
            e.preventDefault();
            multiImage.removeItem(imgId);
            multiImage.pushHistory();
          } else if (stkId) {
            e.preventDefault();
            handleDeleteSticker(stkId);
          }
        } else {
          const id = selectedStickerIdRef.current;
          if (id) {
            e.preventDefault();
            handleDeleteSticker(id);
          }
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
    mode,
    handleUndo,
    handleRedo,
    handleDeleteSticker,
    activeTool,
    handleCropConfirm,
    handleCropCancel,
    multiImage,
  ]);

  // ── Analyze ────────────────────────────────────────────────────────────────
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

  // ── Download ───────────────────────────────────────────────────────────────
  const animationRef = useRef<AnimationControls | null>(null);
  const [exporting, setExporting] = useState(false);
  const [autoFit, setAutoFit] = useState(true);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [exportSummary, setExportSummary] = useState<string | null>(null);
  const animatedItem =
    mode === "multiImage" ? multiImage.items.find(isAnimated) : undefined;

  function triggerDownload(blob: Blob, filename: string) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  }

  async function handleDownload(format: ExportFormat) {
    if (!hasContent || exporting) return;
    const stage = stageRef.current;
    if (!stage) {
      setSizeWarning("Export failed: canvas not ready.");
      return;
    }
    const controls = animationRef.current;
    setExporting(true);
    setExportSummary(null);
    try {
      const result = await exportComposition({
        stage,
        preset: exportPreset,
        format,
        bgColor,
        animation:
          animatedItem && controls
            ? {
                frames: animatedItem.frames,
                loopCount: animatedItem.loopCount ?? 0,
                controls,
              }
            : null,
        autoFit,
        onProgress: (p) => setExportProgress(describeProgress(p)),
      });
      setSizeWarning(result.warning);
      setExportSummary(result.summary);
      triggerDownload(result.blob, result.filename);
    } catch (err) {
      setSizeWarning(
        err instanceof ExportError ? err.message : UNSUPPORTED_FORMAT_MESSAGE,
      );
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  }

  const activeIsAnimated =
    mode === "multiImage" &&
    multiImage.items.some(
      (i) => i.id === multiImage.activeImageId && isAnimated(i),
    );
  if (
    activeIsAnimated &&
    (activeTool === "brush" || activeTool === "eraser" || activeTool === "text")
  ) {
    setActiveTool("pointer");
  }

  // ── Derived values for toolbar / export ───────────────────────────────────
  const activeCanUndo = mode === "multiImage" ? multiImage.canUndo : canUndo;
  const activeCanRedo = mode === "multiImage" ? multiImage.canRedo : canRedo;
  const hasContent =
    mode === "multiImage" ? multiImage.items.length > 0 : image !== null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          emoji<span>wizz</span>
        </h1>
        <p>Create platform-perfect custom emojis</p>
        <div className="mode-toggle">
          <button
            className={`mode-btn${mode === "singleImage" ? " mode-btn--active" : ""}`}
            onClick={() => setMode("singleImage")}
          >
            Single Image
          </button>
          <button
            className={`mode-btn${mode === "multiImage" ? " mode-btn--active" : ""}`}
            onClick={() => setMode("multiImage")}
          >
            Multi-Image
          </button>
        </div>
      </header>

      <div className="app-card">
        <div className="editor-area">
          <Toolbar
            image={image}
            hasContent={hasContent}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            canUndo={activeCanUndo}
            canRedo={activeCanRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            brushColor={brushColor}
            onBrushColorChange={setBrushColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            eraserSize={eraserSize}
            onEraserSizeChange={setEraserSize}
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
            animatedSelected={activeIsAnimated}
          />

          {mode === "singleImage" ? (
            <EmojiCanvas
              image={image}
              handleFileInput={handleSingleFileInput}
              handleDrop={handleSingleDrop}
              handlePaste={handleSinglePaste}
              importError={gifImportError}
              bgColor={bgColor}
              onBgColorChange={setBgColor}
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onPushState={handlePushState}
              restoreSnapshot={restoreSnapshot}
              onSnapshotRestored={handleSnapshotRestored}
              brushColor={brushColor}
              brushSize={brushSize}
              eraserSize={eraserSize}
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
              frameThickness={frameThickness}
              bgRemovalRequest={bgRemovalRequest}
              transformRequest={transformRequest}
              cropConfirmSeq={cropConfirmSeq}
              canvasRef={offscreenCanvasRef}
            />
          ) : (
            <MultiImageCanvas
              items={multiImage.items}
              activeImageId={multiImage.activeImageId}
              bgColor={bgColor}
              onBgColorChange={setBgColor}
              stageRef={stageRef}
              activeTool={activeTool}
              onToolChange={setActiveTool}
              brushColor={brushColor}
              brushSize={brushSize}
              eraserSize={eraserSize}
              bgRemovalRequest={bgRemovalRequest}
              transformRequest={transformRequest}
              cropConfirmSeq={cropConfirmSeq}
              stickers={stickers}
              selectedStickerId={selectedStickerId}
              onUpdateSticker={handleUpdateSticker}
              onDeleteSticker={handleDeleteSticker}
              onSelectSticker={handleSelectSticker}
              activeFrameSrc={activeFrameSrc}
              frameThickness={frameThickness}
              onAddImage={multiImage.addImage}
              onAddAnimatedImage={multiImage.addAnimatedImage}
              animationRef={animationRef}
              onUpdateItem={multiImage.updateItem}
              onRemoveItem={multiImage.removeItem}
              onSetActiveImageId={multiImage.setActiveImageId}
              onPushHistory={multiImage.pushHistory}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DecoratePanel
              image={image}
              hasContent={hasContent}
              stickers={STICKER_DEFINITIONS}
              onPlaceSticker={handlePlaceSticker}
              activeFrameId={activeFrameId}
              frames={FRAME_DEFINITIONS}
              onToggleFrame={handleToggleFrame}
              frameThickness={frameThickness}
              onFrameThicknessChange={handleFrameThicknessChange}
              onFrameThicknessCommit={handleFrameThicknessCommit}
              onRemoveFrame={handleRemoveFrame}
            />
            {mode === "multiImage" && (
              <LayerPanel
                items={multiImage.items}
                activeImageId={multiImage.activeImageId}
                onSelectImage={multiImage.setActiveImageId}
                onReorder={(newOrder) => {
                  multiImage.reorderItems(newOrder);
                  multiImage.pushHistory();
                }}
              />
            )}
          </div>
        </div>
        <OptimizerPanel
          hasImage={hasContent}
          onAnalyze={handleAnalyze}
          suggestions={suggestions}
          customEmojiDataUrl={customEmojiDataUrl}
          referenceEmojiSrc={referenceEmojiPng}
        />
        <ExportControls
          image={image}
          hasContent={hasContent}
          onDownload={(format) => void handleDownload(format)}
          animated={animatedItem !== undefined}
          busy={exporting}
          autoFit={autoFit}
          onAutoFitChange={setAutoFit}
          onFormatChange={() => setExportSummary(null)}
          progress={exportProgress}
          result={exportSummary}
          sizeWarning={sizeWarning}
          presets={PLATFORM_PRESETS}
          activePresetId={exportPreset.id}
          onPresetChange={(id) => {
            const preset = PLATFORM_PRESETS.find((p) => p.id === id);
            if (preset) {
              if (
                (mode === "singleImage"
                  ? image
                  : multiImage.items.length > 0) &&
                !window.confirm(
                  `Resize canvas to ${preset.label}? This will rescale the image.`,
                )
              )
                return;
              setExportPreset(preset);
              setExportSummary(null);
            }
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
