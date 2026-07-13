import { describe, expect, it } from "vitest";
import { validateReport } from "../app/lib/recommendations/validate";
import { makeReport } from "./fixtures/report";

describe("validateReport", () => {
  it("accepts a complete report", () => {
    expect(validateReport(makeReport()).slug).toBe("mini-thermal-printer");
  });

  it("rejects a source without a capture date", () => {
    const report = makeReport({
      sources: [{ title: "来源", url: "https://example.com", capturedAt: "" }],
    });
    expect(() => validateReport(report)).toThrow(/来源.*日期/);
  });

  it("rejects non-https media URLs", () => {
    const report = makeReport({
      media: [{ type: "image", title: "危险链接", url: "javascript:alert(1)" }],
    });
    expect(() => validateReport(report)).toThrow(/HTTPS/);
  });

  it("requires at least two trend signals", () => {
    const report = makeReport({
      trend: { ...makeReport().trend, evidence: [makeReport().trend.evidence[0]] },
    });
    expect(() => validateReport(report)).toThrow(/两条趋势证据/);
  });

  it("keeps legacy reports without monthly revenue estimates valid", () => {
    const report = makeReport();
    expect(() => validateReport(report)).not.toThrow();
  });

  it.each([
    ["negative units", { estimatedMonthlyUnitsMin: -1 }, /月销量/],
    ["reversed bounds", { estimatedMonthlyUnitsMin: 121, estimatedMonthlyUnitsMax: 120 }, /上下限/],
    ["zero exchange rate", { mxnPerUsd: 0 }, /汇率/],
    ["unsafe product URL", { sourceProductUrl: "http://example.test/product" }, /HTTPS/],
  ])("rejects invalid monthly revenue evidence: %s", (_name, overrides, error) => {
    const report = makeReport() as ReturnType<typeof makeReport> & { monthlyRevenueEstimate: Record<string, unknown> };
    report.monthlyRevenueEstimate = {
      status: "available",
      sourceProductUrl: "https://articulo.mercadolibre.com.mx/example",
      period: "2026-06",
      estimatedMonthlyUnitsMin: 100,
      estimatedMonthlyUnitsMax: 120,
      unitPrice: 200,
      unitPriceCurrency: "MXN",
      mxnPerUsd: 20,
      fxCapturedAt: "2026-07-13",
      fxSourceUrl: "https://www.banxico.org.mx/example",
      fxPublisher: "Banco de México",
      method: "平台近30天销量区间 × 商品单价",
      confidence: "high",
      sourceUrls: ["https://articulo.mercadolibre.com.mx/example"],
      unavailableReason: null,
      ...overrides,
    };
    expect(() => validateReport(report)).toThrow(error);
  });

  it("requires an unavailable reason instead of a fabricated amount", () => {
    const report = makeReport() as ReturnType<typeof makeReport> & { monthlyRevenueEstimate: Record<string, unknown> };
    report.monthlyRevenueEstimate = { status: "unavailable", unavailableReason: "" };
    expect(() => validateReport(report)).toThrow(/无法估算原因/);
  });
});
