export interface PlatformPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  safeZonePadding: number;
  maxFileSizeKb: number;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "slack",
    label: "Slack — 128×128",
    width: 128,
    height: 128,
    safeZonePadding: 12,
    maxFileSizeKb: 128,
  },
  {
    id: "discord",
    label: "Discord — 128×128",
    width: 128,
    height: 128,
    safeZonePadding: 10,
    maxFileSizeKb: 256,
  },
  {
    id: "apple",
    label: "Apple — 512×512",
    width: 512,
    height: 512,
    safeZonePadding: 40,
    maxFileSizeKb: 500,
  },
];
