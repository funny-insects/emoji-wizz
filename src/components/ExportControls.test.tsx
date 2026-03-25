import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportControls } from "./ExportControls";
import { PLATFORM_PRESETS } from "../utils/presets";

const defaultPresetProps = {
  presets: PLATFORM_PRESETS,
  activePresetId: "slack",
  onPresetChange: vi.fn(),
};

describe("ExportControls", () => {
  it("Download button is disabled when image prop is null", () => {
    render(
      <ExportControls
        image={null}
        onDownload={vi.fn()}
        sizeWarning={null}
        {...defaultPresetProps}
      />,
    );
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
  });

  it("Download button is not disabled when image prop is an HTMLImageElement", () => {
    const image = new Image();
    render(
      <ExportControls
        image={image}
        onDownload={vi.fn()}
        sizeWarning={null}
        {...defaultPresetProps}
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
        onDownload={onDownload}
        sizeWarning={null}
        {...defaultPresetProps}
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
        onDownload={onDownload}
        sizeWarning={null}
        {...defaultPresetProps}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Format" }), {
      target: { value: "webp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledWith("webp");
  });

  it("warning <p> is not rendered when sizeWarning is null", () => {
    render(
      <ExportControls
        image={null}
        onDownload={vi.fn()}
        sizeWarning={null}
        {...defaultPresetProps}
      />,
    );
    expect(document.querySelector(".export-warning")).toBeNull();
  });

  it("warning <p> is rendered with the warning text when sizeWarning is a non-null string", () => {
    const warning = "Warning: file is 200 KB, exceeds Slack's 128 KB limit";
    render(
      <ExportControls
        image={null}
        onDownload={vi.fn()}
        sizeWarning={warning}
        {...defaultPresetProps}
      />,
    );
    const el = document.querySelector(".export-warning");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe(warning);
  });

  it("platform dropdown renders all three platform options (Slack, Discord, Apple)", () => {
    render(
      <ExportControls
        image={null}
        onDownload={vi.fn()}
        sizeWarning={null}
        {...defaultPresetProps}
      />,
    );
    const platformSelect = screen.getByRole("combobox", { name: "Platform" });
    const options = Array.from(platformSelect.querySelectorAll("option")).map(
      (o) => o.value,
    );
    expect(options).toContain("slack");
    expect(options).toContain("discord");
    expect(options).toContain("apple");
    expect(options).toHaveLength(3);
  });

  it("calls onPresetChange when platform dropdown changes", () => {
    const onPresetChange = vi.fn();
    render(
      <ExportControls
        image={null}
        onDownload={vi.fn()}
        sizeWarning={null}
        presets={PLATFORM_PRESETS}
        activePresetId="slack"
        onPresetChange={onPresetChange}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Platform" }), {
      target: { value: "discord" },
    });
    expect(onPresetChange).toHaveBeenCalledWith("discord");
  });
});
