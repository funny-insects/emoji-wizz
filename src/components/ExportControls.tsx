import { useState } from "react";
import type { ExportFormat } from "../utils/exportUtils";
import type { PlatformPreset } from "../utils/presets";
import { STATIC_EXPORT_NOTE } from "../utils/exportComposition";

interface ExportControlsProps {
  image: HTMLImageElement | null;
  hasContent?: boolean;
  onDownload: (format: ExportFormat) => void;
  sizeWarning: string | null;
  presets: PlatformPreset[];
  activePresetId: string;
  onPresetChange: (id: string) => void;
  animated?: boolean;
  busy?: boolean;
}

export function ExportControls({
  image,
  hasContent,
  onDownload,
  sizeWarning,
  presets,
  activePresetId,
  onPresetChange,
  animated = false,
  busy = false,
}: ExportControlsProps) {
  const canDownload = hasContent !== undefined ? hasContent : image !== null;
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    animated ? "gif" : "png",
  );
  const [prevAnimated, setPrevAnimated] = useState(animated);
  if (animated !== prevAnimated) {
    setPrevAnimated(animated);
    if (animated) setSelectedFormat("gif");
  }

  return (
    <div className="section">
      <span className="section-label">Export</span>

      <div className="export-row">
        <select
          className="format-select"
          value={activePresetId}
          onChange={(e) => onPresetChange(e.target.value)}
          aria-label="Platform"
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        <select
          className="format-select"
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
          aria-label="Format"
        >
          <option value="png">PNG</option>
          <option value="gif">GIF</option>
          <option value="webp">WebP</option>
        </select>
        <button
          className="btn-download"
          disabled={!canDownload || busy}
          onClick={() => onDownload(selectedFormat)}
        >
          Download
        </button>
      </div>

      {animated && selectedFormat !== "gif" && (
        <p className="export-note">{STATIC_EXPORT_NOTE}</p>
      )}

      {sizeWarning !== null && (
        <p className="export-warning">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {sizeWarning}
        </p>
      )}
    </div>
  );
}
