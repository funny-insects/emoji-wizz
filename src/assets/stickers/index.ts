import heartEyesSrc from "./heart-eyes.png";
import sunglassesSrc from "./sunglasses.png";
import cryingTearsSrc from "./crying-tears.png";
import sparkleEyesSrc from "./sparkle-eyes.png";
import googlyEyesSrc from "./googly-eyes.png";
import laserEyesSrc from "./laser-eyes.png";
import speechBubbleSrc from "./speech-bubble.png";
import crownSrc from "./crown.png";
import fireSrc from "./fire.png";
import partyPopperSrc from "./party-popper.png";
import sparklesSrc from "./sparkles.png";
import sweatSrc from "./sweat.png";

export interface StickerDefinition {
  id: string;
  label: string;
  src: string;
  category: string;
  requiresText?: boolean;
}

export const STICKER_DEFINITIONS: StickerDefinition[] = [
  // Eyes overlays
  {
    id: "googly-eyes",
    label: "Googly Eyes",
    src: googlyEyesSrc,
    category: "eyes",
  },
  {
    id: "laser-eyes",
    label: "Laser Eyes",
    src: laserEyesSrc,
    category: "eyes",
  },
  {
    id: "heart-eyes",
    label: "Heart Eyes",
    src: heartEyesSrc,
    category: "eyes",
  },
  {
    id: "sunglasses",
    label: "Sunglasses",
    src: sunglassesSrc,
    category: "eyes",
  },
  {
    id: "crying-tears",
    label: "Crying Tears",
    src: cryingTearsSrc,
    category: "eyes",
  },
  {
    id: "sparkle-eyes",
    label: "Sparkle Eyes",
    src: sparkleEyesSrc,
    category: "eyes",
  },
  // Effects / accessories
  { id: "crown", label: "Crown", src: crownSrc, category: "effects" },
  { id: "fire", label: "Fire", src: fireSrc, category: "effects" },
  {
    id: "party-popper",
    label: "Party",
    src: partyPopperSrc,
    category: "effects",
  },
  {
    id: "sparkles",
    label: "Sparkles",
    src: sparklesSrc,
    category: "effects",
  },
  { id: "sweat", label: "Sweat", src: sweatSrc, category: "effects" },
  // Speech bubble
  {
    id: "speech-bubble",
    label: "Speech Bubble",
    src: speechBubbleSrc,
    category: "speech",
    requiresText: true,
  },
];
