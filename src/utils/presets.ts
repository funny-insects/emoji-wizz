export interface PlatformPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  safeZonePadding: number;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "slack",
    label: "Slack — 128×128",
    width: 128,
    height: 128,
    safeZonePadding: 12,
  },
];
