import { describe, expect, it } from "vitest";
import { calculateExportDimensions, estimateFileSize, getExportMime, sanitizeFilename } from "../utils/logo/exportUtils.js";

describe("getExportMime", () => {
  it("returns png mime", () => {
    expect(getExportMime("png")).toBe("image/png");
  });

  it("returns pdf mime", () => {
    expect(getExportMime("pdf")).toBe("application/pdf");
  });
});

describe("calculateExportDimensions", () => {
  it("applies multiplier", () => {
    expect(calculateExportDimensions(500, 300, 2)).toEqual({ w: 1000, h: 600 });
  });
});

describe("estimateFileSize", () => {
  it("returns kb string", () => {
    expect(estimateFileSize(500, 300, 2)).toMatch(/KB$/);
  });
});

describe("sanitizeFilename", () => {
  it("replaces unsafe chars", () => {
    expect(sanitizeFilename("brand kit (v1)")).toBe("brand_kit__v1_");
  });
});
