import { describe, expect, it } from "vitest";
import { generateCssClass, packSprites, sanitizeCssClassName } from "../utils/spriteUtils.js";

describe("packSprites", () => {
  it("returns non-overlapping rectangles", () => {
    const { packed } = packSprites([
      { name: "a", width: 50, height: 40 },
      { name: "b", width: 60, height: 30 },
      { name: "c", width: 20, height: 20 },
    ]);

    for (let i = 0; i < packed.length; i++) {
      for (let j = i + 1; j < packed.length; j++) {
        const A = packed[i];
        const B = packed[j];
        const overlap = A.x < B.x + B.width && A.x + A.width > B.x && A.y < B.y + B.height && A.y + A.height > B.y;
        expect(overlap).toBe(false);
      }
    }
  });

  it("sheet dimensions contain all sprites", () => {
    const { packed, width, height } = packSprites([{ name: "x", width: 40, height: 40 }]);
    const item = packed[0];
    expect(item.x + item.width).toBeLessThanOrEqual(width);
    expect(item.y + item.height).toBeLessThanOrEqual(height);
  });
});

describe("generateCssClass", () => {
  it("builds background-position class", () => {
    const css = generateCssClass({ classPrefix: "sprite-", spriteName: "icon-home", x: 32, y: 10, width: 24, height: 24 });
    expect(css).toContain("background-position: -32px -10px");
  });
});

describe("sanitizeCssClassName", () => {
  it("removes invalid chars", () => {
    expect(sanitizeCssClassName("Icon Home!.png")).toBe("icon-home");
  });
});
