import { useState } from "react";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { ExportControls } from "./components/ExportControls";
import { PresetSelector } from "./components/PresetSelector";
import { PLATFORM_PRESETS, type PlatformPreset } from "./utils/presets";
import { useImageImport } from "./hooks/useImageImport";
import {
  buildExportCanvas,
  buildFilename,
  checkFileSizeWarning,
  type ExportFormat,
} from "./utils/exportUtils";

function App() {
  const [activePreset, setActivePreset] = useState<PlatformPreset>(
    PLATFORM_PRESETS[0],
  );
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
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
        onDownload={handleDownload}
        sizeWarning={sizeWarning}
      />
    </div>
  );
}

export default App;
