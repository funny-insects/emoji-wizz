import { useState, useRef } from "react";
import Konva from "konva";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { OptimizerPanel } from "./components/OptimizerPanel";
import { PresetSelector } from "./components/PresetSelector";
import { PLATFORM_PRESETS, type PlatformPreset } from "./utils/presets";
import { useImageImport } from "./hooks/useImageImport";
import { detectContentBounds } from "./utils/detectContentBounds";
import { generateSuggestions } from "./utils/generateSuggestions";
import referenceEmojiPng from "./assets/reference-emoji.png";

function App() {
  const [activePreset, setActivePreset] = useState<PlatformPreset>(
    PLATFORM_PRESETS[0],
  );
  const { image, handleFileInput, handleDrop, handlePaste } = useImageImport();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [customEmojiDataUrl, setCustomEmojiDataUrl] = useState<string | null>(
    null,
  );

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
        stageRef={stageRef}
      />
      <OptimizerPanel
        hasImage={image !== null}
        onAnalyze={handleAnalyze}
        suggestions={suggestions}
        customEmojiDataUrl={customEmojiDataUrl}
        referenceEmojiSrc={referenceEmojiPng}
      />
    </div>
  );
}

export default App;
