import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BackgroundRemovalModal } from "./BackgroundRemovalModal";

describe("BackgroundRemovalModal", () => {
  it("renders title, description, and slider at default 50", () => {
    render(
      <BackgroundRemovalModal
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        imageData={null}
      />,
    );
    expect(screen.getByText("Background Remover")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Automatically removes the background color from your image",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveValue("50");
    expect(screen.getByText("Strength: 50%")).toBeInTheDocument();
  });

  it("changing the slider updates the displayed value", () => {
    render(
      <BackgroundRemovalModal
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        imageData={null}
      />,
    );
    fireEvent.change(screen.getByRole("slider"), { target: { value: "75" } });
    expect(screen.getByText("Strength: 75%")).toBeInTheDocument();
  });

  it("clicking Remove Background calls onConfirm with current strength", () => {
    const onConfirm = vi.fn();
    render(
      <BackgroundRemovalModal
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        imageData={null}
      />,
    );
    fireEvent.change(screen.getByRole("slider"), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove Background" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(80);
  });

  it("clicking ✕ calls onCancel", () => {
    const onCancel = vi.fn();
    render(
      <BackgroundRemovalModal
        onConfirm={vi.fn()}
        onCancel={onCancel}
        imageData={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("clicking the backdrop calls onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <BackgroundRemovalModal
        onConfirm={vi.fn()}
        onCancel={onCancel}
        imageData={null}
      />,
    );
    fireEvent.click(container.firstChild as Element);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("pressing Escape calls onCancel", () => {
    const onCancel = vi.fn();
    render(
      <BackgroundRemovalModal
        onConfirm={vi.fn()}
        onCancel={onCancel}
        imageData={null}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
