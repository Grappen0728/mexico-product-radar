import { describe, expect, it } from "vitest";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";
import { makeDailyBrief } from "./fixtures/daily-brief";
import type { DailyPlatformBrief } from "../app/lib/daily-briefs/types";

function makeAuditedBrief(): DailyPlatformBrief {
  const brief = makeDailyBrief();
  for (const recommendation of brief.recommendations) {
    const report = recommendation.report;
    report.trend.evidence = report.trend.evidence.map((item, index) => ({
      ...item,
      publisher: index === 0 ? "Official Marketplace" : "Google",
      grade: index === 0 ? "A" : "C",
      sourceType: index === 0 ? "official-platform" : "independent-trend",
      accessState: "available",
      supports: index === 0
        ? ["price", "sold", "rating", "reviews", "discount", "demand", "trend"]
        : ["demand", "trend"],
      geo: "MX",
      timeWindow: "过去90天",
      checkedAt: brief.sourcesCheckedAt,
      isEstimated: false,
    }));
    report.sources = [
      { ...report.trend.evidence[0] },
      { ...report.trend.evidence[1] },
      {
        title: "制造商规格",
        url: `https://example.com/${report.slug}/manual.pdf`,
        capturedAt: brief.date,
        publisher: "Product Manufacturer",
        grade: "D",
        sourceType: "manufacturer-spec",
        accessState: "available",
        supports: ["specification"],
        geo: "GLOBAL",
        timeWindow: "当前规格",
        checkedAt: brief.sourcesCheckedAt,
        isEstimated: false,
      },
    ];
    report.media = [];
  }
  return brief;
}

describe("daily three-platform brief validation", () => {
  it("accepts exactly three unique platform recommendations", () => {
    const result = validateDailyBrief(makeDailyBrief());
    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations[1].channel).toBe("temu-mx");
    expect(result.recommendations[1].report.platforms).toEqual(["TM"]);
  });

  it("rejects Amazon as the second channel in new daily briefs", () => {
    const brief = makeDailyBrief() as unknown as { recommendations: Array<{ channel: string; report: { platforms: string[] } }> };
    brief.recommendations[1].channel = "amazon-mx";
    brief.recommendations[1].report.platforms = ["AMZ"];
    expect(() => validateDailyBrief(brief)).toThrow("平台顺序必须为TikTok、Temu、Mercado Libre");
  });

  it("rejects duplicate products across platforms", () => {
    const brief = makeDailyBrief();
    brief.recommendations[1].report.slug = brief.recommendations[0].report.slug;
    expect(() => validateDailyBrief(brief)).toThrow("产品不能重复");
  });

  it("rejects competition opportunity scores outside one to five", () => {
    const brief = makeDailyBrief();
    brief.recommendations[2].scores.competitionOpportunity = 0;
    expect(() => validateDailyBrief(brief)).toThrow("竞争机会评分");
  });

  it("rejects exact sales metrics backed only by a blocked page", () => {
    const brief = makeAuditedBrief();
    const report = brief.recommendations[0].report;
    report.sources[0].accessState = "blocked";
    report.trend.evidence[0].accessState = "blocked";
    expect(() => validateDailyBrief(brief)).toThrow("精确指标缺少官方或授权来源");
  });

  it("rejects a hot claim when both demand signals have the same publisher", () => {
    const brief = makeAuditedBrief();
    const report = brief.recommendations[0].report;
    report.trend.evidence.forEach((source) => { source.publisher = "Same Publisher"; });
    expect(() => validateDailyBrief(brief)).toThrow("两个独立发布方");
  });

  it("rejects a rising claim without Mexico-local demand evidence", () => {
    const brief = makeAuditedBrief();
    const report = brief.recommendations[0].report;
    report.trend.status = "rising";
    report.trend.evidence.forEach((source) => { source.geo = "GLOBAL"; });
    expect(() => validateDailyBrief(brief)).toThrow("墨西哥本地需求证据");
  });

  it("rejects a TOP 1 score above the evidence confidence cap", () => {
    const brief = makeAuditedBrief();
    const report = brief.recommendations[0].report;
    report.metrics = { price: null, currency: "MXN", sold: null, rating: null, reviews: null, discount: null };
    report.trend.status = "stable";
    report.trend.evidence.forEach((source) => { source.supports = []; });
    report.sources = report.sources.filter((source) => source.supports?.includes("specification"));
    expect(() => validateDailyBrief(brief)).toThrow("超过证据可信度允许上限");
  });
});
