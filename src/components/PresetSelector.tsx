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
    <select value={activePresetId} onChange={(e) => onChange(e.target.value)}>
      {presets.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.label}
        </option>
      ))}
    </select>
  );
}
