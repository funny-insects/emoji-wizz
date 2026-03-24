import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportControls } from "./ExportControls";
import { PLATFORM_PRESETS } from "../utils/presets";

const preset = PLATFORM_PRESETS[0];

describe("ExportControls", () => {
  it("Download button is disabled when image prop is null", () => {
    render(
      <ExportControls
        image={null}
        preset={preset}
        onDownload={vi.fn()}
        sizeWarning={null}
      />,
    );
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
  });

  it("Download button is not disabled when image prop is an HTMLImageElement", () => {
    const image = new Image();
    render(
      <ExportControls
        image={image}
        preset={preset}
        onDownload={vi.fn()}
        sizeWarning={null}
      />,
    );
    expect(screen.getByRole("button", { name: "Download" })).not.toBeDisabled();
  });

  it("calls onDownload with 'png' when Download is clicked with PNG selected", () => {
    const onDownload = vi.fn();
    const image = new Image();
    render(
      <ExportControls
        image={image}
        preset={preset}
        onDownload={onDownload}
        sizeWarning={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledWith("png");
  });

  it("calls onDownload with 'webp' after selecting WebP and clicking Download", () => {
    const onDownload = vi.fn();
    const image = new Image();
    render(
      <ExportControls
        image={image}
        preset={preset}
        onDownload={onDownload}
        sizeWarning={null}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "webp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledWith("webp");
  });

  it("warning <p> is not rendered when sizeWarning is null", () => {
    render(
      <ExportControls
        image={null}
        preset={preset}
        onDownload={vi.fn()}
        sizeWarning={null}
      />,
    );
    expect(document.querySelector(".export-warning")).toBeNull();
  });

  it("warning <p> is rendered with the warning text when sizeWarning is a non-null string", () => {
    const warning = "Warning: file is 200 KB, exceeds Slack's 128 KB limit";
    render(
      <ExportControls
        image={null}
        preset={preset}
        onDownload={vi.fn()}
        sizeWarning={warning}
      />,
    );
    const el = document.querySelector(".export-warning");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe(warning);
  });
});
