import { useState } from "react";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { ExportControls } from "./components/ExportControls";
import { PresetSelector } from "./components/PresetSelector";
import { PLATFORM_PRESETS, type PlatformPreset } from "./utils/presets";
import { useImageImport } from "./hooks/useImageImport";

function App() {
  const [activePreset, setActivePreset] = useState<PlatformPreset>(
    PLATFORM_PRESETS[0],
  );
  const { image, handleFileInput, handleDrop, handlePaste } = useImageImport();

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
      <EmojiCanvas
        preset={activePreset}
        image={image}
        handleFileInput={handleFileInput}
        handleDrop={handleDrop}
        handlePaste={handlePaste}
      />
      <ExportControls
        image={image}
        preset={activePreset}
        onDownload={() => {}}
        sizeWarning={null}
      />
    </div>
  );
}

export default App;
