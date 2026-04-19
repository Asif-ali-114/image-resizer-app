import { describe, expect, it } from "vitest";
import { buildFilename, generateRegularPolygon, generateStarPoints, sanitizeFilename } from "../utils/logo/fabricHelpers.js";

describe("sanitizeFilename", () => {
  it("normalizes spaces and unsafe chars", () => {
    expect(sanitizeFilename("My Logo@2026!")).toBe("My_Logo_2026_");
  });
});

describe("buildFilename", () => {
  it("appends extension to sanitized base name", () => {
    expect(buildFilename("Summer Campaign", "png")).toBe("Summer_Campaign.png");
  });
});

describe("generateStarPoints", () => {
  it("returns 2n points for n star points", () => {
    const points = generateStarPoints(6, 80, 30);
    expect(points).toHaveLength(12);
  });
});

describe("generateRegularPolygon", () => {
  it("returns one point per side", () => {
    const points = generateRegularPolygon(7, 40);
    expect(points).toHaveLength(7);
  });
});
