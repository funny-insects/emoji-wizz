import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OptimizerPanel } from "./OptimizerPanel";

const baseProps = {
  hasImage: false,
  onAnalyze: () => {},
  suggestions: null,
  customEmojiDataUrl: null,
  referenceEmojiSrc: "/reference.png",
};

describe("OptimizerPanel", () => {
  it("Analyze button is disabled when hasImage is false", () => {
    render(<OptimizerPanel {...baseProps} hasImage={false} />);
    expect(screen.getByRole("button", { name: "Analyze" })).toBeDisabled();
  });

  it("Analyze button is enabled when hasImage is true", () => {
    render(<OptimizerPanel {...baseProps} hasImage={true} />);
    expect(screen.getByRole("button", { name: "Analyze" })).not.toBeDisabled();
  });

  it("results section is absent when suggestions is null", () => {
    render(<OptimizerPanel {...baseProps} suggestions={null} />);
    expect(screen.queryByText("Looks good!")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows 'Looks good!' when suggestions is empty array", () => {
    render(<OptimizerPanel {...baseProps} suggestions={[]} />);
    expect(screen.getByText(/looks good/i)).toBeInTheDocument();
  });

  it("renders suggestion text when suggestions has items", () => {
    render(
      <OptimizerPanel
        {...baseProps}
        suggestions={["Trim transparent padding"]}
      />,
    );
    const item = screen.getByText("Trim transparent padding");
    expect(item).toBeInTheDocument();
  });

  it("renders two images with the same src on dark and light backgrounds", () => {
    render(
      <OptimizerPanel
        {...baseProps}
        suggestions={[]}
        customEmojiDataUrl="data:image/png;base64,test"
      />,
    );
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute("src", "data:image/png;base64,test");
    expect(images[1]).toHaveAttribute("src", "data:image/png;base64,test");
    expect(images[2]).toHaveAttribute("src", "/reference.png");
  });
});
