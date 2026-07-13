import { describe, expect, it } from "vitest";
import { SAMPLE_REPORT } from "../app/lib/recommendations/sample";
import { renderRecommendation, siteHref } from "../app/lib/static-site/render";

describe("GitHub Pages static renderer", () => {
  it("prefixes project-site links with the repository base path", () => {
    expect(siteHref("/mexico-product-radar", "/archive/"))
      .toBe("/mexico-product-radar/archive/");
  });

  it("renders a product detail with source and media links", () => {
    const html = renderRecommendation(SAMPLE_REPORT, { basePath: "/mexico-product-radar" });
    expect(html).toContain(SAMPLE_REPORT.product.zh);
    expect(html).toContain("趋势证据");
    expect(html).toContain(SAMPLE_REPORT.sources[0].url);
    expect(html).toContain("/mexico-product-radar/archive/");
  });
});
