import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { ThreePlatformBrief } from "../../components/three-platform-brief";
import { getDailyBrief } from "../../lib/daily-briefs/server";

export default async function DailyBriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const brief = await getDailyBrief(slug);
  if (!brief) return <><SiteHeader /><main className="shell"><div className="empty-state"><h1>没有找到这期日报</h1><Link href="/">返回今日推荐</Link></div></main></>;
  return <><SiteHeader /><main className="shell detail-shell"><Link href="/" className="back-link">← 返回首页</Link><div className="page-heading"><span className="eyebrow">{brief.date} · DAILY BRIEF</span><h1>墨西哥三平台选品简报</h1><p>三款不同的带电带芯片产品，按平台机会分别评估</p></div><ThreePlatformBrief brief={brief} />{brief.recommendations.map((recommendation) => <section className="panel platform-analysis" key={recommendation.channel}><h2>{recommendation.report.product.zh}：详细分析</h2><ol>{recommendation.analysis.map((item) => <li key={item}>{item}</li>)}</ol><dl><div><dt>电池/供电</dt><dd>{recommendation.report.electronics.battery}</dd></div><div><dt>充电规格</dt><dd>{recommendation.report.electronics.charging}</dd></div><div><dt>芯片功能</dt><dd>{recommendation.report.electronics.chip}</dd></div></dl><div className="source-list">{recommendation.report.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.note ?? "查看公开来源"}</span><small>核查日期：{source.capturedAt} →</small></a>)}</div></section>)}</main></>;
}
