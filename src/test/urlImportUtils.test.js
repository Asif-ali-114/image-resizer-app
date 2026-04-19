import { describe, expect, it } from "vitest";
import { inferFilenameFromUrl, isValidImageUrl } from "../utils/urlImportUtils.js";

describe("isValidImageUrl", () => {
  it("accepts common image URLs", () => {
    expect(isValidImageUrl("https://cdn.site/image.jpg")).toBe(true);
    expect(isValidImageUrl("https://cdn.site/image.png?size=xl")).toBe(true);
    expect(isValidImageUrl("https://cdn.site/image.webp")).toBe(true);
  });

  it("rejects non-image URLs", () => {
    expect(isValidImageUrl("https://site.com/page.html")).toBe(false);
    expect(isValidImageUrl("not-a-url")).toBe(false);
  });
});

describe("inferFilenameFromUrl", () => {
  it("extracts filename correctly", () => {
    expect(inferFilenameFromUrl("https://site.com/images/pic-file.png")).toBe("pic-file.png");
  });

  it("falls back to imported-image", () => {
    expect(inferFilenameFromUrl("https://site.com/gallery/")).toBe("imported-image");
  });
});
