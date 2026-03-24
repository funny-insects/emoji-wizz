import { useState } from "react";
import type { ExportFormat } from "../utils/exportUtils";
import type { PlatformPreset } from "../utils/presets";

interface ExportControlsProps {
  image: HTMLImageElement | null;
  preset: PlatformPreset;
  onDownload: (format: ExportFormat) => void;
  sizeWarning: string | null;
}

export function ExportControls({
  image,
  onDownload,
  sizeWarning,
}: ExportControlsProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("png");

  return (
    <div className="section">
      <span className="section-label">Export</span>

      <div className="export-row">
        <select
          className="format-select"
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
        >
          <option value="png">PNG</option>
          <option value="gif">GIF</option>
          <option value="webp">WebP</option>
        </select>
        <button
          className="btn-download"
          disabled={image === null}
          onClick={() => onDownload(selectedFormat)}
        >
          Download
        </button>
      </div>

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
