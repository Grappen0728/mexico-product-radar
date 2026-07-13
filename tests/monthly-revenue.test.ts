import { describe, expect, it } from "vitest";
import { calculateMonthlyRevenueUsd } from "../app/lib/recommendations/monthly-revenue";
import type { MonthlyRevenueEstimate } from "../app/lib/recommendations/types";

function availableEstimate(overrides: Partial<MonthlyRevenueEstimate> = {}): MonthlyRevenueEstimate {
  return {
    status: "available",
    sourceProductUrl: "https://articulo.mercadolibre.com.mx/example",
    period: "2026-06",
    estimatedMonthlyUnitsMin: 100,
    estimatedMonthlyUnitsMax: 120,
    unitPrice: 200,
    unitPriceCurrency: "MXN",
    mxnPerUsd: 20,
    fxCapturedAt: "2026-07-13",
    fxSourceUrl: "https://www.banxico.org.mx/tipcamb/main.do?page=tip&idioma=sp",
    fxPublisher: "Banco de México",
    method: "平台近30天销量区间 × 商品单价",
    confidence: "high",
    sourceUrls: ["https://articulo.mercadolibre.com.mx/example"],
    unavailableReason: null,
    ...overrides,
  };
}

describe("monthly revenue estimate", () => {
  it("converts a bounded MXN monthly revenue estimate to USD", () => {
    expect(calculateMonthlyRevenueUsd(availableEstimate())).toEqual({
      status: "available",
      revenueUsdMin: 1000,
      revenueUsdMax: 1200,
    });
  });

  it("keeps USD prices in USD without applying MXN exchange rates", () => {
    expect(calculateMonthlyRevenueUsd(availableEstimate({
      unitPrice: 15,
      unitPriceCurrency: "USD",
      mxnPerUsd: null,
    }))).toEqual({
      status: "available",
      revenueUsdMin: 1500,
      revenueUsdMax: 1800,
    });
  });

  it("returns an explicit unavailable result for legacy reports", () => {
    expect(calculateMonthlyRevenueUsd()).toEqual({
      status: "unavailable",
      reason: "暂无可靠估算",
    });
  });

  it("preserves a documented unavailable reason", () => {
    expect(calculateMonthlyRevenueUsd({
      ...availableEstimate(),
      status: "unavailable",
      unavailableReason: "缺少可核查的近30天销量",
    })).toEqual({
      status: "unavailable",
      reason: "缺少可核查的近30天销量",
    });
  });
});
