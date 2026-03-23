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
    <div>
      <select
        value={selectedFormat}
        onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
      >
        <option value="png">PNG</option>
        <option value="gif">GIF</option>
        <option value="webp">WebP</option>
      </select>
      <button
        disabled={image === null}
        onClick={() => onDownload(selectedFormat)}
      >
        Download
      </button>
      {sizeWarning !== null && <p className="export-warning">{sizeWarning}</p>}
    </div>
  );
}
