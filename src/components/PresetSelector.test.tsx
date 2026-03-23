import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PresetSelector } from "./PresetSelector";
import { PLATFORM_PRESETS } from "../utils/presets";

describe("PresetSelector", () => {
  it("renders one option per preset", () => {
    render(
      <PresetSelector
        presets={PLATFORM_PRESETS}
        activePresetId="slack"
        onChange={vi.fn()}
      />,
    );
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(PLATFORM_PRESETS.length);
  });

  it("calls onChange with the selected preset id", () => {
    const multiPresets = [
      ...PLATFORM_PRESETS,
      {
        id: "discord",
        label: "Discord — 128×128",
        width: 128,
        height: 128,
        safeZonePadding: 8,
      },
    ];
    const onChange = vi.fn();
    render(
      <PresetSelector
        presets={multiPresets}
        activePresetId="slack"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "discord" },
    });
    expect(onChange).toHaveBeenCalledWith("discord");
  });
});
