import { useState } from "react";
import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { PresetSelector } from "./components/PresetSelector";
import { PLATFORM_PRESETS, type PlatformPreset } from "./utils/presets";

function App() {
  const [activePreset, setActivePreset] = useState<PlatformPreset>(
    PLATFORM_PRESETS[0],
  );

  function handlePresetChange(id: string) {
    const preset = PLATFORM_PRESETS.find((p) => p.id === id);
    if (preset) setActivePreset(preset);
  }

  return (
    <div className="app">
      <PresetSelector
        presets={PLATFORM_PRESETS}
        activePresetId={activePreset.id}
        onChange={handlePresetChange}
      />
      <EmojiCanvas preset={activePreset} />
    </div>
  );
}

export default App;
