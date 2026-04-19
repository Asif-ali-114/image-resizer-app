import { describe, expect, it } from "vitest";
import { extractPalette, getColorName, rgbToCmyk, rgbToHsl } from "../utils/paletteUtils.js";

describe("rgbToHsl", () => {
  it("converts red correctly", () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
  });
});

describe("rgbToCmyk", () => {
  it("converts red correctly", () => {
    expect(rgbToCmyk(255, 0, 0)).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });
});

describe("getColorName", () => {
  it("maps red", () => {
    expect(getColorName(255, 0, 0)).toBe("red");
  });
});

describe("extractPalette", () => {
  it("returns exactly k colors", () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 0, 255,
      255, 0, 255, 255,
      0, 255, 255, 255,
    ]);

    const palette = extractPalette({ data }, 3, "fast");
    expect(palette).toHaveLength(3);
  });
});
