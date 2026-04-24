import { describe, expect, it } from "vitest";
import { applyBrightness, filterStringFromAdjustments, rgbShiftForTemperature } from "../utils/editorUtils.js";

describe("applyBrightness", () => {
  it("value 0 is no change", () => {
    expect(applyBrightness(0)).toBe(1);
  });

  it("+100 is softly capped for natural output", () => {
    expect(applyBrightness(100)).toBeLessThanOrEqual(1.18);
  });

  it("-100 is softly capped to preserve detail", () => {
    expect(applyBrightness(-100)).toBeGreaterThanOrEqual(0.82);
  });
});

describe("rgbShiftForTemperature", () => {
  it("warm shifts red up and blue down", () => {
    const result = rgbShiftForTemperature(100, 120, 140, 50);
    expect(result.r).toBeGreaterThan(100);
    expect(result.b).toBeLessThan(140);
  });
});

describe("filterStringFromAdjustments", () => {
  it("builds css filter string", () => {
    const result = filterStringFromAdjustments({ brightness: 10, contrast: 5, saturation: 8, blur: 2, hue: 180, presetFilter: "none" });
    expect(result).toContain("brightness(");
    expect(result).toContain("contrast(");
    expect(result).toContain("hue-rotate(180deg)");
  });

  it("applies core adjustments in stable order", () => {
    const result = filterStringFromAdjustments({ brightness: 5, contrast: 5, saturation: 5 });
    const brightnessIndex = result.indexOf("brightness(");
    const contrastIndex = result.indexOf("contrast(");
    const saturationIndex = result.indexOf("saturate(");

    expect(brightnessIndex).toBeLessThan(contrastIndex);
    expect(contrastIndex).toBeLessThan(saturationIndex);
  });
});
