import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PresetSelector } from "./PresetSelector";
import { PLATFORM_PRESETS } from "../utils/presets";

describe("PresetSelector", () => {
  it("renders one button per preset", () => {
    render(
      <PresetSelector
        presets={PLATFORM_PRESETS}
        activePresetId="slack"
        onChange={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(PLATFORM_PRESETS.length);
  });

  it("calls onChange with the selected preset id", () => {
    const onChange = vi.fn();
    render(
      <PresetSelector
        presets={PLATFORM_PRESETS}
        activePresetId="slack"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /discord/i }));
    expect(onChange).toHaveBeenCalledWith("discord");
  });
});
