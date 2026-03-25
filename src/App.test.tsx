import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders a canvas element", () => {
    render(<App />);
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });
});
