import type { MonthlyRevenueEstimate } from "./types";

export type MonthlyRevenueResult =
  | { status: "available"; revenueUsdMin: number; revenueUsdMax: number }
  | { status: "unavailable"; reason: string };

export function calculateMonthlyRevenueUsd(estimate?: MonthlyRevenueEstimate): MonthlyRevenueResult {
  if (!estimate || estimate.status === "unavailable") {
    return {
      status: "unavailable",
      reason: estimate?.unavailableReason?.trim() || "暂无可靠估算",
    };
  }

  const { estimatedMonthlyUnitsMin, estimatedMonthlyUnitsMax, unitPrice, unitPriceCurrency, mxnPerUsd } = estimate;
  if (estimatedMonthlyUnitsMin === null || estimatedMonthlyUnitsMax === null || unitPrice === null) {
    return { status: "unavailable", reason: "暂无可靠估算" };
  }

  const usdFactor = unitPriceCurrency === "USD"
    ? 1
    : mxnPerUsd && mxnPerUsd > 0
      ? 1 / mxnPerUsd
      : null;
  if (usdFactor === null) return { status: "unavailable", reason: "缺少可核查的美元汇率" };

  return {
    status: "available",
    revenueUsdMin: estimatedMonthlyUnitsMin * unitPrice * usdFactor,
    revenueUsdMax: estimatedMonthlyUnitsMax * unitPrice * usdFactor,
  };
}
