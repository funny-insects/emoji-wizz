import approvedSrc from "./approved.png";
import niceSrc from "./nice.png";
import oneHundredSrc from "./one-hundred.png";
import noSrc from "./no.png";

export interface FrameDefinition {
  id: string;
  label: string;
  src: string;
  category: string;
}

export const FRAME_DEFINITIONS: FrameDefinition[] = [
  {
    id: "approved",
    label: "Approved",
    src: approvedSrc,
    category: "reactions",
  },
  { id: "nice", label: "Nice", src: niceSrc, category: "reactions" },
  {
    id: "one-hundred",
    label: "100",
    src: oneHundredSrc,
    category: "reactions",
  },
  { id: "no", label: "No", src: noSrc, category: "reactions" },
];
