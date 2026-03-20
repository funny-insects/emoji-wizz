import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the Emoji Wizz heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /emoji wizz/i })).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<App />);
    expect(screen.getByText(/create custom emojis/i)).toBeInTheDocument();
  });
});
