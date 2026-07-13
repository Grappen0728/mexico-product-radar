import type { DailyPlatformBrief } from "../lib/daily-briefs/types";

export function DailyRanking({ brief }: { brief: DailyPlatformBrief }) {
  const productNames = new Map(brief.recommendations.map((item) => [item.report.slug, item.report.product.zh]));
  return <section className="ranking-panel"><div><span className="eyebrow">TODAY&apos;S RANKING</span><h2>今日三个产品排名</h2><ol>{[...brief.ranking].sort((left, right) => left.rank - right.rank).map((item) => <li key={item.productSlug}><b>TOP {item.rank}</b><span><strong>{productNames.get(item.productSlug)}</strong>{item.reason}</span><em>{item.score}</em></li>)}</ol></div><aside><span>如果只能测试一个产品</span><h3>{productNames.get(brief.priorityPick.productSlug)}</h3><p>{brief.priorityPick.reason}</p></aside></section>;
}
