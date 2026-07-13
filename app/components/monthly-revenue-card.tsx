import { calculateMonthlyRevenueUsd, formatUsdRange } from "../lib/recommendations/monthly-revenue";
import type { RecommendationReport } from "../lib/recommendations/types";

const confidenceLabels = { high: "高", medium: "中", low: "低" } as const;

export function MonthlyRevenueCard({ report }: { report: RecommendationReport }) {
  const estimate = report.monthlyRevenueEstimate;
  const result = calculateMonthlyRevenueUsd(estimate);

  if (result.status === "unavailable" || !estimate || estimate.status !== "available") {
    return <section className="monthly-revenue-card monthly-revenue-card--unavailable">
      <span>单链接月销售额预估</span>
      <strong>暂无可靠估算</strong>
      <p>{result.status === "unavailable" ? result.reason : "暂无可靠估算"}</p>
    </section>;
  }

  return <section className="monthly-revenue-card">
    <span>单链接月销售额预估</span>
    <strong>{formatUsdRange(result.revenueUsdMin, result.revenueUsdMax)}</strong>
    <div className="monthly-revenue-grid">
      <small>周期：{estimate.period}</small>
      <small>月销量：{estimate.estimatedMonthlyUnitsMin}–{estimate.estimatedMonthlyUnitsMax}</small>
      <small>可信度：{confidenceLabels[estimate.confidence!]}</small>
      <small>汇率：{estimate.unitPriceCurrency === "USD" ? "原价为美元" : `1 USD = ${estimate.mxnPerUsd} MXN`}</small>
    </div>
    <p>{estimate.method}</p>
    <div className="monthly-revenue-links">
      <a href={estimate.sourceProductUrl!} target="_blank" rel="noreferrer">查看商品单链接 ↗</a>
      {estimate.fxSourceUrl && <a href={estimate.fxSourceUrl} target="_blank" rel="noreferrer">{estimate.fxPublisher} · {estimate.fxCapturedAt} ↗</a>}
    </div>
  </section>;
}
