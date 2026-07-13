import { describe, expect, it } from "vitest";
import { assessEvidenceQuality } from "../app/lib/recommendations/evidence-quality";
import type { RecommendationReport, SourceLink } from "../app/lib/recommendations/types";
import { makeReport } from "./fixtures/report";

function source(overrides: Partial<SourceLink> = {}): SourceLink {
  return {
    title: "Google Trends Mexico",
    url: "https://trends.google.com/trends/explore?geo=MX&q=impresora",
    capturedAt: "2026-07-13",
    publisher: "Google",
    grade: "C",
    sourceType: "independent-trend",
    accessState: "available",
    supports: ["demand", "trend"],
    geo: "MX",
    timeWindow: "过去90天",
    checkedAt: "2026-07-13T22:30:00+08:00",
    isEstimated: false,
    ...overrides,
  };
}

function auditedReport(overrides: Partial<RecommendationReport> = {}): RecommendationReport {
  const official = source({
    title: "TikTok Shop Mexico 商品页",
    url: "https://shop.tiktok.com/view/product/example",
    publisher: "TikTok Shop",
    grade: "A",
    sourceType: "official-platform",
    supports: ["price", "sold", "rating", "reviews", "discount", "demand", "trend"],
  });
  const trend = source();
  return makeReport({
    trend: { status: "hot", label: "双源验证", evidence: [official, trend].map((item) => ({ ...item, signal: "可核验需求信号" })) },
    sources: [official, trend, source({
      title: "制造商规格",
      url: "https://www.example.com/manual.pdf",
      publisher: "Example Manufacturer",
      grade: "D",
      sourceType: "manufacturer-spec",
      supports: ["specification"],
      geo: "GLOBAL",
    })],
    ...overrides,
  });
}

describe("evidence quality assessment", () => {
  it("counts only accessible sources and independent publishers", () => {
    const report = auditedReport();
    report.sources.push(source({
      url: "https://listado.mercadolibre.com.mx/captcha",
      publisher: "Mercado Libre",
      grade: "A",
      sourceType: "official-platform",
      accessState: "blocked",
      supports: ["demand"],
    }));
    const result = assessEvidenceQuality(report);
    expect(result.usableSourceCount).toBe(3);
    expect(result.independentPublisherCount).toBe(3);
    expect(result.localEvidenceCount).toBe(2);
  });

  it("flags exact marketplace metrics without accessible A or B provenance", () => {
    const report = auditedReport();
    report.sources[0].accessState = "login-restricted";
    const result = assessEvidenceQuality(report);
    expect(result.unsupportedExactMetrics).toEqual(["price", "sold", "rating", "reviews", "discount"]);
    expect(result.confidence).toBe("low");
    expect(result.rankingScoreCap).toBeLessThan(88);
  });

  it("requires two usable publishers and Mexico evidence for hot or rising claims", () => {
    const onlyOne = source({ publisher: "One Publisher", geo: "GLOBAL" });
    const report = auditedReport({
      metrics: { price: null, currency: "MXN", sold: null, rating: null, reviews: null, discount: null },
      trend: { status: "rising", label: "待复核", evidence: [
        { ...onlyOne, signal: "全球趋势" },
        { ...onlyOne, url: "https://example.com/second", signal: "同发布方信号" },
      ] },
      sources: [onlyOne],
    });
    const result = assessEvidenceQuality(report);
    expect(result.issues).toContain("趋势判断缺少两个独立发布方的可用需求证据");
    expect(result.issues).toContain("趋势判断缺少墨西哥本地需求证据");
    expect(result.rankingEligible).toBe(false);
  });

  it("assigns high confidence when demand, trend, specifications and exact metrics are covered", () => {
    const result = assessEvidenceQuality(auditedReport());
    expect(result.coveragePercent).toBe(100);
    expect(result.confidence).toBe("high");
    expect(result.unsupportedExactMetrics).toEqual([]);
    expect(result.rankingEligible).toBe(true);
    expect(result.rankingScoreCap).toBe(100);
  });
});
