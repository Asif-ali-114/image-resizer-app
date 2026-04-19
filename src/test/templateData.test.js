import { describe, expect, it } from "vitest";
import { TEMPLATE_CATEGORIES, TEMPLATES, getTemplateById, searchTemplates } from "../utils/logo/templateData.js";

describe("templateData", () => {
  it("includes required categories", () => {
    expect(TEMPLATE_CATEGORIES).toContain("All Templates");
    expect(TEMPLATE_CATEGORIES).toContain("Social Media Post");
  });

  it("has at least 40 templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(40);
  });

  it("finds a template by id", () => {
    const first = TEMPLATES[0];
    expect(getTemplateById(first.id)?.name).toBe(first.name);
  });

  it("searches by query and category", () => {
    const business = searchTemplates("business", "Business & Corporate");
    expect(business.every((t) => t.category === "Business & Corporate")).toBe(true);
  });
});
