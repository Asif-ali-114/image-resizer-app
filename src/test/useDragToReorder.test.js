import { describe, expect, it } from "vitest";
import { reorder } from "../hooks/useDragToReorder.js";

describe("reorder", () => {
  it("moves item from index 0 to 2", () => {
    const result = reorder(["a", "b", "c", "d"], 0, 2);
    expect(result).toEqual(["b", "c", "a", "d"]);
  });

  it("moves last item to first", () => {
    const result = reorder(["a", "b", "c"], 2, 0);
    expect(result).toEqual(["c", "a", "b"]);
  });
});
