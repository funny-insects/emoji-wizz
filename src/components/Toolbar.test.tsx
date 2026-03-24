import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import type { TextSize } from "../utils/textTool";

const mockImage = new Image();

const defaultTextProps: {
  textColor: string;
  onTextColorChange: () => void;
  textSize: TextSize;
  onTextSizeChange: () => void;
} = {
  textColor: "#000000",
  onTextColorChange: () => {},
  textSize: "medium",
  onTextSizeChange: () => {},
};

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
        {...defaultTextProps}
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
        {...defaultTextProps}
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
        {...defaultTextProps}
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
        {...defaultTextProps}
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
        {...defaultTextProps}
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
        {...defaultTextProps}
      />,
    );
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });
});

describe("Toolbar — text tool settings", () => {
  it("does not render color swatches or size buttons when tool is not text", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="eraser"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        {...defaultTextProps}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Color #/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Small" }),
    ).not.toBeInTheDocument();
  });

  it("renders 8 color swatches and 3 size buttons when text tool is active", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="text"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        {...defaultTextProps}
      />,
    );
    const swatches = screen.getAllByRole("button", { name: /Color #/ });
    expect(swatches).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Small" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medium" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Large" })).toBeInTheDocument();
  });

  it("calls onTextColorChange when a color swatch is clicked", () => {
    const onTextColorChange = vi.fn();
    render(
      <Toolbar
        image={mockImage}
        activeTool="text"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        textColor="#000000"
        onTextColorChange={onTextColorChange}
        textSize="medium"
        onTextSizeChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Color #FF0000" }));
    expect(onTextColorChange).toHaveBeenCalledWith("#FF0000");
  });

  it("calls onTextSizeChange when a size button is clicked", () => {
    const onTextSizeChange = vi.fn();
    render(
      <Toolbar
        image={mockImage}
        activeTool="text"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        textColor="#000000"
        onTextColorChange={() => {}}
        textSize="medium"
        onTextSizeChange={onTextSizeChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Large" }));
    expect(onTextSizeChange).toHaveBeenCalledWith("large");
  });

  it("active color swatch has the active CSS class", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="text"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        textColor="#FF0000"
        onTextColorChange={() => {}}
        textSize="medium"
        onTextSizeChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Color #FF0000" })).toHaveClass(
      "toolbar-color-swatch--active",
    );
    expect(
      screen.getByRole("button", { name: "Color #000000" }),
    ).not.toHaveClass("toolbar-color-swatch--active");
  });

  it("active size button has the active CSS class", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="text"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        {...defaultTextProps}
        textSize="large"
      />,
    );
    expect(screen.getByRole("button", { name: "Large" })).toHaveClass(
      "toolbar-size-btn--active",
    );
    expect(screen.getByRole("button", { name: "Small" })).not.toHaveClass(
      "toolbar-size-btn--active",
    );
  });
});
