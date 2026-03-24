export type TextSize = "small" | "medium" | "large";

export const TEXT_COLOR_PALETTE = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#0000FF",
  "#008000",
  "#FFFF00",
  "#FFA500",
  "#800080",
];

export const TEXT_SIZE_PRESETS: Record<TextSize, number> = {
  small: 10,
  medium: 18,
  large: 28,
};
