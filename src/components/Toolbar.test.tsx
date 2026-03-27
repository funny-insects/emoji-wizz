import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";

const mockImage = new Image();

const defaultTextProps: {
  brushColor: string;
  onBrushColorChange: () => void;
  brushSize: number;
  onBrushSizeChange: () => void;
  eraserSize: number;
  onEraserSizeChange: () => void;
  textColor: string;
  onTextColorChange: () => void;
  textSize: number;
  onTextSizeChange: () => void;
  onOpenBgRemoval: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onCropConfirm: () => void;
  onCropCancel: () => void;
} = {
  brushColor: "#000000",
  onBrushColorChange: () => {},
  brushSize: 3,
  onBrushSizeChange: () => {},
  eraserSize: 12,
  onEraserSizeChange: () => {},
  textColor: "#000000",
  onTextColorChange: () => {},
  textSize: 18,
  onTextSizeChange: () => {},
  onOpenBgRemoval: () => {},
  onRotateLeft: () => {},
  onRotateRight: () => {},
  onFlipHorizontal: () => {},
  onFlipVertical: () => {},
  onCropConfirm: () => {},
  onCropCancel: () => {},
};

describe("Toolbar", () => {
  it("renders all tool buttons when image is provided", () => {
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
    expect(
      screen.getByRole("button", { name: "Remove BG" }),
    ).toBeInTheDocument();
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

  it("Remove BG button is disabled when image is null", () => {
    render(
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
    // Toolbar returns null when image is null, so the button is not present
    expect(
      screen.queryByRole("button", { name: "Remove BG" }),
    ).not.toBeInTheDocument();
  });

  it("Remove BG button never has the active class", () => {
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
    expect(screen.getByRole("button", { name: "Remove BG" })).not.toHaveClass(
      "toolbar-btn--active",
    );
  });

  it("Remove BG button calls onOpenBgRemoval", () => {
    const onOpenBgRemoval = vi.fn();
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
        onOpenBgRemoval={onOpenBgRemoval}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove BG" }));
    expect(onOpenBgRemoval).toHaveBeenCalledTimes(1);
  });

  it("renders eraser size slider when eraser tool is active", () => {
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
    expect(screen.getByRole("slider", { name: "Size" })).toBeInTheDocument();
  });

  it("does not render eraser size slider when brush tool is active", () => {
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
    expect(
      screen.queryByRole("slider", { name: "Size" }),
    ).not.toBeInTheDocument();
  });
});

describe("Toolbar — text tool settings", () => {
  it("does not render color swatches or size input when tool is not text", () => {
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
    expect(screen.queryByLabelText("px")).not.toBeInTheDocument();
  });

  it("renders 8 color swatches and size buttons when text tool is active", () => {
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
    expect(screen.getByRole("button", { name: "S" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "M" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "L" })).toBeInTheDocument();
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
        {...defaultTextProps}
        textColor="#000000"
        onTextColorChange={onTextColorChange}
        textSize={18}
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
        {...defaultTextProps}
        textColor="#000000"
        onTextColorChange={() => {}}
        textSize={18}
        onTextSizeChange={onTextSizeChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    expect(onTextSizeChange).toHaveBeenCalledWith(32);
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
        {...defaultTextProps}
        textColor="#FF0000"
        onTextColorChange={() => {}}
        textSize={18}
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

  it("active size button reflects the current textSize value", () => {
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
        textSize={32}
      />,
    );
    expect(screen.getByRole("button", { name: "L" })).toHaveClass(
      "toolbar-btn--active",
    );
    expect(screen.getByRole("button", { name: "S" })).not.toHaveClass(
      "toolbar-btn--active",
    );
    expect(screen.getByRole("button", { name: "M" })).not.toHaveClass(
      "toolbar-btn--active",
    );
  });
});
