import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DecoratePanel } from "./DecoratePanel";
import type { StickerDefinition } from "../assets/stickers/index";
import type { FrameDefinition } from "../assets/frames/index";

const mockStickers: StickerDefinition[] = [
  {
    id: "laser-eyes",
    label: "Laser Eyes",
    src: "/laser-eyes.png",
    category: "eyes",
  },
  {
    id: "heart-eyes",
    label: "Heart Eyes",
    src: "/heart-eyes.png",
    category: "eyes",
  },
];

const mockFrames: FrameDefinition[] = [
  {
    id: "approved",
    label: "Approved",
    src: "/approved.png",
    category: "reactions",
  },
  { id: "nice", label: "Nice", src: "/nice.png", category: "reactions" },
  {
    id: "one-hundred",
    label: "100",
    src: "/one-hundred.png",
    category: "reactions",
  },
  { id: "no", label: "No", src: "/no.png", category: "reactions" },
];

function makeMockImage(): HTMLImageElement {
  return new Image() as HTMLImageElement;
}

describe("DecoratePanel", () => {
  it("returns null when image is null", () => {
    const { container } = render(
      <DecoratePanel
        image={null}
        stickers={mockStickers}
        onPlaceSticker={vi.fn()}
        activeFrameId={null}
        frames={mockFrames}
        onToggleFrame={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders sticker thumbnails when image is present", () => {
    const { getByAltText } = render(
      <DecoratePanel
        image={makeMockImage()}
        stickers={mockStickers}
        onPlaceSticker={vi.fn()}
        activeFrameId={null}
        frames={mockFrames}
        onToggleFrame={vi.fn()}
      />,
    );
    expect(getByAltText("Laser Eyes")).not.toBeNull();
    expect(getByAltText("Heart Eyes")).not.toBeNull();
  });

  it("calls onPlaceSticker with the correct definition when a sticker thumbnail is clicked", () => {
    const onPlaceSticker = vi.fn();
    const { getByTitle } = render(
      <DecoratePanel
        image={makeMockImage()}
        stickers={mockStickers}
        onPlaceSticker={onPlaceSticker}
        activeFrameId={null}
        frames={mockFrames}
        onToggleFrame={vi.fn()}
      />,
    );
    fireEvent.click(getByTitle("Laser Eyes"));
    expect(onPlaceSticker).toHaveBeenCalledTimes(1);
    expect(onPlaceSticker).toHaveBeenCalledWith(mockStickers[0]);
  });

  it("switches to Frames tab when Frames tab button is clicked", () => {
    const { getByText, getByAltText, queryByAltText } = render(
      <DecoratePanel
        image={makeMockImage()}
        stickers={mockStickers}
        onPlaceSticker={vi.fn()}
        activeFrameId={null}
        frames={mockFrames}
        onToggleFrame={vi.fn()}
      />,
    );
    // Initially on Stickers tab — sticker thumbnails visible
    expect(getByAltText("Laser Eyes")).not.toBeNull();

    // Switch to Frames tab
    fireEvent.click(getByText("Frames"));

    // Frame thumbnails now visible, sticker thumbnails gone
    expect(getByAltText("Approved")).not.toBeNull();
    expect(queryByAltText("Laser Eyes")).toBeNull();
  });

  it("highlights the active frame with active CSS class", () => {
    const { getByTitle } = render(
      <DecoratePanel
        image={makeMockImage()}
        stickers={mockStickers}
        onPlaceSticker={vi.fn()}
        activeFrameId="approved"
        frames={mockFrames}
        onToggleFrame={vi.fn()}
      />,
    );
    // Switch to Frames tab first
    const framesTab = document.querySelector(".decorate-panel__tab:last-child");
    if (framesTab) fireEvent.click(framesTab);

    const approvedBtn = getByTitle("Approved");
    expect(approvedBtn.className).toContain("decorate-panel__item--active");
  });

  it("renders all 4 frame thumbnails in the Frames tab", () => {
    const { getByText, getAllByAltText, getByAltText } = render(
      <DecoratePanel
        image={makeMockImage()}
        stickers={mockStickers}
        onPlaceSticker={vi.fn()}
        activeFrameId={null}
        frames={mockFrames}
        onToggleFrame={vi.fn()}
      />,
    );
    fireEvent.click(getByText("Frames"));
    expect(getByAltText("Approved")).not.toBeNull();
    expect(getByAltText("Nice")).not.toBeNull();
    expect(getByAltText("100")).not.toBeNull();
    expect(getByAltText("No")).not.toBeNull();
    expect(getAllByAltText(/./)).toHaveLength(4);
  });

  it("calls onToggleFrame with the correct ID when a frame is clicked", () => {
    const onToggleFrame = vi.fn();
    const { getByText, getByTitle } = render(
      <DecoratePanel
        image={makeMockImage()}
        stickers={mockStickers}
        onPlaceSticker={vi.fn()}
        activeFrameId={null}
        frames={mockFrames}
        onToggleFrame={onToggleFrame}
      />,
    );
    fireEvent.click(getByText("Frames"));
    fireEvent.click(getByTitle("Nice"));
    expect(onToggleFrame).toHaveBeenCalledTimes(1);
    expect(onToggleFrame).toHaveBeenCalledWith("nice");
  });
});
