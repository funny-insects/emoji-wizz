import { type PlatformPreset } from "../utils/presets";

interface PresetSelectorProps {
  presets: PlatformPreset[];
  activePresetId: string;
  onChange: (id: string) => void;
}

export function PresetSelector({
  presets,
  activePresetId,
  onChange,
}: PresetSelectorProps) {
  return (
    <div className="section">
      <span className="section-label">Platform</span>
      <div className="preset-tabs">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`preset-tab${activePresetId === preset.id ? " active" : ""}`}
            onClick={() => onChange(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
