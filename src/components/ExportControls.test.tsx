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

  describe("animated compositions", () => {
    const formatSelect = () =>
      screen.getByRole("combobox", { name: "Format" }) as HTMLSelectElement;

    function renderControls(animated: boolean, busy = false) {
      return (
        <ExportControls
          image={null}
          hasContent
          animated={animated}
          busy={busy}
          onDownload={vi.fn()}
          sizeWarning={null}
          {...defaultPresetProps}
        />
      );
    }

    it("auto-selects GIF when the composition becomes animated", () => {
      const { rerender } = render(renderControls(false));
      expect(formatSelect().value).toBe("png");
      rerender(renderControls(true));
      expect(formatSelect().value).toBe("gif");
      expect(
        screen.queryByText("Static export: animation not included"),
      ).toBeNull();
    });

    it("shows the static-export note when PNG or WebP is chosen for an animation", () => {
      render(renderControls(true));
      fireEvent.change(formatSelect(), { target: { value: "png" } });
      expect(
        screen.getByText("Static export: animation not included"),
      ).toBeInTheDocument();
      fireEvent.change(formatSelect(), { target: { value: "webp" } });
      expect(
        screen.getByText("Static export: animation not included"),
      ).toBeInTheDocument();
    });

    it("does not show the note for static compositions", () => {
      render(renderControls(false));
      expect(
        screen.queryByText("Static export: animation not included"),
      ).toBeNull();
    });

    it("disables Download while an export is running", () => {
      render(renderControls(true, true));
      expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
    });
  });

  describe("auto-fit", () => {
    const checkbox = () =>
      screen.queryByRole("checkbox", { name: "Auto-fit to size limit" });

    function renderControls(
      props: Partial<React.ComponentProps<typeof ExportControls>> = {},
    ) {
      return render(
        <ExportControls
          image={null}
          hasContent
          animated
          onAutoFitChange={vi.fn()}
          onDownload={vi.fn()}
          sizeWarning={null}
          {...defaultPresetProps}
          {...props}
        />,
      );
    }

    it("is checked by default for animated GIF exports", () => {
      renderControls();
      expect(checkbox()).toBeChecked();
    });

    it("is hidden for static compositions and non-GIF formats", () => {
      const { unmount } = renderControls({ animated: false });
      expect(checkbox()).toBeNull();
      unmount();
      renderControls();
      fireEvent.change(screen.getByRole("combobox", { name: "Format" }), {
        target: { value: "png" },
      });
      expect(checkbox()).toBeNull();
    });

    it("reports toggles and format changes", () => {
      const onAutoFitChange = vi.fn();
      const onFormatChange = vi.fn();
      renderControls({ onAutoFitChange, onFormatChange });
      fireEvent.click(checkbox()!);
      expect(onAutoFitChange).toHaveBeenCalledWith(false);
      fireEvent.change(screen.getByRole("combobox", { name: "Format" }), {
        target: { value: "webp" },
      });
      expect(onFormatChange).toHaveBeenCalledWith("webp");
    });

    it("reflects an unchecked state from props", () => {
      renderControls({ autoFit: false });
      expect(checkbox()).not.toBeChecked();
    });

    it("shows progress as a status and the result line", () => {
      renderControls({
        progress: "Optimizing\u2026 step 3/8",
        result: "118 KB \u2014 64 colors, 12 fps, 128 px (was 412 KB)",
      });
      expect(screen.getByRole("status")).toHaveTextContent(
        "Optimizing\u2026 step 3/8",
      );
      expect(
        screen.getByText(
          "118 KB \u2014 64 colors, 12 fps, 128 px (was 412 KB)",
        ),
      ).toHaveClass("export-result");
    });

    it("renders no progress or result by default", () => {
      renderControls();
      expect(screen.queryByRole("status")).toBeNull();
      expect(document.querySelector(".export-result")).toBeNull();
    });
  });
});
