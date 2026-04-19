import { describe, expect, it } from "vitest";
import { calculateImagePosition, sanitizePdfFilename } from "../utils/pdfUtils.js";

describe("calculateImagePosition", () => {
  it("fit mode centers image", () => {
    const result = calculateImagePosition({ pageW: 200, pageH: 300, imageW: 1000, imageH: 1000, margin: 10, mode: "fit" });
    expect(result.x).toBeGreaterThanOrEqual(10);
    expect(result.y).toBeGreaterThanOrEqual(10);
    expect(result.w).toBeLessThanOrEqual(180);
    expect(result.h).toBeLessThanOrEqual(280);
  });

  it("fill mode covers full page inner bounds", () => {
    const result = calculateImagePosition({ pageW: 200, pageH: 300, imageW: 100, imageH: 100, margin: 10, mode: "fill" });
    expect(result).toEqual({ x: 10, y: 10, w: 180, h: 280 });
  });
});

describe("sanitizePdfFilename", () => {
  it("removes special chars", () => {
    expect(sanitizePdfFilename("My*Cool:File?.pdf")).toBe("My_Cool_File_pdf");
  });
});
