import { expect, it } from "vitest";
import { buildDailyBriefFeishuCard } from "../app/lib/feishu";
import { makeDailyBrief } from "./fixtures/daily-brief";

it("summarizes three products and links the complete daily brief", () => {
  const brief = makeDailyBrief();
  brief.recommendations[0].report.monthlyRevenueEstimate = {
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
  };
  const card = buildDailyBriefFeishuCard(brief, "https://example.com/briefs/2026-07-14/");
  const text = JSON.stringify(card);
  for (const item of brief.recommendations) expect(text).toContain(item.report.product.zh);
  expect(text).toContain("TOP 1");
  expect(text).toContain("Temu Mexico");
  expect(text).not.toContain("Amazon Mexico");
  expect(text).toContain("查看完整三平台日报");
  expect(text).toContain("https://example.com/briefs/2026-07-14/");
  expect(text.match(/单链接月销售额预估/g)).toHaveLength(3);
  expect(text).toContain("US$1,000–US$1,200 / 月");
  expect(text).toContain("暂无可靠估算");
  expect(text).toContain("墨西哥三平台选品简报");
  expect(text).not.toContain("新品简报");
});
