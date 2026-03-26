import { describe, it, expect } from "vitest";
import { strengthToTolerance } from "./strengthToTolerance";

describe("strengthToTolerance", () => {
  it("maps 1 to 1", () => {
    expect(strengthToTolerance(1)).toBe(1);
  });

  it("maps 25 to 32", () => {
    expect(strengthToTolerance(25)).toBe(32);
  });

  it("maps 50 to 64", () => {
    expect(strengthToTolerance(50)).toBe(64);
  });

  it("maps 100 to 128", () => {
    expect(strengthToTolerance(100)).toBe(128);
  });
});
