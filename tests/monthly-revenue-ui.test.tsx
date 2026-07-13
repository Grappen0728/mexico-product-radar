import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MonthlyRevenueCard } from "../app/components/monthly-revenue-card";
import { makeReport } from "./fixtures/report";

function reportWithRevenue() {
  return makeReport({
    monthlyRevenueEstimate: {
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
    },
  });
}

describe("MonthlyRevenueCard", () => {
  it("renders an auditable USD range and its evidence", () => {
    const html = renderToStaticMarkup(<MonthlyRevenueCard report={reportWithRevenue()} />);
    expect(html).toContain("单链接月销售额预估");
    expect(html).toContain("US$1,000–US$1,200 / 月");
    expect(html).toContain("2026-06");
    expect(html).toContain("可信度：高");
    expect(html).toContain("Banco de México");
    expect(html).toContain("https://articulo.mercadolibre.com.mx/example");
  });

  it("renders an honest unavailable state for legacy reports", () => {
    const html = renderToStaticMarkup(<MonthlyRevenueCard report={makeReport()} />);
    expect(html).toContain("暂无可靠估算");
    expect(html).not.toContain("US$0");
  });
});
