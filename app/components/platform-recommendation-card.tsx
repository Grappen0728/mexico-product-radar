import Link from "next/link";
import type { PlatformRecommendation } from "../lib/daily-briefs/types";

const CHANNEL_LABELS = { "tiktok-mx": "TikTok Shop Mexico", "amazon-mx": "Amazon Mexico", "mercado-libre-mx": "Mercado Libre Mexico" } as const;

function Stars({ value }: { value: number }) { return <span className="star-score" aria-label={`${value}星`}>{"★".repeat(value)}{"☆".repeat(5 - value)}</span>; }

export function PlatformRecommendationCard({ recommendation }: { recommendation: PlatformRecommendation }) {
  const { report, scores, commercialModel } = recommendation;
  const scoreRows = [["市场需求", scores.demand], ["竞争机会", scores.competitionOpportunity], ["利润空间", scores.profit], ["平台适配", scores.platformFit], [recommendation.channel === "tiktok-mx" ? "视频传播" : "销售潜力", scores.contentOrSalesPotential]] as const;
  return <article className="platform-card">
    <div className="platform-card__heading"><span>{CHANNEL_LABELS[recommendation.channel]}</span><b>{report.trend.label}</b></div>
    <h3>{report.product.zh}</h3><p className="platform-card__subtitle">{report.product.es}</p><p>{recommendation.whyRecommended}</p>
    <div className="score-list">{scoreRows.map(([label, value]) => <div key={label}><span>{label}</span><Stars value={value} /></div>)}</div>
    <div className="platform-playbook"><strong>{recommendation.channel === "tiktok-mx" ? "短视频切入点" : "平台销售打法"}</strong><ol>{recommendation.platformPlaybook.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ol></div>
    <div className="commercial-grid"><div><span>采购成本</span><strong>{commercialModel.purchaseCost}</strong></div><div><span>建议售价</span><strong>{commercialModel.suggestedPrice}</strong></div><div><span>预估利润</span><strong>{commercialModel.estimatedProfit}</strong></div></div>
    <p className="test-advice"><strong>测试建议：</strong>{recommendation.testAdvice}</p><Link href={`/recommendations/${report.slug}`}>查看产品完整数据与来源 →</Link>
  </article>;
}
