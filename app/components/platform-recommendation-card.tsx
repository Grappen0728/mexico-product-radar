import Link from "next/link";
import type { PlatformRecommendation } from "../lib/daily-briefs/types";
import { assessEvidenceQuality } from "../lib/recommendations/evidence-quality";

const CHANNEL_LABELS = { "tiktok-mx": "TikTok Shop Mexico", "temu-mx": "Temu Mexico", "mercado-libre-mx": "Mercado Libre Mexico" } as const;

function Stars({ value }: { value: number }) { return <span className="star-score" aria-label={`${value}星`}>{"★".repeat(value)}{"☆".repeat(5 - value)}</span>; }

export function PlatformRecommendationCard({ recommendation }: { recommendation: PlatformRecommendation }) {
  const { report, scores, commercialModel } = recommendation;
  const quality = assessEvidenceQuality(report);
  const confidence = { high: "高", medium: "中", low: "低" }[quality.confidence];
  const potentialLabel = recommendation.channel === "tiktok-mx" ? "视频传播" : recommendation.channel === "temu-mx" ? "点击转化" : "销售潜力";
  const scoreRows = [["市场需求", scores.demand], ["竞争机会", scores.competitionOpportunity], ["利润空间", scores.profit], ["平台适配", scores.platformFit], [potentialLabel, scores.contentOrSalesPotential]] as const;
  return <article className="platform-card">
    <div className="platform-card__heading"><span>{CHANNEL_LABELS[recommendation.channel]}</span><b>{report.trend.label}</b></div>
    <h3>{report.product.zh}</h3><p className="platform-card__subtitle">{report.product.es}</p><p>{recommendation.whyRecommended}</p>
    <div className={`evidence-summary evidence-summary--${quality.confidence}`}><div><span>数据可信度</span><strong>{confidence}</strong></div><div><span>证据覆盖</span><strong>{quality.coveragePercent}%</strong></div><div><span>有效来源</span><strong>{quality.usableSourceCount}</strong></div><div><span>墨西哥证据</span><strong>{quality.localEvidenceCount}</strong></div><small>最后核查：{quality.lastCheckedAt ?? "暂无可核查时间"}</small></div>
    <div className="score-list">{scoreRows.map(([label, value]) => <div key={label}><span>{label}</span><Stars value={value} /></div>)}</div>
    <div className="platform-playbook"><strong>{recommendation.channel === "tiktok-mx" ? "短视频切入点" : recommendation.channel === "temu-mx" ? "Temu商品打法" : "平台销售打法"}</strong><ol>{recommendation.platformPlaybook.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ol></div>
    <div className="commercial-grid"><div><span>采购成本</span><strong>{commercialModel.purchaseCost}</strong></div><div><span>建议售价</span><strong>{commercialModel.suggestedPrice}</strong></div><div><span>预估利润</span><strong>{commercialModel.estimatedProfit}</strong></div></div>
    <p className="test-advice"><strong>测试建议：</strong>{recommendation.testAdvice}</p><Link href={`/recommendations/${report.slug}`}>查看产品完整数据与来源 →</Link>
  </article>;
}
