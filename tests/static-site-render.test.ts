import { describe, expect, it } from "vitest";
import { SAMPLE_REPORT } from "../app/lib/recommendations/sample";
import { makeReport } from "./fixtures/report";
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

it("embeds verified image thumbnails and explains unavailable videos", () => {
  const report = makeReport({
    media: [
      {
        type: "image",
        title: "官方产品图",
        url: "https://example.com/product",
        thumbnailUrl: "https://example.com/product.jpg",
        accessState: "available",
        direct: true,
        checkedAt: "2026-07-13T10:00:00+08:00",
        sourceTitle: "Official Brand",
      },
      {
        type: "video",
        title: "搜索页（已排除）",
        url: "https://www.youtube.com/results?search_query=product",
        accessState: "invalid",
        direct: false,
        checkedAt: "2026-07-13T10:00:00+08:00",
        sourceTitle: "YouTube",
      },
    ],
  });
  const html = renderRecommendation(report, { basePath: "/mexico-product-radar" });
  expect(html).toContain('<img src="https://example.com/product.jpg"');
  expect(html).toContain("当前暂无可验证视频");
  expect(html).not.toContain('href="https://www.youtube.com/results?search_query=product"');
});
