import { describe, expect, it } from "vitest";
import {
  canConvert,
  formatLabel,
  getFormatAccept,
  isLossyFormat,
  needsBackgroundFill,
} from "../utils/convertUtils.js";

describe("needsBackgroundFill", () => {
  it("returns true for png to jpeg", () => {
    expect(needsBackgroundFill("png", "jpeg")).toBe(true);
  });

  it("returns false for jpeg to png", () => {
    expect(needsBackgroundFill("jpeg", "png")).toBe(false);
  });

  it("returns true for webp to bmp", () => {
    expect(needsBackgroundFill("webp", "bmp")).toBe(true);
  });

  it("returns false for jpeg to webp", () => {
    expect(needsBackgroundFill("jpeg", "webp")).toBe(false);
  });
});

describe("canConvert", () => {
  it("supports jpeg to png", () => {
    expect(canConvert("jpeg", "png")).toBe(true);
  });

  it("supports png to webp", () => {
    expect(canConvert("png", "webp")).toBe(true);
  });

  it("blocks svg to ico", () => {
    expect(canConvert("svg", "ico")).toBe(false);
  });

  it("allows gif to jpeg", () => {
    expect(canConvert("gif", "jpeg")).toBe(true);
  });
});

describe("isLossyFormat", () => {
  it("returns true for jpeg", () => {
    expect(isLossyFormat("jpeg")).toBe(true);
  });

  it("returns false for png", () => {
    expect(isLossyFormat("png")).toBe(false);
  });

  it("returns true for webp", () => {
    expect(isLossyFormat("webp")).toBe(true);
  });
});

describe("formatLabel", () => {
  it("returns JPEG label", () => {
    expect(formatLabel("jpeg")).toBe("JPEG");
  });

  it("returns WebP label", () => {
    expect(formatLabel("webp")).toBe("WebP");
  });

  it("returns AVIF label", () => {
    expect(formatLabel("avif")).toBe("AVIF");
  });
});

describe("getFormatAccept", () => {
  it("returns a comma-separated list of accepted input MIME types", () => {
    const accept = getFormatAccept();
    expect(accept).toContain("image/jpeg");
    expect(accept).toContain("image/png");
    expect(accept).toContain("image/webp");
    expect(accept).toContain("image/gif");
    expect(accept).toContain("image/tiff");
    expect(accept).toContain("image/bmp");
    expect(accept).toContain("image/avif");
    expect(accept).toContain("image/x-icon");
    expect(accept).toContain("image/svg+xml");
  });
});
