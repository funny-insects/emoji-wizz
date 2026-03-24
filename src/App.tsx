import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { Toolbar } from "./components/Toolbar";
import { PresetSelector } from "./components/PresetSelector";
import { PLATFORM_PRESETS, type PlatformPreset } from "./utils/presets";
import { useImageImport } from "./hooks/useImageImport";
import { useHistory } from "./hooks/useHistory";

export type EditorTool = "eraser" | "brush" | "text";

function App() {
  const [activePreset, setActivePreset] = useState<PlatformPreset>(
    PLATFORM_PRESETS[0]!,
  );
  const { image, handleFileInput, handleDrop, handlePaste } = useImageImport();
  const [activeTool, setActiveTool] = useState<EditorTool>("eraser");
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
  }

  return (
    <div className="app">
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
        />
      </div>
    </div>
  );
}

export default App;
