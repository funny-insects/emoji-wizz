import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { SpeechBubbleModal } from "./SpeechBubbleModal";

describe("SpeechBubbleModal", () => {
  it("renders with a text input and two buttons", () => {
    render(<SpeechBubbleModal onPlace={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("textbox")).not.toBeNull();
    expect(screen.getByText("Place")).not.toBeNull();
    expect(screen.getByText("Cancel")).not.toBeNull();
  });

  it("calls onPlace with the input text when Place is clicked", () => {
    const onPlace = vi.fn();
    render(<SpeechBubbleModal onPlace={onPlace} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hello!" } });
    fireEvent.click(screen.getByText("Place"));
    expect(onPlace).toHaveBeenCalledTimes(1);
    expect(onPlace).toHaveBeenCalledWith("Hello!");
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<SpeechBubbleModal onPlace={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();
    render(<SpeechBubbleModal onPlace={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onPlace with the input text when Enter is pressed", () => {
    const onPlace = vi.fn();
    render(<SpeechBubbleModal onPlace={onPlace} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Nice!" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onPlace).toHaveBeenCalledTimes(1);
    expect(onPlace).toHaveBeenCalledWith("Nice!");
  });
});
