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
    expect(screen.getByText("Looks good!")).toBeInTheDocument();
  });

  it("renders suggestion in a list item", () => {
    render(
      <OptimizerPanel
        {...baseProps}
        suggestions={["Trim transparent padding"]}
      />,
    );
    const item = screen.getByText("Trim transparent padding");
    expect(item.tagName.toLowerCase()).toBe("li");
    expect(item).toBeInTheDocument();
  });
});
