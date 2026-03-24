import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";

const mockImage = new Image();

describe("Toolbar", () => {
  it("renders all 5 buttons when image is provided", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="eraser"
        onToolChange={() => {}}
        canUndo={true}
        canRedo={true}
        onUndo={() => {}}
        onRedo={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Eraser" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Brush" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redo" })).toBeInTheDocument();
  });

  it("does not render when image is null", () => {
    const { container } = render(
      <Toolbar
        image={null}
        activeTool="eraser"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("calls onToolChange with the correct tool when a tool button is clicked", () => {
    const onToolChange = vi.fn();
    render(
      <Toolbar
        image={mockImage}
        activeTool="eraser"
        onToolChange={onToolChange}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Brush" }));
    expect(onToolChange).toHaveBeenCalledWith("brush");
  });

  it("active tool button has the active CSS class", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="brush"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Brush" })).toHaveClass(
      "toolbar-btn--active",
    );
    expect(screen.getByRole("button", { name: "Eraser" })).not.toHaveClass(
      "toolbar-btn--active",
    );
  });

  it("undo button is disabled when canUndo is false", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="eraser"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={true}
        onUndo={() => {}}
        onRedo={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("redo button is disabled when canRedo is false", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="eraser"
        onToolChange={() => {}}
        canUndo={true}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });
});
