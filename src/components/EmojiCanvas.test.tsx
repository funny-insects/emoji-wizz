import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmojiCanvas } from "./EmojiCanvas";
import { PLATFORM_PRESETS } from "../utils/presets";

const slackPreset = PLATFORM_PRESETS.find((p) => p.id === "slack")!;

describe("EmojiCanvas", () => {
  it("renders a canvas with the correct dimensions for the Slack preset", () => {
    const { container } = render(<EmojiCanvas preset={slackPreset} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("width")).toBe("128");
    expect(canvas?.getAttribute("height")).toBe("128");
  });
});
